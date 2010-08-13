###
---
description: Extensions that allow a more functional programming style
license: LGPL
authors: ['Michael Ficarra']
requires: []
provides: [
	FunctionalJS, Function._, Function.empty, Function.identity,
	Function.context, Function.lambda, Function.pluck, Function.invoke,
	Function.sequence, Function.concatenate, Function.concat, Function.compose,
	Function.overload, Function.and, Function.or, Function.xor,
	Function::toFunction, Function::wrap, Function::getOrigin,
	Function::memoize, Function::partial, Function::curry, Function::rcurry,
	Function::not, Function::append, Function::prepend, Function::overload,
	Function::saturate, Function::aritize, Function::getArgs,
	Function::getArity, Function::foreach, Function::each, Function::every,
	Function::some, Function::filter, Function::map, Function::reduce,
	Function::reduceRight, Function::sort, Function::foldl, Function::foldr,
	Array::toFunction, Hash::toFunction, Object.toFunction
]
...
###

((global,undefined) ->

	global = {} unless global?
	Function = (->).constructor


	# constants for Function::traced
	Function.TRACE_ALL = Function.TRACE_NONE = 0
	for constant, n in [
		'TRACE_ARGUMENTS'
		'TRACE_CONTEXT'
		'TRACE_RETURN'
		'TRACE_TIME'
		'TRACE_STACK'
	]
		# calculate powers of two to assign to the constants. this allows
		# any combination of constants to be defined as a single value
		Function.TRACE_ALL |= Function[constant] = 1 << n


	unless Function::overloadSetter?
		Function::overloadSetter = (forceObject) ->
			self = @
			(a,b) ->
				return @ unless a?
				if forceObject or typeof a isnt 'string'
					for k of a
						self.call @, k, a[k]
				else self.call @, a, b
				@

	unless Function::overloadGetter?
		Function::overloadGetter = (forceObject) ->
			self = @
			(prop) ->
				if forceObject or typeof prop isnt 'string'
					args = prop
				else if arguments.length > 1
					args = arguments
				return self.call @, prop unless args
				result = {}
				for arg of args
					result[arg] = self.call @, arg
				result

	unless Function::extend?
		Function::extend = ((name,method) ->
			@[name] =  method unless @[name]?
		).overloadSetter()

	unless Function::implement?
		Function::implement = ((name,method) ->
			unless @prototype[name]?
				@prototype[name] = method
				@constructor.extend name, (context, args...) ->
					method.apply context, args
		).overloadSetter()


	# class methods
	Function.extend {
		_: (_) ->
			caller = arguments.callee.caller or arguments.caller
			return unless caller?
			args = caller.arguments
			# if no index given, set/increment the successive argument iterator
			args._ = (if args._? then args._ += 1 else 0) unless _?
			# return the argument indexed by the given index or the iterator
			args[if _? then _ else args._]
		empty: ->
		identity: (_) ->
			if arguments.length>1 then Array::slice.call arguments else _
		context: -> @
		lambda: (_) -> (-> _)
		pluck: (property) -> (obj) -> obj[property]
		invoke: (method) ->
			defaultArgs = Array::slice.call arguments, 1
			(obj) ->
				args = Array::slice.call arguments, 1
				obj[method].apply obj, (if args.length then args else defaultArgs)
		sequence: ->
			switch arguments.length
				when 0 then Function.empty
				when 1 then arguments[0]
				else
					functions = arguments
					((idx) -> (->
						idx %= functions.length
						functions[idx++].apply(@,arguments)
					)).call @, 0
		concatenate: ->
			functions = arguments
			->
				for fn in functions
					result = fn.apply(@,arguments)
				result
		compose: ->
			functions = Array::slice.call(arguments)
			->
				lastReturn = arguments
				for fn, i in functions.reverse()
					# only the outermost function may be given more than one argument
					lastReturn = fn[if i then 'call' else 'apply'] @, lastReturn
				lastReturn
		overload: (funcTable) ->
			# make a table if only a list of functions was given
			if !arguments.length or funcTable instanceof Function
				newTable = {}
				for fn in arguments
					newTable[fn.getArity()] = fn
				funcTable = newTable
			->
				fn = funcTable[arguments.length]
				return undefined unless fn? and fn instanceof Function
				fn.apply @, arguments
	}

	Function.extend 'concat', Function.concatenate

	bools =
		xor: (a,b) -> !!(!a ^ !b)
		and: (a,b) -> !!(a and b)
		or: (a,b) -> !!(a or b)

	# boolean function logic: Function.and, Function.or, Function.xor
	for opName, op of bools
		Function.extend opName, ->
			switch arguments.length
				# based on the number of functions given...
				when 0
					# generate a function that returns undefined
					Function.empty
				when 1
					# generate a function that returns the Boolean representation
					# of the return value of the given function
					fn = arguments[0]
					-> !!fn.apply @, arguments
				else
					# generate a function that calls each given function consecutively,
					# applying the chosen operator to their return values at each step
					functions = Array::slice.call arguments
					((op)-> (->
						recurse = (functions,args) ->
							if(functions.length is 1)
								return !!functions[0].apply @, args
							else
								first = functions[0].apply @, args
								# short-circuit `and` and `or`
								return !!first if (op is bools.and and !first) or (op is bools.or and first)
								op first, recurse.call(@,functions.slice(1),args)
						recurse.call @, functions, arguments
					))(op)


	# instance methods
	Function.implement {
		toFunction: -> @
		bind: (scope, args...) ->
			self = @curry args
			-> self.apply scope, arguments
		wrap: (fn,bind) ->
			self = @
			wrapper = ->
				args = Array::slice.call arguments
				fn.call @, (if bind? then self.bind bind else self), args
			wrapper._origin = @
			wrapper
		getOrigin: ->
			origin = @
			while origin._origin
				origin = origin._origin
			origin
		memoize: (->
			typeOf = global.typeOf or (_) ->
				return 'undefined' if arguments.length and _ is undefined
				return null unless _?
				switch _.constructor
					when [].constructor then return 'array'
					when /(?:)/.constructor then return 'regexp'
					when {}.constructor then return 'object'
				if !_.nodeName? and typeof _.length is 'number'
					return 'arguments' if _.hasOwnProperty 'callee'
					return 'collection' if _.item?
				typeof item
			arrayCoerce = Array.from or (_) ->
				return [] unless _?
				if _? and typeof _.length is 'number' and _.constructor isnt Function and typeof _ isnt 'string'
					if typeOf(_) is 'array' then _ else Array::slice.call(_)
				else [_]
			every = Array.every or (iterable,fn) ->
				for el, i in iterable
					return false unless fn.call(@, el, i, iterable)
				true
			# used to check if arguments/contexts are functionally equivalent
			equalityCheck = (a,b) ->
				type = typeOf a
				return false unless type is typeOf b
				switch type
					when 'object' then a is b
					when 'regexp' then a.toString() is b.toString()
					when 'array','collection','arguments'
						a.length is b.length and every a, (a_i,i) -> equalityCheck(a_i,b[i])
					else
						a = a?.valueOf()
						b = b?.valueOf()
						# taken from google caja
						if a is b # 0 is not -0
							a isnt 0 or 1/a is 1/b
						else # NaN is NaN
							a isnt a and b isnt b
			indexOf = (iterable,key) ->
				for el, i in iterable
					if (!el.args? or equalityCheck el.args, key.args) and
					(!el.context? or equalityCheck el.context, key.context)
						return i
				-1
			(userMemos) ->
				keys = []
				memos = {}
				userMemos = arrayCoerce userMemos
				# initialize the memo collection
				for memo in userMemos
					continue unless memo?
					userKey = context: memo.context, args: arrayCoerce memo.args
					memos[keys.push(userKey)-1] = memo.returnValue
				@wrap (original,args) ->
					key = context: @, args: args
					idx = indexOf(keys,key)
					return memos[idx] if idx > -1
					memos[keys.push(key)-1] = original.apply @, args
		)()
		traced: (->
			console  = global.console
			hasConsole = console?
			log      = if hasConsole and console.log?      then console.log.bind console      else Function.empty
			error    = if hasConsole and console.error?    then console.error.bind console    else Function.empty
			group    = if hasConsole and console.group?    then console.group.bind console    else log
			groupEnd = if hasConsole and console.groupEnd? then console.groupEnd.bind console else Function.empty
			time     = if hasConsole and console.time?     then console.time.bind console     else Function.empty
			timeEnd  = if hasConsole and console.timeEnd?  then console.timeEnd.bind console  else Function.empty
			trace    = if hasConsole and console.trace?    then console.trace.bind console    else Function.empty
			(name,opts) ->
				# define default options to be used if none are specified
				opts ?= Function.TRACE_ARGUMENTS | Function.TRACE_RETURN
				# try to figure out the name of the function if none is specified
				name ?= @getOrigin().toString().match(/^function\s*([^\s\(]*)\(/)[1]
				if name is "" then name = undefined
				if name? then name = if name.toString then name.toString() else Object::toString.call name
				@wrap (fn,args) ->
					title = 'Called '+(if name? then '"'+name.replace(/"/g,'\\"')+'"' else 'anonymous function')
					if opts is Function.TRACE_NONE then log title+' (', fn, ')'
					unless opts is Function.TRACE_NONE
						group title+' (', fn, ')'
						if opts & Function.TRACE_ARGUMENTS then log ' Arguments: ', args
						if opts & Function.TRACE_CONTEXT then log ' Context: ', @
						if opts & Function.TRACE_TIME then time fn
						group 'Console Output'
					try ret = fn.apply @, args catch e then exception = e
					unless opts is Function.TRACE_NONE
						groupEnd()
						if opts & Function.TRACE_TIME then timeEnd fn
						if opts & Function.TRACE_RETURN then (if exception? then error exception else log ' Return value: ', ret)
						if opts & Function.TRACE_STACK then trace()
						groupEnd()
					if exception then throw exception
					ret
		)()
		partial: ->
			partialArgs = Array::slice.call arguments
			@wrap (original,passedArgs) ->
				collectedArgs = []
				for arg in partialArgs
					# if the argument is one of our wildcards, replace it with the next
					# argument given during this call, else use the predefiend argument
					collectedArgs.push (if !arg? or arg is Function._ then passedArgs.shift() else arg)
				original.apply @, collectedArgs.concat(passedArgs)
		curry: ->
			curriedArgs = Array::slice.call arguments
			@wrap (original,passedArgs) ->
				original.apply @, curriedArgs.concat(passedArgs)
		rcurry: ->
			curriedArgs = Array::slice.call arguments
			@wrap (original,passedArgs) ->
				original.apply @, passedArgs.concat(curriedArgs)
		not: ->
			# if arguments are given, immediately call the notted function
			return @not().apply @, arguments if arguments.length
			@wrap((fn,args) -> !fn.apply(@,args))
		prepend: ->
			functions = arguments
			@wrap (self,args) ->
				for fn in functions
					fn.apply @, args
				self.apply @, args
		append: ->
			functions = arguments
			@wrap (self,args) ->
				ret = self.apply @, args
				for fn in functions
					fn.apply @, args
				ret
		overload: (funcTable) ->
			if !arguments.length or funcTable instanceof Function
				others = Array::slice.call arguments
				Function.overload.apply null, others.concat(@)
			else
				funcTable[@getArity()] = @
				Function.overload funcTable
		saturate: ->
			args = arguments
			@wrap (fn) ->
				fn.apply @, args
		aritize: (arity) ->
			@wrap (fn,args) ->
				fn.apply @, args.slice(0,arity)
		getArity: -> @arity or @length or @getArgs().length
	}

	# define Function::getArgs after Function::memoize is committed
	# to allow for auto-memoization
	Function.implement {
		getArgs: (->
			fn = @getOrigin()
			args = fn.toString().match(/^function\s*[^\s\(]*\((.*?)\)/)[1].split(/\s*,\s*/)
			args.filter((_) -> _ isnt "")
		).memoize()
	}


	# implement array methods
	for fnStr in ['forEach','each','every','some','filter','map','reduce','reduceRight','sort']
		continue unless Array.prototype[fnStr]?
		fn = ((fnStr) -> (->
			args = Array::slice.call arguments
			arr = args.shift()
			arr[fnStr].apply arr, [@].concat(args)
		))(fnStr)
		fn._origin = Array.prototype[fnStr]
		Function.implement fnStr, fn

	Function.implement {
		foldl: Function::reduce
		foldr: Function::reduceRight
	}


	# Array::toFunction, Hash::toFunction, Object.toFunction
	toFunction = ->
		self = @
		(index) -> self[index]
	Array.implement 'toFunction', toFunction
	if Hash? then Hash.implement 'toFunction', toFunction
	Object.extend 'toFunction', (obj) -> toFunction.call(obj)


	# add Function._ to the global scope
	global._ = Function._ unless global._?


	global
)(@)

###
Copyright 2010 Michael Ficarra
This program is distributed under the (very open)
terms of the GNU Lesser General Public License
###
