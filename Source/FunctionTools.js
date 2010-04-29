/*
---
description: Extensions to the Function class that allow a more functional programming style
license: LGPL
authors: ['Michael Ficarra']
requires: [Core,Function,Class]
provides: [
	Function::_, Function::empty, Function::identity, Function::lambda, Function::combine,
	Function.wrap, Function.memoize, Function.partial, Function.curry, Function.not,
	Function.prepend, Function.append, Function.arglist
]
... */

_ = Function._ = {};

Function.extend({

	empty: function(){},

	identity: function(val){ return val; },

	lambda: function(val){
		return function(){ return val; };
	},
	
	combine: function(){
		var args = Array().slice.call(arguments);
		return function(){
			args.each(function(fn){
				var result = fn.apply(this,arguments)
			});
			return result;
		};
	}

});

Function.implement({

	wrap: function(fn){
		var that = this;
		var ret = function(){
			var args = Array().slice.call(arguments);
			return fn.call(this,that.bind(this),args);
		}
		ret._origin = this;
		return ret;
	},

	memoize: function(memos){
		var memos = memos || {};
		return this.wrap(function(original,args){
			var origin = this;
			while(origin._origin) origin = origin._origin;
			var key = [origin,args];
			if(memos[key] !== undefined) return memos[key];
			return memos[key] = original.apply(this,args);
		});
	},

	partial: function(){
		partialArgs = Array().slice.call(arguments);
		return this.wrap(function(original,passedArgs){
			collectedArgs = [];
			partialArgs.each(function(arg){
				collectedArgs.push([undefined,Function._].contains(arg) ? passedArgs.shift() : arg);
			});
			return original.apply(this,collectedArgs.concat(passedArgs));
		});
	},

	curry: function(){
		curriedArgs = Array().slice.call(arguments);
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
		})
	},

	arglist: function(){
		fn = this;
		while(fn._origin) fn = fn._origin;
		console.log(fn.toString());
		var args = fn.toString().match(/function \S*\((.*?)\)/)[1].split(',');
		return args.map(function(arg){
			return arg.trim();
		});
	}

});

// cache arglists
(function(){
	var arglist = Function.prototype.arglist;
	Function.prototype.arglist = (function(){ return arglist.apply(this,arguments); }).memoize();
})();


// implement array methods
['forEach','each','every','some','filter','map','reduce','sort'].each(function(fnStr){
	Function.implement(fnStr,function(){
		var args = Array().slice.call(arguments);
		var arr = args.shift();
		return arr[fnStr].apply(arr,[this].concat(args));
	});
});


(function(){
	var toFunction = function(){
		var self = this;
		return function(index){ return self[index]; };
	};
	Array.implement('toFunction',toFunction);
	Hash.implement('toFunction',toFunction);
})();

/* Copyright 2010 Michael Ficarra
This program is distributed under the (very open)
terms of the GNU Lesser General Public License */
