FunctionTools
=============

FunctionTools (Functional MooTools) is a set of extensions to the `Function`
class that allow for a more functional programming style.


How To Use
----------

`FunctionTools` is not a single utility, but rather a set of related language
enhancements that allow for a different programming style, so there is no
specific use case for `FunctionTools` as a whole. However, the documentation
for each of the methods provided by `FunctionTools` is listed below.


Class Methods
-------------

### Function.empty => undefined
Returns `undefined` for any given value. Useful when overriding another
function and desiring no action.

	Function.empty()			// undefined
	Function.empty("")			// undefined
	Function.empty(2)			// undefined
	Function.empty(null)		// undefined
	Function.empty(true)		// undefined

### Function.identity (value) => value
Returns whatever value is given. When many values are given, returns an array
containing those values. Useful when a function is expected and one would like
to pass a constant value.

	Function.identity(0)					// 0
	Function.identity("str")				// "str"
	Function.identity(undefined)			// undefined
	Function.identity(null)					// null
	Function.identity(function a(){})		// <#Function:a>
	Function.identity()						// undefined
	Function.identity(0,1,2)				// [0,1,2]
	Function.identity(0,undefined)			// [0,undefined]

### Function.context () => mixed
A function that returns its context (the `this` value).

	Function.context()				// global scope object, likely window
	Function.context.call(1,2)		// 1

### Function.lambda (value) => function() => value
Returns a function that returns the value passed to `Function.lambda`.

	var fn = Function.lambda("lambda")	// <#Function:fn>
	fn()		// "lambda"
	fn(false)	// "lambda"
	fn(18)		// "lambda"

### Function.pluck (property) => function(obj) => obj[property]
Returns a function that returns the property of the passed object referenced by
the argument passed to `Function.pluck`.

	var arr = [[0],[1,2,3],[2,3]],
		len = Function.pluck('length')
	arr.map(Function.pluck(0))			// [0,1,2]
	arr.map(Function.pluck(1))			// [undefined,2,3]
	arr.map(len)						// [1,3,2]
	len(arr)							// 3
	len("string")						// 6
	len({test:"abc",length:"def"})		// "def"

### Function.invoke (method\[, defaultArg\]*) => function(obj) => mixed
Returns a function that calls the method referenced by the first argument
passed to `Function.invoke` of the passed object. Any additional arguments
passed to `Function.invoke` will be used as the default arguments to be passed
the given method by the generated function. Any arguments passed to the
generated function beyond the first will be passed to the function it calls
instead of passing the default arguments.

	var now   = Function.invoke('now'),
		first = Function.invoke(0,'a'),
		obj   = {now:Function.identity},
		arr   = [Function.identity];
	now(Date)			// <the current date>
	now(obj,0,1,2)		// [0,1,2]
	first(arr)			// 'a'
	first(arr,'b')		// 'b'

### Function.sequence (\[fn\]\*) => function(\[arg\]*) => mixed
Creates a function that calls the first passed function on the first call, the
second passed function on the next call (if one was passed), and so on. The
last function is treated as if it proceeds the first function. Arguments passed
to the generated function are passed to the original functions. The return
value is the return value of the original function. When called with no
arguments, Function.sequence returns Function.empty.

	var fn1 = function(){ return 1; },
		fn2 = function(){ return 2; },
		fn3 = function(){ return 3; },
		seq = Function.sequence(fn1,fn2,fn3);
	seq();		// 1
	seq();		// 2
	seq();		// 3
	seq();		// 1
	seq();		// 2

### Function.concat / Function.concatenate (\[fn\]\*) => function(\[arg\]\*) => mixed
Creates a function that runs all functions passed to `Function.concat`
sequentially. The return value of the last function is returned by the
generated function. Arguments given to the generated function are passed to all
functions.

	var fnA = function(){ console.log('A'); },
		fnB = function(){ console.log('B'); },
		fnC = function(_){ console.log(_+23); }
	Function.concat(fnA,fnB,fnC)(100)				// undefined

	// Console Output:
	//  A
	//  B
	//  123

### Function.compose (\[fn\]\*) => function(\[arg\]\*) => mixed
Creates a function that runs all functions passed in reverse order, passing the
return value of the last function run as the input to the next function. Any
arguments given to the generated function will be passed to the first function
called.

	var a = function(str){ return 'a'+str; },
		b = function(str){ return 'b'+str; },
		c = function(str1,str2){ return 'c'+str1+str2+'f'; },
		fn = Function.compose(a,b,c)
	fn('d','e')		// "abcde"

