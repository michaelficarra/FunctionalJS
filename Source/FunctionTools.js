/*
---
description: Extensions to the Function class that allow a more functional programming style
license: LGPL
authors: ['Michael Ficarra']
requires: [Core,Function,Class]
provides: [
	FunctionTools, Function._, Function.empty, Function.identity, Function.lambda,
	Function.combine, Function.compose, Function.overload, Function::wrap, Function::memoize,
	Function::partial, Function::curry, Function::not, Function::prepend, Function::append,
	Function::overload, Function::getArgs, Function::getArity, Array::toFunction, Hash::toFunction
]
... */


// globals, class properties, constants
Function._ = function(_){
	var caller = arguments.callee.caller || arguments.caller;
	if(!caller) return;
	var args = caller.arguments;
	if(_===undefined) args._ = (args._===undefined ? 0 : args._+1);
	return args[_===undefined ? args._ : _];
};
if(this._ === undefined) this._ = Function._;

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
		Function.TRACE_ALL |= Function[constant] = n = n << 1 || 1;
	});
})();


// class methods
Function.extend({

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
				lastReturn = fn[i==0 ? 'apply' : 'call'](this,lastReturn);
			},this);
			return lastReturn;
		};
	},

	overload: function overload(funcTable){
		if(!funcTable || instanceOf(funcTable,Function)){
			var newTable = {};
			for(var i=0, l=arguments.length; i<l; i++){
				newTable[arguments[i].getArity()] = arguments[i];
			}
			funcTable = newTable;
		}
		return function(){
			var fn = funcTable[arguments.length];
			if(!fn || !instanceOf(fn,Function)) return;
			return fn.apply(this,arguments);
		};
	}

});

Function.extend({
	'concat': Function.concatenate
});

