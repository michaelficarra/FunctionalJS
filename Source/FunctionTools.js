/*
---
description: Extensions that allow a more functional programming style
license: LGPL
authors: ['Michael Ficarra']
requires: [Core,Function,Class,Array]
provides: [
	FunctionTools, Function._, Function.empty, Function.identity,
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
... */


(function(global){


// constants for Function::traced
(function(){
	var n=0,
		constants =
			['TRACE_ARGUMENTS'
			,'TRACE_CONTEXT'
			,'TRACE_RETURN'
			,'TRACE_TIME'
			,'TRACE_STACK'
		];
	Function.TRACE_ALL = Function.TRACE_NONE = 0;
	constants.each(function(constant){
		// calculate powers of two to assign to the constants. this allows
		// any combination of constants to be defined as a single value
		Function.TRACE_ALL |= Function[constant] = n = n << 1 || 1;
	});
})();


// class methods
Function.extend({

	_: function(_){
		var caller = arguments.callee.caller || arguments.caller;
		if(!caller) return;
		var args = caller.arguments;
		// if no index given, set/increment the successive argument iterator
		if(_===undefined) args._ = (args._===undefined ? 0 : args._+1);
		// return the argument indexed by the given index or the iterator
		return args[_===undefined ? args._ : _];
	},

	empty: function empty(){},

	identity: function identity(_){
		return arguments.length>1 ? Array.prototype.slice.call(arguments) : _;
	},

	context: function context(){ return this; },

	lambda: function lambda(_){
		return function lambdaFunc(){ return _; };
	},

	pluck: function pluck(property){
		return function pluck(obj){ return obj[property]; };
	},

	invoke: function invoke(method){
		var defaultArgs = Array.prototype.slice.call(arguments,1);
		return function invoke(obj){
			var args = Array.prototype.slice.call(arguments,1);
			return obj[method].apply(obj,args.length ? args : defaultArgs);
		};
	},

	sequence: function sequence(){
		switch(arguments.length) {
			case 0: return Function.empty;
			case 1: return arguments[0];
			default:
				var functions = Array.prototype.slice.call(arguments);
				return (function(idx){
					return function sequenced(){
						idx %= functions.length;
						return functions[idx++].apply(this,arguments);
					};
				}).call(this,0);
		}
	},

	concatenate: function concatenate(){
		var functions = Array.prototype.slice.call(arguments);
		return function concatenated(){
			var result,
				args = arguments;
			functions.each(function(fn){
				result = fn.apply(this,args);
			},this);
			return result;
		};
	},

	compose: function compose(){
		var args = Array.prototype.slice.call(arguments);
		return function composed(){
			var lastReturn = Array.prototype.slice.call(arguments);
			args.reverse().each(function(fn,i){
				// only the outermost function may be given more than one argument
				lastReturn = fn[i==0 ? 'apply' : 'call'](this,lastReturn);
			},this);
			return lastReturn;
		};
	},

	overload: function overload(funcTable){
		// make a table if only a list of functions was given
		if(!funcTable || instanceOf(funcTable,Function)){
			var newTable = {};
			for(var i=0, l=arguments.length; i<l; i++){
				newTable[arguments[i].getArity()] = arguments[i];
			}
			funcTable = newTable;
		}
		return function overloaded(){
			var fn = funcTable[arguments.length];
			if(!fn || !instanceOf(fn,Function)) return;
			return fn.apply(this,arguments);
		};
	}

});

Function.extend({
	'concat': Function.concatenate
});

// boolean function logic: Function.and, Function.or, Function.xor
(function(){
	var xor = function(a,b){ return !!(!a ^ !b); },
		and = function(a,b){ return !!(a && b); },
		or  = function(a,b){ return !!(a || b); };
	Object.each({xor:xor,and:and,or:or},function(op,opName){
		Function[opName] = function boolGen(){
			switch(arguments.length){
				// based on the number of functions given...
				case 0:
					// generate a function that returns undefined
					return Function.empty;
				case 1:
					// generate a function that returns the Boolean representation
					// of the return value of the given function
					var fn = arguments[0];
					return function(){
						return !!fn.apply(this,arguments);
					};
				default:
					// generate a function that calls each given function consecutively,
					// applying the chosen operator to their return values at each step
					var functions = Array.prototype.slice.call(arguments);
					return function boolOp(){
						return (function recurse(functions,args){
							if(functions.length===1){
								return !!functions[0].apply(this,args);
							} else {
								var first = functions[0].apply(this,args);
								// short-circuit `and` and `or`
								if(op===and && !first || op===or && first) return !!first;
								return op(first,recurse.call(this,functions.slice(1),args));
							}
						}).call(this,functions,arguments);
					}
			}
		};
	});
})();


// instance methods
Function.implement({

	wrap: function wrap(fn,bind){
		var self = this;
		function wrapper(){
			var args = Array.prototype.slice.call(arguments);
			return fn.call(this,(bind===undefined ? self : self.bind(bind)),args);
		};
		wrapper._origin = this;
		return wrapper;
	},

	getOrigin: function getOrigin(){
		var origin = this;
		while(origin._origin) origin = origin._origin;
		return origin;
	},

	memoize: (function(){
		// used to check if arguments/contexts are functionally equivalent
		function equalityCheck(a,b){
			var type = typeOf(a);
			if(type !== typeOf(b)) return false;
			switch(type){
				case 'object':
					return a === b;
				case 'regexp':
					return a.toString() === b.toString();
				case 'array':
				case 'collection':
				case 'arguments':
					return a.length === b.length &&
						Array.every(a,function(a_i,i){
							return equalityCheck(a_i,b[i]);
						});
				default:
					try { a = a.valueOf(); } catch(e){}
					try { b = b.valueOf(); } catch(e){}
					// taken from google caja
					if (a === b) // 0 is not -0
						return a !== 0 || 1/a === 1/b;
					else // NaN is NaN
						return a !== a && b !== b;
			}
		};
		function indexOf(key){
			for(var i=0, l=this.length; i<l; i++)
				if(
					(this[i].context === undefined || equalityCheck(this[i].context,key.context))
					&& (this[i].args === undefined || equalityCheck(this[i].args,   key.args   ))
				)
					return i;
			return -1;
		};
		return function memoize(userMemos){
			var keys = [], memos = {};
			keys.indexOf = indexOf;
			// initialize the memo collection
			Array.from(userMemos).each(function(memo){
				memos[
					keys.push({
						context: memo.context,
						args: Array.from(memo.args)
					}) - 1
				] = memo.returnValue;
			});
			return this.wrap(function(original,args){
				var key = {
						context: this,
						args: args
					},
					idx = keys.indexOf(key);
				if(idx > -1) return memos[idx];
				return memos[keys.push(key) - 1] = original.apply(this,args);
			});
		};
	})(),

	toFunction: function toFunction(){ return this; },

	traced: (function(){
		var console  = window.console,
			log      = (console && console.log)      ? console.log.bind(console)      : Function.empty,
			error    = (console && console.error)    ? console.error.bind(console)    : Function.empty,
			group    = (console && console.group)    ? console.group.bind(console)    : log,
			groupEnd = (console && console.groupEnd) ? console.groupEnd.bind(console) : Function.empty,
			time     = (console && console.time)     ? console.time.bind(console)     : Function.empty,
			timeEnd  = (console && console.timeEnd)  ? console.timeEnd.bind(console)  : Function.empty,
			trace    = (console && console.trace)    ? console.trace.bind(console)    : Function.empty;
		return function traced(name, opts){
			// define default options to be used if none are specified
			opts = opts===undefined ? (Function.TRACE_ARGUMENTS | Function.TRACE_RETURN) : opts;
			// try to figure out the name of the function if none is specified
			name = name || fn.getOrigin().toString().match(/^function\s*([^\s\(]*)\(/)[1];
			name = name.toString ? name.toString() : Object.prototype.toString.call(name);
			return this.wrap(function(fn,args){
				var title = 'Called '+(name ? '"'+name.replace(/"/g,'\\"')+'"' : 'anonymous function'),
					exception,
					ret;
				if(opts === Function.TRACE_NONE) log(title+' (',fn,')');
				if(opts !== Function.TRACE_NONE) {
					group(title+' (',fn,')');
					if(opts & Function.TRACE_ARGUMENTS) log(' Arguments: ',args);
					if(opts & Function.TRACE_CONTEXT) log(' Context: ',this);
					if(opts & Function.TRACE_TIME) time(fn);
					group('Console Output');
				}
				try { ret = fn.apply(this,args); } catch(e) { exception = e; }
				if(opts !== Function.TRACE_NONE) {
					groupEnd();
					if(opts & Function.TRACE_TIME) timeEnd(fn);
					if(opts & Function.TRACE_RETURN) exception ? error(exception) : log(' Return value: ',ret);
					if(opts & Function.TRACE_STACK) trace();
					groupEnd();
				}
				if(exception) throw exception;
				return ret;
			});
		}
	})(),

	partial: function partial(){
		var partialArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			var collectedArgs = [];
			partialArgs.each(function(arg){
				// if the argument is one of our wildcards, replace it with the next
				// argument given during this call, else use the predefiend argument
				collectedArgs.push(arg===undefined || arg===Function._ ? passedArgs.shift() : arg);
			});
			return original.apply(this,collectedArgs.concat(passedArgs));
		});
	},

	curry: function curry(){
		var curriedArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			return original.apply(this,curriedArgs.concat(passedArgs));
		});
	},

	rcurry: function rcurry(){
		var curriedArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			return original.apply(this,passedArgs.concat(curriedArgs));
		});
	},

	not: function not(){
		// if arguments are given, immediately call the notted function
		if(arguments.length) return this.not().apply(this,arguments);
		return this.wrap(function(fn,args){
			return !fn.apply(this,args);
		});
	},

	prepend: function prepend(){
		var functions = arguments;
		return this.wrap(function(self,args){
			Array.each(functions,function(fn){
				fn.apply(this,args);
			},this);
			return self.apply(this,args);
		});
	},

	append: function append(){
		var functions = arguments;
		return this.wrap(function(self,args){
			var ret = self.apply(this,args);
			Array.each(functions,function(fn){
				fn.apply(this,args);
			},this);
			return ret;
		});
	},

	overload: function overload(funcTable){
		if(!funcTable || instanceOf(funcTable,Function)) {
			var others = Array.prototype.slice.call(arguments);
			return Function.overload.apply(null,others.concat(this));
		} else {
			funcTable[this.getArity()] = this;
			return Function.overload(funcTable);
		}
	},

	saturate: function saturate(){
		var args = arguments;
		return this.wrap(function(fn){
			return fn.apply(this,args);
		});
	},

	aritize: function aritize(arity){
		return this.wrap(function(fn,args){
			return fn.apply(this,args.slice(0,arity));
		});
	},

	getArity: function getArity(){
		return this.arity || this.length || this.getArgs().length;
	}

});

