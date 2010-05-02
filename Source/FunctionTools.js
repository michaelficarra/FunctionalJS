/*
---
description: Extensions to the Function class that allow a more functional programming style
license: LGPL
authors: ['Michael Ficarra']
requires: [Core,Function,Class]
provides: [
	FunctionTools, Function::_, Function::empty, Function::identity, Function::lambda,
	Function::combine, Function::compose, Function::overload, Function.wrap, Function.memoize,
	Function.partial, Function.curry, Function.not, Function.prepend, Function.append,
	Function.overload, Function.getArgs, Array.toFunction, Hash.toFunction
]
... */

this._ = Function._ = {};

Function.extend({

	empty: function(){},

	identity: function(_){ return _; },

	lambda: function(_){
		return function(){ return _; };
	},

	combine: function(){
		var args = Array.prototype.slice.call(arguments);
		return function(){
			var result;
			args.each(function(fn){
				result = fn.apply(this,arguments);
			});
			return result;
		};
	},

	overload: function(funcTable){
		if(!funcTable || typeof funcTable === 'function'){
			var newTable = [];
			for(var i=0, l=arguments.length; i<l; i++){
				newTable[arguments[i].arity] = arguments[i];
			}
			funcTable = newTable;
		}
		return function(){
			var fn = funcTable[arguments.length];
			if(!fn || typeof fn != 'function') return undefined;
			return fn.apply(this,arguments);
		};
	}
});

Function.extend({compose: Function.combine});

Function.implement({

	wrap: function(fn){
		var that = this;
		var ret = function(){
			var args = Array.prototype.slice.call(arguments);
			return fn.call(this,that.bind(this),args);
		};
		ret._origin = this;
		return ret;
	},

	memoize: function(memos){
		memos = memos || {};
		return this.wrap(function(original,args){
			var origin = this;
			while(origin._origin) origin = origin._origin;
			var key = [origin,args];
			if(memos[key] !== undefined) return memos[key];
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
			funcTable[this.arity] = this;
			return Function.overload(funcTable);
		}
	},

	getArgs: function(){
		var fn = this;
		while(fn._origin) fn = fn._origin;
		var args = fn.toString().match(/function\s*\S*?\((.*?)\)/)[1].split(/\s*,\s*/);
		return args.filter(function(_){ return _ !== ""; });
	}

});

// cache arglists
(function(){
	var original = Function.prototype.getArgs;
	Function.prototype.getArgs = (function(){ return original.apply(this,arguments); }).memoize();
})();


// implement array methods
['forEach','each','every','some','filter','map','reduce','sort'].each(function(fnStr){
	var fn = function(){
		var args = Array.prototype.slice.call(arguments);
		var arr = args.shift();
		return arr[fnStr].apply(arr,[this].concat(args));
	};
	fn._origin = Array.prototype[fnStr];
	Function.implement(fnStr,fn);
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
