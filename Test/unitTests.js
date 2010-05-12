var testValues = ["string","",0,2,null,false,/(?:)/,true,[0,,2],[],{},function(){},undefined];

describe('_ / Function._', {
	before: function(){
		
	},
	'successive arguments': function() {
		(function(){
			for(var i=0, l=arguments.length; i<l; i++)
				value_of(_()).should_be(arguments[i]);
		}).apply(this,testValues);
	},
	'arbitrary arguments': function() {
		(function(){
			for(var i=0, l=arguments.length; i<l; i++)
				value_of(_(i)).should_be(arguments[i]);
		}).apply(this,testValues);

	},
	'mixing arbitrarily accessed arguments with successive arguments': function(){
		(function(){
			value_of(_()).should_be(0);
			value_of(_()).should_be(1);
			value_of(_(0)).should_be(0);
			value_of(_()).should_be(2);
			value_of(_(3)).should_be(3);
			value_of(_(1)).should_be(1);
			value_of(_()).should_be(3);
			value_of(_(2)).should_be(2);
			value_of(_()).should_be(4);
			value_of(_()).should_be_undefined();
		})(0,1,2,3,4);
	}
});

describe('Function.empty', {
	before: function(){
		
	},
	'return undefined for any input': function(){
		value_of(Function.empty()).should_be_undefined();
		(function(){
			for(var i=0, l=arguments.length; i<l; i++)
				value_of(Function.empty(arguments[i])).should_be_undefined();
		})(testValues);
	}
});

describe('Function.identity', {
	before: function(){
		
	},
	'return whatever is passed': function(){
		testValues.each(function(val,index){
			value_of(Function.identity(val)).should_be(val);
			value_of(Function.identity(val,index)).should_be([val,index]);
		});
	}
});

describe('Function.lambda', {
	before: function(){
		
	},
	'returned function returns whatever is passed': function(){
		testValues.each(function(val){
			testValues.each(function(arg){
				value_of(Function.lambda(val)(arg)).should_be(val);
			});
		});
	}
});

describe('Function.pluck', {
	before: function(){
		length = Function.pluck('length');
	},
	'pluck': function(){
		value_of(length("12345")).should_be(5);
		value_of(length([0,0,0])).should_be(3);
		value_of(length({test:123,length:"str"})).should_be("str");
	}
});

describe('Function.invoke', {
	before: function(){
		hasOwnProperty = Function.invoke('hasOwnProperty','hasOwnProperty');
		hasOwnProperty0 = Function.invoke('hasOwnProperty',0);
	},
	'invoke': function(){
		value_of(hasOwnProperty([2],0)).should_be(true);
		value_of(hasOwnProperty([2],1)).should_be(false);
		value_of(hasOwnProperty([])).should_be(false);
		value_of(hasOwnProperty0([2])).should_be(true);
		value_of(hasOwnProperty0([])).should_be(false);
	}
});

describe('Function.sequence', {
	before: function(){
		shared = "";
		fnA = function(x){ shared += "A"+(x||"")+(this===window ? "" : this); };
		fnB = function(x){ shared += "B"+(x||"")+(this===window ? "" : this); };
		fnC = function(x){ shared += "C"+(x||"")+(this===window ? "" : this); };
	},
	'functions are sequenced': function(){
		value_of(shared).should_be_empty()
		Function.sequence(
			fnA,
			function(){ value_of(shared).should_be("A"); },
			fnB,
			function(){ value_of(shared).should_be("AB"); },
			fnC
		)();
		value_of(shared).should_be("ABC");
	},
	'arguments are passed through': function(){
		value_of(shared).should_be_empty()
		Function.sequence(
			fnA,
			function(){ value_of(shared).should_be("A1"); },
			fnB,
			function(){ value_of(shared).should_be("A1B1"); },
			fnC
		)(1);
		value_of(shared).should_be("A1B1C1");
	},
	'context correctly preserved': function(){
		value_of(shared).should_be_empty()
		Function.sequence(
			fnA,
			function(){ value_of(shared).should_be("A12"); },
			fnB,
			function(){ value_of(shared).should_be("A12B12"); },
			fnC
		).call(2,1);
		value_of(shared).should_be("A12B12C12");
	}
});