### Function.overload (\[fn\]\*) => function(\[arg\]\*) => mixed
If an object having numeric keys is given as the sole argument, returns a
function that will call the function indexed by the number of arguments passed
to it. If a list of functions is given as arguments, returns a function that
calls the last function given that has an arity of the number of arguments
passed to the returned function.

	var fnA = function(){ return 'A'; },
		fnB = function(x){ return 'B'; },
		fnC = function(y,y){ return 'C'; },
		fnD = funciton(z,z,z){ return 'D'; }
	var overloaded = Function.overload(fnA,fnB,fnC,fnD)	// <#Function:overload>
	overload()			// 'A'
	overload(0,0)		// 'C'
	overload(0,0,0,0)	// undefined

	overloaded = Function.overload({
		0:fnD, 1:fnC, 2:fnB, 8:fnA
	})
	overloaded(0)							// 'C'
	overloaded(0,0,0)						// undefined
	overloaded.apply({},new Array(8))		// 'A'


Instance Methods
----------------

### wrap (fn\[, bind\]) => function(\[arg\]\*) => mixed
Returns a function that calls the given function, passing to it this function
instance as the first argument and the arguments given to the generated
function as the second argument.

In other words, it wraps this Function instance in the given function. The
arguments given to the generated function (the wrapper function) are the
function upon which `wrap` is called and the arguments object from the
generated function (as an array).

An optional bind argument may be given, which binds the function upon which
`wrap` is called to the given value.

Examples of usage taken from the source:

	Function.implement({
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
		}
	});

### memoize(\[memos\])
*Note: Objects are compared using exact equality (`===`), arrays are considered equal if their contents are equal*

Returns a memoized version of the function upon which memoize is called.  The
memoized function keeps track of return values and the inputs that generated
them, causing a faster, cached response the next time the same set of inputs is
given. The unique key used to determine if a return value exists is the set of
the context (the `this` value) and all arguments passed to the memoized
function.

The internal memo collection can be initialized by passing one or more
specially formatted objects containing a set of predetermined inputs and
outputs as the first argument to `memoize`. The object must have a
`returnValue` property, and may have `context` and `args` properties. The
`returnValue` property specifies the value returned by the generated function
on a cache hit. The `context` property defines the context that must be
matched, and the `args` property defines the arguments that must be matched for
a cache hit. The context or args values, if undefined, will match any context
or arguments.  The `args` value can either be a single value or an array
containing zero or more values.


	TODO: example code


### partial(\[arg\]\*)
*Note: Function._ is defined as _ in the global scope*

Creates a partially applied function that has any passed arguments that are not
`undefined` or `Function._` bound in the position they are given. The returned
function accepts any unbound arguments.

	var fn = function(){ return [].slice.call(arguments); }
	var part = fn.partial(1,undefined,_,4)		// <#Function:part>
	part(2,3,5)									// [1,2,3,4,5]

### curry(\[arg\]\*)
A simplified `Function::partial`. Creates a partially applied function that has
its arguments bound to those passed to `curry` in the order in which they are
given.

	var fn = function(){ return [].slice.call(arguments); }
	var some = fn.curry(1,2)		// <#Function:some>
	some()							// [1,2]
	var most = some.curry(3)		// <#Function:most>
	var all = most(4,5)				// [1,2,3,4,5]

### not(\[arg\[, arg\]\*\])
When called with no arguments, returns a function that returns the opposite
Boolean representation of the return value of the function upon which `not` is
called. When arguments are passed to `not`, the opposite Boolean representation
of the return value of the function upon which `not` is called when passed
those arguments is returned.

	var powerOfTwo = function(n){ return n>0 && !(n&(n-1)); }
	var notted = powerOfTwo.not()	// <#Function:notted>
	powerOfTwo(2)			// true
	notted(2)				// false
	powerOfTwo(5)			// false
	powerOfTwo.not(5)		// true

### append(fn\[, fn\]\*)
Returns a new function that runs the given function(s) after running the
function upon which `append` was called. Any arguments passed to the generated
function will be passed to all functions. The return value of the generated
function is the return value of the function upon which `append` was called.

	var sharedArr = [],
		fnA = function(){ sharedArr.push(0); return 0; },
		fnB = function(){ sharedArr.push(1); return 1; },
		fnC = function(){ sharedArr.push(2); return 2; },

	var fnAB = fnA.append(fnB),
		fnBC = fnB.append(fnC),
		fnABC = fnA.append(fnB,fnC);
	fnA()				// 0
	sharedArr			// [0]
	fnAB()				// 0
	sharedArr			// [0,0,1]
	fnBC()				// 1
	sharedArr			// [0,0,1,1,2]
	fnABC()				// 0
	sharedArr			// [0,0,1,1,2,0,1,2]

