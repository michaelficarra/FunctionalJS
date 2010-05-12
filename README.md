FunctionTools
=============

FunctionTools (Functional MooTools) is a set of extensions to the
`Function` class that allow for a more functional programming style.
Inspired by [*ShiftSpace's functools*](http://github.com/ShiftSpace/functools).


How To Use
----------

`FunctionTools` is a set of related language enhancements that allow
for a different programming style rather than a single utility, so
there is no specific use case for `FunctionTools` as a whole. However,
the documentation for each of the methods provided by `FunctionTools`
is listed below.


Class Methods
-------------

### Function.empty
Returns `undefined` for any given value. Useful when overriding
another function and desiring no action.

	Function.empty()			// undefined
	Function.empty("")			// undefined
	Function.empty(2)			// undefined
	Function.empty(null)		// undefined
	Function.empty(true)		// undefined

### Function.identity(value)
Returns whatever value is given. Useful when a function is expected
and one would like to pass the provided value.

	Function.identity(0)				// 0
	Function.identity("str")			// "str"
	Function.identity(undefined)		// undefined
	Function.identity(null)				// null
	Function.identity(function(){})		// <#Function>
	Function.identity()					// undefined

### Function.lambda(value)
Returns a function that returns the value passed to `Function.lambda`.

	var fn = Function.lambda("lambda")	// <#Function:fn>
	fn()		// "lambda"
	fn(false)	// "lambda"
	fn(18)		// "lambda"

### Function.sequence(\[fn\]\*)
Creates a function that runs all functions passed to `Function.sequence`
sequentially. The return value of the last function is returned from
the generated function. Arguments given to the generated function are
passed to all functions run.

	var fnA = function(){ console.log('A'); },
		fnB = function(){ console.log('BC'); },
		fnC = function(_){ console.log(_+23); }
	Function.sequence(fnA,fnB,fnC)(100)				// undefined

	// Console Output:
	//  A
	//  BC
	//  123

### Function.compose(\[fn\]\*)
Creates a function that runs all functions passed in reverse order,
passing the return value of the last function run as the input to the
next function. Any arguments given to the generated function will be
passed to the first function called.

	var a = function(str){ return 'a'+str; },
		b = function(str){ return 'b'+str; },
		c = function(str1,str2){ return 'c'+str1+str2+'f'; },
		fn = Function.compose(a,b,c)
	fn('d','e')		// "abcde"

### Function.overload
If an object having numeric keys is given as the sole argument,
returns a function that will call the function indexed by the number
of arguments passed to it. If a list of functions is given as
arguments, returns a function that calls the last function given that
has an arity of the number of arguments passed to the returned
function.

	var fnA = function(){ return 'A'; },
		fnB = function(x){ return 'B'; },
		fnC = function(y,y){ return 'C'; },
		fnD = funciton(z,z,z){ return 'D'; }
	var overload = Function.overload(fnA,fnB,fnC,fnD)	// <#Function:overload>
	overload()			// 'A'
	overload(0,0)		// 'C'
	overload(0,0,0,0)	// undefined

	overload = Function.overload({
		0:fnD, 1:fnC, 2:fnB, 8:fnA
	})
	overload(0)							// 'C'
	overload(0,0,0)						// undefined
	overload.apply({},new Array(8))		// 'A'


Instance Methods
----------------

### wrap(fn\[, bind\])
Returns a function that calls the given function, passing to it this
function instance as the first argument and the arguments given to
the generated function as the second argument.

In other words, it wraps this instance in the supplied function. The
supplied function (now called the wrapper function) is passed the
function upon which `wrap` is called as the first argument and the
arguments passed to the generated function as the second argument (as
an array).

An optional bind argument may be given, which binds the function upon
which `wrap` is called to the given value.

`wrap` handles the preservation of a reference to the function upon
which `wrap` is called for use by methods like `getArgs`. Examples
of usage taken from the source:

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
	})