describe('Function.compose',{
	before: function(){
		fnA = function(s){ return "A"+s; };
		fnB = function(s){ return "B"+s; };
		fnB2 = function(){ return "B"; }
		fnC = function(s,x){ return "C"+s+x+"F"; };
	},
	'functions are composed': function(){
		value_of(Function.compose(fnA,fnB2)()).should_be("AB")
	},
	'arguments are passed to first function': function(){
		value_of(Function.compose(fnA,fnB,fnC)("D","E")).should_be("ABCDEF")
	}
});

describe('Function.overload',{
	before: function(){
		fn0 = function(){ return 0; };
		fn1 = function(x){ return 1; };
		fn2 = function(x,y){ return 2; };
		fn3 = function(x,y,z){ return 3; };
	},
	'create overloaded function': function(){
		var overloaded = Function.overload(fn0,fn1,fn2,fn3);
		value_of(overloaded()).should_be(0);
		value_of(overloaded(0)).should_be(1);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be(3);
		value_of(overloaded(0,0,0,0)).should_be_undefined();
	},
	'using numerically indexed object': function(){
		var overloaded = Function.overload({0:fn0,2:fn2,1:fn1,3:fn3});
		value_of(overloaded()).should_be(0);
		value_of(overloaded(0)).should_be(1);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be(3);
		value_of(overloaded(0,0,0,0)).should_be_undefined();
	},
	'using object indexed by different arity': function(){
		var overloaded = Function.overload({0:fn1,0:fn2,1:fn3,2:fn1,4:fn0});
		value_of(overloaded()).should_be(2);
		value_of(overloaded(0)).should_be(3);
		value_of(overloaded(0,0)).should_be(1);
		value_of(overloaded(0,0,0)).should_be_undefined();
		value_of(overloaded(0,0,0,0)).should_be(0);
		value_of(overloaded(0,0,0,0,0)).should_be_undefined();
	},
	'two overloaded functions': function(){
		var overload1 = Function.overload({0:fn3,1:fn2,2:fn1,3:fn0});
		var overload2 = Function.overload({0:fn2,1:fn0,2:fn3,3:fn1});
		value_of(overload1()).should_be(3);
		value_of(overload1(0)).should_be(2);
		value_of(overload1(0,0)).should_be(1);
		value_of(overload1(0,0,0)).should_be(0);
		value_of(overload1(0,0,0,0)).should_be_undefined();
		value_of(overload2()).should_be(2);
		value_of(overload2(0)).should_be(0);
		value_of(overload2(0,0)).should_be(3);
		value_of(overload2(0,0,0)).should_be(1);
		value_of(overload2(0,0,0,0)).should_be_undefined();
	},
	'preserve scope': function(){
		var fn = function(){ return this; },
			expected = "expected string";
		var overload = Function.overload(fn,fn);
		value_of(overload.call(expected)).should_be(expected);
	}
});