### prepend(fn\[, fn\]\*)
Returns a new function that runs the given function(s) before running the
function upon which `prepend` was called. Any arguments passed to the generated
function will be passed to all functions. The return value of the generated
function is the return value of the function upon which `prepend` was called.

	var sharedArr = [],
		fnA = function(_){ sharedArr.push(0+_); return 0; },
		fnB = function(_){ sharedArr.push(1+_); return 1; },
		fnC = function(_){ sharedArr.push(2+_); return 2; },

	var fnAB = fnB.prepend(fnA),
		fnBC = fnC.prepend(fnB),
		fnABC = fnC.prepend(fnA,fnB);
	fnA(0)				// 0
	sharedArr			// [0]
	fnAB(1)				// 1
	sharedArr			// [0,1,2]
	fnBC(2)				// 2
	sharedArr			// [0,1,2,3,4]
	fnABC(3)			// 2
	sharedArr			// [0,1,2,3,4,3,4,5]

### overload(\[funcTable\])
If a numerically indexed object containing functions is given as the only
argument, the function upon which `overload` is called is added to the object
(indexed by its arity) and the object is passed to `Function.overload`. If a
list of functions is given, the function upon which `overload` is called is
appended to the list and the list is passed to `Function.overload`. In either
case, the return value of `Function.overload` is returned.

	var fnA = function(){ return "A"; },
		fnB = function(b){ return "B"; },
		fnC = function(){ return "C"; }
	fnA.overload(fnB,fnC)()				// "A"
	fnA.overload({1:fnB,2:fnC})(0)		// "B"
	fnC.overload(fnA,fnB)()				// "C"

### getArgs
Returns an array containing the arguments expected by the function upon which
`getArgs` is called.

	function(one,two){}.getArgs()				// ["one","two"]
	function(a,b,c){}.memoize().getArgs()		// ["a","b","c"]
	function(){}.getArgs()						// []

### getArity
Returns the number of arguments expected by the function upon which `getArity`
is called.

	function(one,two){}.getArity()				// 2
	function(a,b,c){}.memoize().getArity()		// 3
	function(){}.getArity()						// 0

### Array Methods
The array methods `forEach`, `each`, `every`, `some`, `filter`, `map`,
`reduce`, `reduceRight`, and `sort` are defined as Function instance methods
that accept an array as input. `foldl` and `foldr` are implemented as aliases
to `reduce` and `reduceRight`. The function call is translated into the
associated method call on the array, passing the function upon which the method
was called as the first argument and any other arguments supplied as successive
arguments.

	var fn = function (a,b){ return a+b; }		// <#Function:fn>
	fn.reduce([1,2,3,4],0)						// 10

### Array::toFunction
Returns a function that returns the value of any property of the array upon
which `toFunction` was called. Most useful for accessing the numeric properties
of the array.

	var arr = ['a','b','c']			// ['a','b','c']
	var fn = arr.toFunction()		// <#Function:fn>
	fn(0)							// 'a'
	fn(2)							// 'c'
	fn(3)							// undefined
	fn('length')					// 3

### Hash::toFunction
Returns a function that returns the value of any property of the hash upon
which `toFunction` was called.

	var obj = new Hash({a:0,b:1,c:2})	// {a:0,b:1,c:2}
	var fn = obj.toFunction()			// <#Function:fn>
	fn('a')								// 0
	fn('c')								// 2
	fn('z')								// undefined
	fn('hasOwnProperty')				// <#Function:hasOwnProperty>


Globals
-------

### \_(\[n\]) / Function.\_(\[n\])
The underscore function accesses successive arguments of the function in which
it is called. If a number is given as an argument, the argument at that index
is returned and the internal pointer is not advanced.

The underscore function can also be passed to `partial` as the placeholder for
undefined arguments rather than passing `undefined`.

	var fn = function(a){
		return [_(),_(3),_(),_(),_(0),_(),_()];
	}
	fn(1,2,3,4)		// [1,4,2,3,1,4,undefined]


TODO
----

* example code for Function::memoize
* document Function::traced
* document Function::getOrigin
* document Function::toFunction
* document Function::rcurry
* document Function::saturate
* document Function::aritize
* document Function.and, Function.or, Function.xor
* update all method signatures in documentation to include return values
* update YAML header and package.yml to reflect final API

Known Issues
------------

* The underscore function is broken in chrome, caused by
arguments.callee.caller.arguments not returning the same object on separate
accesses. See [V8 Issue 222](http://code.google.com/p/v8/issues/detail?id=222).


Additional Info
---------------

I am always open for feature requests or any feedback.
I can be reached at [Github](http://github.com/michaelficarra).