// define Function::getArgs after Function::memoize is committed
// to allow for auto-memoization
Function.implement('getArgs',function getArgs(){
	var fn = this.getOrigin();
	var args = fn.toString().match(/^function\s*[^\s\(]*\((.*?)\)/)[1].split(/\s*,\s*/);
	return args.filter(function(_){ return _ !== ""; });
}.memoize());


// implement array methods
['forEach','each','every','some','filter','map','reduce','reduceRight','sort'].each(function(fnStr){
	if(Array.prototype[fnStr]===undefined) return;
	var fn = function(){
		var args = Array.prototype.slice.call(arguments);
		var arr = args.shift();
		return arr[fnStr].apply(arr,[this].concat(args));
	};
	fn._origin = Array.prototype[fnStr];
	Function.implement(fnStr,fn);
});

Function.implement({
	foldl: Function.prototype.reduce,
	foldr: Function.prototype.reduceRight
});


// Array::toFunction, Hash::toFunction, Object.toFunction
(function(){
	var toFunction = function(){
		var self = this;
		return function(index){ return self[index]; };
	};
	Array.implement('toFunction',toFunction);
	if(Hash) Hash.implement('toFunction',toFunction);
	Object.extend('toFunction',function(obj){ return toFunction.call(obj); });
})();


// add Function._ to the global scope
if(global._ === undefined) global._ = Function._;


})(this);


/* Copyright 2010 Michael Ficarra
This program is distributed under the (very open)
terms of the GNU Lesser General Public License */