describe('Boolean function logic',{
	before: function(){
		shared = false;
		fnT = function(){ shared=true; return true; };
		fnF = function(){ shared=false; return false; };
	},
	'and': function(){
		value_of(Function.and()()).should_be_undefined();
		value_of(Function.and(fnT)()).should_be_true();
		value_of(Function.and(fnF)()).should_be_false();
		value_of(Function.and(fnT,fnT)()).should_be_true();
		value_of(Function.and(fnT,fnF)()).should_be_false();
		value_of(Function.and(fnF,fnT)()).should_be_false();
		value_of(Function.and(fnF,fnF)()).should_be_false();
		value_of(Function.and(fnT,fnT,fnT)()).should_be_true();
		value_of(Function.and(fnT,fnT,fnF)()).should_be_false();
		value_of(Function.and(fnT,fnF,fnT)()).should_be_false();
		value_of(Function.and(fnT,fnF,fnF)()).should_be_false();
		value_of(Function.and(fnF,fnT,fnT)()).should_be_false();
		value_of(Function.and(fnF,fnT,fnF)()).should_be_false();
		value_of(Function.and(fnF,fnF,fnT)()).should_be_false();
		value_of(Function.and(fnF,fnF,fnF)()).should_be_false();
	},
	'or': function(){
		value_of(Function.or()()).should_be_undefined();
		value_of(Function.or(fnT)()).should_be_true();
		value_of(Function.or(fnF)()).should_be_false();
		value_of(Function.or(fnT,fnT)()).should_be_true();
		value_of(Function.or(fnT,fnF)()).should_be_true();
		value_of(Function.or(fnF,fnT)()).should_be_true();
		value_of(Function.or(fnF,fnF)()).should_be_false();
		value_of(Function.or(fnT,fnT,fnT)()).should_be_true();
		value_of(Function.or(fnT,fnT,fnF)()).should_be_true();
		value_of(Function.or(fnT,fnF,fnT)()).should_be_true();
		value_of(Function.or(fnT,fnF,fnF)()).should_be_true();
		value_of(Function.or(fnF,fnT,fnT)()).should_be_true();
		value_of(Function.or(fnF,fnT,fnF)()).should_be_true();
		value_of(Function.or(fnF,fnF,fnT)()).should_be_true();
		value_of(Function.or(fnF,fnF,fnF)()).should_be_false();
	},
	'xor': function(){
		value_of(Function.xor()()).should_be_undefined();
		value_of(Function.xor(fnT)()).should_be_true();
		value_of(Function.xor(fnF)()).should_be_false();
		value_of(Function.xor(fnT,fnT)()).should_be_false();
		value_of(Function.xor(fnT,fnF)()).should_be_true();
		value_of(Function.xor(fnF,fnT)()).should_be_true();
		value_of(Function.xor(fnF,fnF)()).should_be_false();
		value_of(Function.xor(fnT,fnT,fnT)()).should_be_true();
		value_of(Function.xor(fnT,fnT,fnF)()).should_be_false();
		value_of(Function.xor(fnT,fnF,fnT)()).should_be_false();
		value_of(Function.xor(fnT,fnF,fnF)()).should_be_true();
		value_of(Function.xor(fnF,fnT,fnT)()).should_be_false();
		value_of(Function.xor(fnF,fnT,fnF)()).should_be_true();
		value_of(Function.xor(fnF,fnF,fnT)()).should_be_true();
		value_of(Function.xor(fnF,fnF,fnF)()).should_be_false();
	},
	'arguments are passed': function(){
		var id = Function.identity,
			expected = 0, expected2 = 1;
		var verify = function(a,b){
			console.log(a);
			value_of(a).should_be(expected);
			value_of(a).should_not_be(expected2);
			value_of(b).should_be(expected2);
			value_of(b).should_not_be(expected);
			return true;
		};
		value_of(Function.xor(id,id.not())(true)).should_be(true);
		value_of(Function.and(verify,id)(expected,expected2)).should_be(true);
	},
	'context is preserved': function(){
		var expected = 22;
		var context = function(){ value_of(this).should_be(expected); return true; }
		value_of(Function.and(context,context).call(expected)).should_be(true);
	},
	'short-circuit': function(){
		shared = true;
		Function.and(fnF,fnT)();
		value_of(shared).should_be(false);
		shared = true;
		Function.and(fnT,fnF,fnT,fnT)();
		value_of(shared).should_be(false);

		shared = false;
		Function.or(fnT,fnF)();
		value_of(shared).should_be(true);
		shared = false;
		Function.or(fnF,fnT,fnF,fnF)();
		value_of(shared).should_be(true);
	}
});