### memoize(\[memos\])
Returns a memoized version of the function upon which it is called.
The memoized function keeps track of return values and the inputs
that generated them, causing a faster, cached response the next time
the same set of inputs is given. The unique key used to determine if
a return value exists is the set of the context (the `this` value)
and all arguments passed to the memoized function.

If an object containing a set of predetermined inputs and outputs is
given, it will be used to initialize the internal memo collection.
This object does not have to contain the context, just a set of
values indexed by the array of arguments that would generate them. If
only a single argument is used as input, that value may be used as
the key (rather than an array containing only that value). The
memoized function will do a context-independent comparison to check
if an array containing the arguments  is a key of the given object.

	var fn = function(n){
		console.log('unmemoized input: '+n);
		return n.pow(2);
	}										// <#Function:fn>
	var memoized = fn.memoize()				// <#Function:memoized>

	console.log('return value: ',fn(2))
	console.log('return value: ',fn(2))
	console.log('return value: ',memoized(3))
	console.log('return value: ',memoized(3))

	memoized = fn.memoize({4:16})		// <#Function:memoized>

	console.log('return value: ',memoized(4))
	console.log('return value: ',memoized(4))

	// Console Output:
	//  unmemoized input: 2
	//  return value: 4
	//  unmemoized input: 2
	//  return value: 4
	//  unmemoized input: 3
	//  return value: 9
	//  return value: 9
	//  return value: 16
	//  return value: 16

### partial(\[arg\]\*)
*Note: Function._ is defined as _ in the global scope*
Creates a partially applied function that has any passed arguments
that are not `undefined` or `Function._` bound in the position they
are given. The returned function accepts any unbound arguments.

	var fn = function(){ return [].slice.call(arguments); }
	var part = fn.partial(1,undefined,_,4)		// <#Function:part>
	part(2,3,5)									// [1,2,3,4,5]

### curry(\[arg\]\*)
A simplified `partial`. Creates a partially applied function has its
arguments bound to those passed to `curry` in the order in which they
are given.

	var fn = function(){ return [].slice.call(arguments); }
	var some = fn.curry(1,2)		// <#Function:some>
	some()							// [1,2]
	var most = some.curry(3)		// <#Function:most>
	var all = most(4,5)				// [1,2,3,4,5]

### not(\[arg\]\*)
When called with no arguments, returns a function that returns the
opposite Boolean representation of the return value of the function
upon which `not` is called. When arguments are passed to `not`, the
opposite Boolean representation of the return value of the function
upon which `not` is called when passed those arguments is returned.

	var powerOfTwo = function(n){ return n>0 && !(n&(n-1)); }
	var notted = powerOfTwo.not()	// <#Function:fn>
	powerOfTwo(2)			// true
	notted(2)				// false
	powerOfTwo(5)			// false
	powerOfTwo.not(5)		// true

### prepend(fn)
Returns a new function that runs the given function before running
the function upon which `prepend` was called. Any arguments passed to
the generated function will be passed to both functions. The return
value does not change when a function is prepended.

	var fnA = function(x){ console.log("A",x); },
		fnB = function(x){ console.log("B",x); },
		fnC = function(x){ console.log("C",x); };
	var fnAB = fnB.prepend(fnA),
		fnBC = fnC.prepend(fnB),
		fnABC = fnC.prepend(fnB).prepend(fnA);
	fnAB(1)
	fnBC(2)
	fnABC(3)

	// Console Output:
	//  A 1
	//	B 1
	//  B 2
	//  C 2
	//  A 3
	//  B 3
	//  C 3

### append(fn)
Returns a new function that runs the given function after running
the function upon which `append` was called. Any arguments passed to
the generated function will be passed to both functions. The return
value becomes that of the appended function.

	var fnA = function(x){ console.log("A",x); },
		fnB = function(x){ console.log("B",x); },
		fnC = function(x){ console.log("C",x); };
	var fnAB = fnA.append(fnB),
		fnBC = fnB.append(fnC),
		fnABC = fnA.append(fnB).append(fnC);
	fnAB(1)
	fnBC(2)
	fnABC(3)

	// Console Output:
	//  A 1
	//	B 1
	//  B 2
	//  C 2
	//  A 3
	//  B 3
	//  C 3

