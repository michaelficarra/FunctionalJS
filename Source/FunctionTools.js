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


// class properties and globals
this._ = Function._ = function(_){
	var caller = arguments.callee.caller || arguments.caller;
	if(!caller) return;
	var args = caller.arguments;
	if(_===undefined) args._ = (args._===undefined ? 0 : args._+1);
	return args[_===undefined ? args._ : _];
};


// class methods
Function.extend({

	empty: function(){},

	identity: function(_){
		return arguments.length>1 ? Array.prototype.slice.call(arguments) : _;
	},

	lambda: function(_){
		return function(){ return _; };
	},

	pluck: function(property){
		return function(obj){ return obj[property]; };
	},

	invoke: function(method){
		var defaultArgs = Array.prototype.slice.call(arguments,1);
		return fn = function(obj){
			var args = Array.prototype.slice.call(arguments,1);
			return obj[method].apply(obj,args.length ? args : defaultArgs);
		};
	},

	sequence: function(){
		var functions = Array.prototype.slice.call(arguments);
		return function(){
			var result,
				args = arguments;
			functions.each(function(fn){
				result = fn.apply(this,args);
			},this);
			return result;
		};
	},

	compose: function(){
		var args = Array.prototype.slice.call(arguments);
		return function(){
			var lastReturn = Array.prototype.slice.call(arguments);
			args.reverse().each(function(fn){
				lastReturn = [fn.apply(this,lastReturn)]
			},this);
			return lastReturn[0];
		}
	},

	overload: function(funcTable){
		if(!funcTable || typeof funcTable === 'function'){
			var newTable = {};
			for(var i=0, l=arguments.length; i<l; i++){
				newTable[arguments[i].getArity()] = arguments[i];
			}
			funcTable = newTable;
		}
		return function(){
			var fn = funcTable[arguments.length];
			if(!fn || typeof fn !== 'function') return undefined;
			return fn.apply(this,arguments);
		};
	}

});

// Boolean function logic
(function(){
	var xor = function(a,b){ return !!(!!a ^ !!b); },
		and = function(a,b){ return !!(a && b); },
		or  = function(a,b){ return !!(a || b); };
	new Hash({'xor':xor,'and': and,'or':or}).each(function(fn,fnName){
		Function[fnName] = function(){
			var functions = Array.prototype.slice.apply(arguments);
			return function(){
				switch(functions.length) {
					case 0: return undefined;
					case 1: return !!functions[0].apply(this,arguments);
					default:
						var first = functions.shift().apply(this,arguments);
						// short-circuit and and or
						if(fn===and && !first || fn===or && first) return !!first;
						return !!fn(first,arguments.callee.apply(this,functions));
				}
			};
		};
	});
})()


// instance methods
Function.implement({

	toFunction: function(){ return this; },

	traced: function(name){
		return this.wrap(function(fn,args){
			var log = console && console.log ? console.log.bind(console) : (log || Function.empty),
				ret = fn.apply(this,args);
			log('Called '+(name ? '"'+name.replace(/"/g,'\\"')+'"' : 'anonymous function')+'... (',fn,')');
			log('  Arguments: ',args);
			log('  Context: ',this);
			log('  Return value: ',ret);
			return ret;
		});
	},

	wrap: function(fn,bind){
		var that = this;
		var ret = function(){
			var args = Array.prototype.slice.call(arguments);
			return fn.call(this,(bind ? that.bind(bind) : that),args);
		};
		ret._origin = this;
		return ret;
	},

	getOrigin: function(){
		var origin = this;
		while(origin._origin) origin = origin._origin;
		return origin;
	},

	memoize: function(memos){
		memos = memos || {};
		var that = this;
		return this.wrap(function(original,args){
			var context = (typeof this)==="function" ? this.getOrigin() : this;
			var key = [context,args];
			if(memos[key] !== undefined) return memos[key];
			if(memos[args] !== undefined) return memos[args];
			if(args.length===1 && memos[args[0]] !== undefined) return memos[args[0]];
			return (memos[key] = original.apply(this,args));
		});
	},

	partial: function(){
		var partialArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			var collectedArgs = [];
			partialArgs.each(function(arg){
				collectedArgs.push([undefined,Function._].contains(arg) ? passedArgs.shift() : arg);
			});
			return original.apply(this,collectedArgs.concat(passedArgs));
		});
	},

	curry: function(){
		var curriedArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			return original.apply(this,curriedArgs.concat(passedArgs));
		});
	},

	rcurry: function(){
		var curriedArgs = Array.prototype.slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			return original.apply(this,passedArgs.concat(curriedArgs));
		});
	},

	not: function(){
		if(arguments.length) return this.not().apply(this,arguments);
		return this.wrap(function(fn,args){
			return !fn.apply(this,args);
		});
	},

	prepend: function(fn){
		return this.wrap(function(self,args){
			fn.apply(this,args);
			return self.apply(this,args);
		});
	},

	append: function(fn){
		return this.wrap(function(self,args){
			self.apply(this,args);
			return fn.apply(this,args);
		});
	},

	overload: function(funcTable){
		if(!funcTable || typeof funcTable === 'function') {
			var others = Array.prototype.slice.call(arguments);
			return Function.overload.apply(null,others.concat(this));
		} else {
			funcTable[this.getArity()] = this;
			return Function.overload(funcTable);
		}
	},

	saturate: function(){
		var args = arguments;
		return this.wrap(function(fn){
			return fn.apply(this,args);
		});
	},

	aritize: function(length){
		return this.wrap(function(fn,args){
			return fn.apply(this,args.slice(0,length));
		});
	},

	getArgs: function(){
		var fn = this.getOrigin();
		var args = fn.toString().match(/function\s*\S*?\((.*?)\)/)[1].split(/\s*,\s*/);
		return args.filter(function(_){ return _ !== ""; });
	},

	getArity: function(){
		return this.arity || this.length || this.getArgs().length;
	}

});

// cache arglists
(function(){
	var original = Function.prototype.getArgs;
	Function.prototype.getArgs = (function(){ return original.apply(this,arguments); }).memoize();
})();


// implement array methods
['forEach','each','every','some','filter','map','reduce','reduceRight','sort'].each(function(fnStr){
	var fn = function(){
		var args = Array.prototype.slice.call(arguments);
		var arr = args.shift();
		if(arr[fnStr]===undefined) return;
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