describe('Function::wrap',{
	before: function(){
		fnA = function(){ return 1; };
		fnB = function(a){ return 2; };
		fnC = function(a,b){ return 4; };
		fnD = function(a,b,c){ return 8; };
	},
	'original function is called, along with outer statements': function(){
		var fn = Function.identity.wrap(function(original,args){
			return fnB()+original(1);
		});
		value_of(fn()).should_be(3);
	},
	'arguments are passed through': function(){
		var fn = fnA.wrap(function(original,args){
			return args.reduce(function(a,b){ return a+b; },0);
		});
		value_of(fn()).should_be(0);
		value_of(fn(1)).should_be(1);
		value_of(fn(1,2,3,4)).should_be(10);
	},
	'scope is correctly preserved': function(){
		(function(){ return this; }).wrap(function(original,args){
			testValues.each(function(expected){
				value_of(original.apply(expected,args)).should_be([undefined,null].contains(expected) ? window : expected);
			});
		})();
	},
	'original function is preserved': function(){
		var fn = fnB.wrap(fnC).wrap(fnD);
		var origin = fn;
		while(origin._origin) origin = origin._origin;
		value_of(origin).should_be(fnB);
		value_of(fn.getArity()).should_be(1);
	},
	'wrapped function may be bound on wrap': function(){
		var expected = "expected string";
		(function(){ return this; }).wrap(function(original,args){
			value_of(original.apply(expected,args)).should_be(expected);
		},expected)()
	}
});

describe('Function::memoize',{
	before: function(){
		shared = false;
		powerOfTwo = function(n){ return n>0 && !(n&(n-1)); };
		memoizeMe = function(n){ shared=true; if(n) return powerOfTwo(n); return false; }
	},
	'return values are cached': function(){
		var fn = memoizeMe.memoize();
		shared = false;
		value_of(shared).should_be_false();
		fn(1,2);
		value_of(shared).should_be_true();
		shared = false;
		fn(1,2);
		value_of(shared).should_be_false();
		shared = false;
		fn(1,2,3);
		value_of(shared).should_be_true();
	},
	'memoized function with no arguments should still be cached': function(){
		var fn = memoizeMe.memoize();
		shared = false;
		value_of(shared).should_be_false();
		fn();
		value_of(shared).should_be_true();
		shared = false;
		fn();
		value_of(shared).should_be_false();
	},
	'memos can be specified and return values can be overridden': function(){
		var memos = {};
		memos[[1,2]] = [0,,"str"];
		memos[2] = false;
		memos[3] = false;
		var fn = memoizeMe.memoize(memos);
		value_of(fn(1,2)).should_be(memos[[1,2]]);
		value_of(fn(1)).should_be(true);
		value_of(fn(2)).should_be(memos[2]);
		value_of(fn(3)).should_be(memos[3]);
		value_of(fn(4)).should_be(true);
	}
});

describe('Function::partial',{
	before: function(){
		fn = function(){ return [].slice.call(arguments); };
	},
	'functions may be partially applied': function(){
		var part = fn.partial(1,undefined,undefined,4);
		value_of(part(2,3,5)).should_be([1,2,3,4,5]);
	},
	'underscore may be used as placeholder': function(){
		var part = fn.partial(1,Function._,_,4);
		value_of(part(2,3,5)).should_be([1,2,3,4,5]);
	}
});

describe('Function::curry',{
	before: function(){
		fn = function(){ return [].slice.call(arguments); };
		some = fn.curry(1,2);
		most = some.curry(3);
	},
	'functions may be curried': function(){
		value_of(some()).should_be([1,2]);
		value_of(some(3,4)).should_be([1,2,3,4]);
		value_of(most()).should_be([1,2,3]);
		value_of(most(4,5)).should_be([1,2,3,4,5]);
	}
});

describe('Function::rcurry',{
	before: function(){
		fn = function(){ return [].slice.call(arguments); };
		some = fn.rcurry(4,5);
		most = some.rcurry(3);
	},
	'functions may be (right) curried': function(){
		value_of(some()).should_be([4,5]);
		value_of(some(2,3)).should_be([2,3,4,5]);
		value_of(most()).should_be([3,4,5]);
		value_of(most(1,2)).should_be([1,2,3,4,5]);
	}
});