### overload(\[funcTable\])
If a numerically indexed object containing functions is given as the
only argument, the function upon which `overload` is called is added
to the object (indexed by its arity) and the object is passed to
`Function.overload`. If a list of functions is given, the function
upon which `overload` is called is appended to the list and the list
is passed to `Function.overload`. In either case, the return value of
`Function.overload` is returned.

	var fnA = function(){ return "A"; },
		fnB = function(b){ return "B"; },
		fnC = function(){ return "C"; }
	fnA.overload(fnB,fnC)()				// "A"
	fnA.overload({1:fnB,2:fnC})(0)		// "B"
	fnC.overload(fnA,fnB)()				// "C"

### getArgs
Returns an array containing the arguments expected by the function
upon which `getArgs` is called.

	function(one,two){}.getArgs()				// ["one","two"]
	function(a,b,c){}.memoize().getArgs()		// ["a","b","c"]

### getArity
Returns the number of arguments expected by the function upon which
`getArity` is called.

	function(one,two){}.getArity()				// 2
	function(a,b,c){}.memoize().getArity()		// 3

### Array Methods
The array methods `forEach`, `each`, `every`, `some`, `filter`,
`map`, `reduce`, `reduceRight`, and `sort` are defined as Function
instance methods that accept an array as input. `foldl` and `foldr`
are implemented as aliases to `reduce` and `reduceRight`. The
function call is translated into the associated method call on the
array, passing the function upon which the method was called as the
first argument and any other arguments supplied as successive
arguments.

	var fn = function (a,b){ return a+b; }		// <#Function:fn>
	fn.reduce([1,2,3,4],0)						// 10

### Array::toFunction
Returns a function that returns the value of any property of the
array upon which `toFunction` was called. Most useful for accessing
the numeric properties of the array.

	var arr = ['a','b','c']			// ['a','b','c']
	var fn = arr.toFunction()		// <#Function:fn>
	fn(0)							// 'a'
	fn(2)							// 'c'
	fn(3)							// undefined
	fn('length')					// 3

### Hash::toFunction
Returns a function that returns the value of any property of the hash
upon which `toFunction` was called.

	var obj = new Hash({a:0,b:1,c:2})	// {a:0,b:1,c:2}
	var fn = obj.toFunction()			// <#Function:fn>
	fn('a')								// 0
	fn('c')								// 2
	fn('z')								// undefined
	fn('hasOwnProperty')				// <#Function:hasOwnProperty>


Globals
-------

### \_(\[n\]) / Function.\_(\[n\])
The underscore function accesses successive arguments of the function
in which it is called. If a number is given as an argument, the
argument at that index is returned and the internal pointer is not
advanced.

The underscore function can also be passed to `partial` as the
placeholder for undefined arguments rather than passing `undefined`.

	var fn = function(a){
		return [_(),_(3),_(),_(),_(0),_(),_()];
	}
	fn(1,2,3,4)		// [1,4,2,3,1,4,undefined]


TODO
----

* Function.pluck(key)
* Function.invoke(key)
* rcurry(\[args\]\*)
* traced(\[functionName\])
* toFunction()
* saturate(\[args\]\*)
* aritize(n)
* document boolean functions

Known Issues
------------

* The underscore function is broken in chrome, caused by
arguments.callee.caller.arguments not returning the same object on
separate accesses. See [V8 Issue 222](http://code.google.com/p/v8/issues/detail?id=222).


Additional Info
---------------

I am always open for feature requests or any feedback.
I can be reached at [Github](http://github.com/michaelficarra).

Thanks to [ShiftSpace](http://github.com/ShiftSpace) for the
inspiration and original idea.