// Boolean function logic
(function(){
	var xor = function(a,b){ return !!(!!a ^ !!b); },
		and = function(a,b){ return !!(a && b); },
		or  = function(a,b){ return !!(a || b); };
	new Hash({'xor':xor,'and':and,'or':or}).each(function(op,opName){
		Function[opName] = function boolGen(){
			switch(arguments.length){
				case 0: return Function.lambda(undefined);
				case 1:
					var fn = arguments[0];
					return function(){
						return !!fn.apply(this,arguments);
					};
				default:
					var functions = Array.prototype.slice.call(arguments);
					return function boolOp(){
						return (function recurse(functions,args){
							if(functions.length===1){
								return !!functions[0].apply(this,args);
							} else {
								var first = functions[0].apply(this,args);
								// short-circuit and and or
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

	memoize: function memoize(userMemos){
		var keys = [], memos = {};
		function equalityCheck(a,b){
			var type=typeOf(a);
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
						Array.every(a,function(ai,i){
							return equalityCheck(ai,b[i]);
						});
				default:
					// taken from google caja
					if (a === b) {
						// 0 is not -0
						return a !== 0 || 1/a === 1/b;
					} else {
						// NaN is NaN
						return a !== a && b !== b;
					}
			}
		};
		keys.indexOf = function(key){
			for(var i=0, l=this.length; i<l; i++){
				if(
					(this[i].context === undefined || equalityCheck(this[i].context,key.context))
					&& (this[i].args === undefined || equalityCheck(this[i].args,   key.args   ))
				)
					return i;
			};
			return -1;
		};
		// initialize memo collection
		Array.from(userMemos).each(function(memo){
			memos[
				keys.push({
					context: memo.context,
					args: Array.from(memo.args)
				}) - 1
			] = memo.returnValue;
		});
		return this.wrap(function(original,args){
			var idx,
				key = {
					context: this,
					args: args
				};
			if((idx=keys.indexOf(key)) > -1) return memos[idx];
			return memos[keys.push(key) - 1] = original.apply(this,args);
		});
	}

});

Function.implement({

	toFunction: function toFunction(){ return this; }.memoize(),

	traced: function traced(name, opts){
		opts = opts || (Function.TRACE_ARGUMENTS | Function.TRACE_RETURN);
		var console  = window.console,
			log      = (console && console.log)      ? console.log.bind(console)      : Function.empty,
			error    = (console && console.error)    ? console.error.bind(console)    : Function.empty,
			group    = (console && console.group)    ? console.group.bind(console)    : log,
			groupEnd = (console && console.groupEnd) ? console.groupEnd.bind(console) : Function.empty,
			time     = (console && console.time)     ? console.time.bind(console)     : Function.empty,
			timeEnd  = (console && console.timeEnd)  ? console.timeEnd.bind(console)  : Function.empty,
			trace    = (console && console.trace)    ? console.trace.bind(console)    : Function.empty;
		return this.wrap(function(fn,args){
			name = name || fn.getOrigin().toString().match(/^function\s*([^\s\(]*)\(/)[1];
			name = name.toString ? name.toString() : Object.prototype.toString.call(name);
			group('Called '+(name ? '"'+name.replace(/"/g,'\\"')+'"' : 'anonymous function')+' (',fn,')');
			var ret, exception, success = true;
			if(opts & Function.TRACE_ARGUMENTS) log(' Arguments: ',args);
			if(opts & Function.TRACE_CONTEXT) log(' Context: ',this);
			if(opts & Function.TRACE_TIME) time(fn);
			group('Console Output');
			try { ret = fn.apply(this,args); } catch(e) { success = false; exception = e; }
			groupEnd();
			if(opts & Function.TRACE_TIME) timeEnd(fn);
			if(opts & Function.TRACE_RETURN) success ? log(' Return value: ',ret) : error(exception);
			if(opts & Function.TRACE_STACK) trace();
			groupEnd();
			if(!success) throw exception;
			return ret;
		});
	}.memoize(),

	partial: function partial(){
		var partialArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			var collectedArgs = [];
			partialArgs.each(function(arg){
				collectedArgs.push([undefined,Function._].contains(arg) ? passedArgs.shift() : arg);
			});
			return original.apply(this,collectedArgs.concat(passedArgs));
		});
	}.memoize(),

	curry: function curry(){
		var curriedArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			return original.apply(this,curriedArgs.concat(passedArgs));
		});
	}.memoize(),

	rcurry: function rcurry(){
		var curriedArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			return original.apply(this,passedArgs.concat(curriedArgs));
		});
	}.memoize(),

	not: function not(){
		if(arguments.length) return this.not().apply(this,arguments);
		return this.wrap(function(fn,args){
			return !fn.apply(this,args);
		});
	}.memoize(),

	prepend: function prepend(){
		var functions = arguments;
		return this.wrap(function(self,args){
			Array.each(functions,function(fn){
				fn.apply(this,args);
			},this);
			return self.apply(this,args);
		});
	}.memoize(),

	append: function append(){
		var functions = arguments;
		return this.wrap(function(self,args){
			var ret = self.apply(this,args);
			Array.each(functions,function(fn){
				fn.apply(this,args);
			},this);
			return ret;
		});
	}.memoize(),

	overload: function overload(funcTable){
		if(!funcTable || instanceOf(funcTable,Function)) {
			var others = Array.prototype.slice.call(arguments);
			return Function.overload.apply(null,others.concat(this));
		} else {
			funcTable[this.getArity()] = this;
			return Function.overload(funcTable);
		}
	}.memoize(),

	saturate: function saturate(){
		var args = arguments;
		return this.wrap(function(fn){
			return fn.apply(this,args);
		});
	}.memoize(),

	aritize: function aritize(arity){
		return this.wrap(function(fn,args){
			return fn.apply(this,args.slice(0,arity));
		});
	}.memoize(),

	getArgs: function getArgs(){
		var fn = this.getOrigin();
		var args = fn.toString().match(/^function\s*[^\s\(]*\((.*?)\)/)[1].split(/\s*,\s*/);
		return args.filter(function(_){ return _ !== ""; });
	}.memoize(),

	getArity: function getArity(){
		return this.arity || this.length || this.getArgs().length;
	}.memoize()

});


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


// Array.toFunction, Hash.toFunction
(function(){
	var toFunction = function(){
		var self = this;
		return function(index){ return self[index]; };
	};
	Array.implement('toFunction',toFunction);
	if(Hash) Hash.implement('toFunction',toFunction);
})();

/* Copyright 2010 Michael Ficarra
This program is distributed under the (very open)
terms of the GNU Lesser General Public License */