describe('Function::not',{
	before: function(){
		powerOfTwo = function(n){ return n>0 && !(n&(n-1)); };
		notted = powerOfTwo.not();
	},
	'functions may be notted': function(){
		value_of(powerOfTwo(2)).should_be(true);
		value_of(notted(2)).should_be(false);
		value_of(powerOfTwo(5)).should_be(false);
		value_of(powerOfTwo.not(5)).should_be(true);
	}
});

describe('Function::prepend',{
	before: function(){
		shared = false;
		setShared = function(bool){ return shared = bool; };
		setSharedTrue = function(){ return shared = true; };
		setSharedContext = function(){ return shared = !!this; };
	},
	'functions may be prepended': function(){
		var fn = function(){ value_of(shared).should_be_true(); };
		value_of(shared).should_be_false();
		fn.prepend(setSharedTrue)();
		value_of(shared).should_be_true();
	},
	'arguments are passed through to both functions': function(){
		var fn = function(bool){
			value_of(shared).should_be_true();
			shared = !bool;
			value_of(shared).should_be_false();
		};
		value_of(shared).should_be_false();
		fn.prepend(setShared)(true);
		value_of(shared).should_be_false();
	},
	'context is preserved in both functions': function(){
		var fn = function(){
			value_of(shared).should_be_true();
			shared = !this;
			value_of(shared).should_be_false();
		};
		value_of(shared).should_be_false();
		fn.prepend(setSharedContext).call(true);
		value_of(shared).should_be_false();
	}
});

describe('Function::append',{
	before: function(){
		shared = false;
		setShared = function(bool){ return shared = bool; };
		setSharedTrue = function(){ return shared = true; };
		setSharedContext = function(){ return shared = !!this; };
	},
	'functions may be appended': function(){
		var fn = function(){ value_of(shared).should_be_false(); };
		value_of(shared).should_be_false();
		fn.append(setSharedTrue)();
		value_of(shared).should_be_true();
	},
	'arguments are passed through to both functions': function(){
		var fn = function(bool){
			value_of(shared).should_be_false();
			shared = !bool;
			value_of(shared).should_be_false();
		};
		value_of(shared).should_be_false();
		fn.append(setShared)(true);
		value_of(shared).should_be_true();
	},
	'context is preserved in both functions': function(){
		var fn = function(){
			value_of(shared).should_be_false();
			shared = !this;
			value_of(shared).should_be_false();
		};
		value_of(shared).should_be_false();
		fn.append(setSharedContext).call(true);
		value_of(shared).should_be_true();
	}
});

describe('Function::overload',{
	before: function(){
		fn0 = function(){ return 0; };
		fn1 = function(x){ return 1; };
		fn2 = function(x,y){ return 2; };
		fn3 = function(){ return 3; };
	},
	'create overloaded function': function(){
		var overloaded = fn0.overload(fn1,fn2,fn3);
		value_of(overloaded()).should_be(0);
		value_of(overloaded(0)).should_be(1);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be_undefined();
		var overloaded = fn3.overload(fn0,fn1,fn2);
		value_of(overloaded()).should_be(3);
		value_of(overloaded(0)).should_be(1);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be_undefined();
	},
	'using numerically indexed object': function(){
		var overloaded = fn0.overload({2:fn2,1:fn1,0:fn3});
		value_of(overloaded()).should_be(0);
		value_of(overloaded(0)).should_be(1);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be_undefined();
		var overloaded = fn0.overload({2:fn2,1:fn1,3:fn3});
		value_of(overloaded()).should_be(0);
		value_of(overloaded(0)).should_be(1);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be(3);
		value_of(overloaded(0,0,0,0)).should_be_undefined();
	},
	'using object indexed by different arity': function(){
		var overloaded = fn2.overload({0:fn2,0:fn1,1:fn3,2:fn1,4:fn0});
		value_of(overloaded()).should_be(1);
		value_of(overloaded(0)).should_be(3);
		value_of(overloaded(0,0)).should_be(2);
		value_of(overloaded(0,0,0)).should_be_undefined();
		value_of(overloaded(0,0,0,0)).should_be(0);
		value_of(overloaded(0,0,0,0,0)).should_be_undefined();
	},
	'preserve scope': function(){
		var fn = function(){ return this; },
			expected = "expected string";
		var overload = fn.overload(fn,fn);
		value_of(overload.call(expected)).should_be(expected);
	}
});

describe('Function::getArgs',{
	before: function(){
		fn0 = function(){};
		fn1 = function(a){};
		fn2 = function(a,b){};
		fn3 = function(a,b,c){};
	},
	'correct number of arguments are returned': function(){
		value_of(fn0.getArgs().length).should_be(0);
		value_of(fn1.getArgs().length).should_be(1);
		value_of(fn2.getArgs().length).should_be(2);
		value_of(fn3.getArgs().length).should_be(3);
	},
	'argument names are retrieved': function(){
		value_of(fn0.getArgs()).should_be([]);
		value_of(fn1.getArgs()).should_be(["a"]);
		value_of(fn2.getArgs()).should_be(["a","b"]);
		value_of(fn3.getArgs()).should_be(["a","b","c"]);
	},
	'wrapped functions have arguments of origin function': function(){
		value_of(fn3.memoize().getArgs().length).should_be(3);
		value_of(fn3.wrap(fn2).getArgs().length).should_be(3);
		value_of(fn3.prepend(fn2).getArgs().length).should_be(3);
	}
});

describe('Function::getArity',{
	before: function(){
		fn0 = function(){};
		fn1 = function(a){};
		fn2 = function(a,b){};
		fn3 = function(a,b,c){};
	},
	'correct arity is returned': function(){
		value_of(fn0.getArity()).should_be(0);
		value_of(fn1.getArity()).should_be(1);
		value_of(fn2.getArity()).should_be(2);
		value_of(fn3.getArity()).should_be(3);
	},
	'wrapped functions have arity of origin function': function(){
		value_of(fn3.memoize().getArity()).should_be(3);
		value_of(fn3.wrap(fn2).getArity()).should_be(3);
		value_of(fn3.prepend(fn2).getArity()).should_be(3);
	}
});

describe('Array methods',{
	before: function(){
		
	},
	'array methods exist': function(){
		var fn = function(){},
			methods = ['forEach','each','every','some','filter','map','reduce','sort'];
		methods.each(function(method){
			value_of(fn[method]).should_not_be_undefined();
			value_of(typeof fn[method]).should_be('function');
		});
	},
	'one method works, so all should work': function(){
		value_of((function (a,b){ return a+b; }).reduce([1,2,3,4])).should_be(10);
	}
});

describe('Array::toFunction, Hash::toFunction',{
	before: function(){
		
	},
	'Array::toFunction': function(){
		var arr = [0,1,2,3];
		var fn = arr.toFunction();
		value_of(fn(0)).should_be(arr[0]);
		value_of(fn(1)).should_be(arr[1]);
		value_of(fn(2)).should_be(arr[2]);
		value_of(fn(3)).should_be(arr[3]);
		value_of(fn()).should_be_undefined();
		value_of(fn(-1)).should_be_undefined();
		value_of(fn(4)).should_be_undefined();
	},
	'Hash::toFunction': function(){
		var hash = new Hash({0:3,'str':17,3:'str',undefined:1});
		var fn = hash.toFunction();
		value_of(fn(0)).should_be(hash[0]);
		value_of(fn(0,1)).should_be(hash[0]);
		value_of(fn('str')).should_be(hash['str']);
		value_of(fn(3)).should_be(hash[3]);
		value_of(fn()).should_be(hash[undefined]);
		value_of(fn(1)).should_be_undefined();
		value_of(fn(1,0)).should_be_undefined();
	}
});
