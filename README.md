FunctionTools
=============

FunctionTools (Functional MooTools) is a set of extensions to the
`Function` class that allow for a more functional programming style.
Inspired by [*ShiftSpace's functools*](http://github.com/ShiftSpace/functools).


How To Use
----------

The following is an example of some of the features of FunctionTools

	function(){}


Class Methods
-------------

### Function.empty
Returns `undefined` for any given value. Useful when overriding
another function and desiring no action.

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

### Function.combine(\[fn\]*)
Creates a function that runs all functions passed to `Function.combine`
sequentially. The return value of the last function is returned from
the generated function. Arguments given to the generated function are
passed to all functions run.

	var fnA = function(){ console.log('A'); },
		fnB = function(){ console.log('BC'); },
		fnC = function(_){ console.log(_+23); }
	Function.combine(fnA,fnB,fnC)(100)				// undefined

	// Console output:
	//  A
	//  BC
	//  123

### Function.compose(\[fn\]*)
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

### wrap(fn)
Returns a function that calls the given function, passing to it this
function instance as the first argument and the arguments given to
the generated function as the second argument.

In other words, it wraps this instance in the supplied function. The
supplied function (now called the wrapper function) is passed the
function upon which `wrap` is called as the first argument and the
arguments passed to the generated function as the second argument (as
an array).

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
Returns an memoized version of the function upon which it is called.
The memoized function keeps track of return values and the inputs
that generated them, causing a faster, cached response the next time
the same set of inputs is given. The unique key used to determine if
a return value exists is the set of the context (the `this` value)
and all arguments passed to the memoized function.

If an object containing a set of predetermined inputs and outputs is
given, it will be used to initialize the internal memo collection.
This object does not have to contain the context, just a set of
values indexed by the array of arguments that would generate them.

### partial(\[arg\]*)
*Note: Function._ is defined as _ in the global scope*
Creates a partially applied function that has any passed arguments
that are not `undefined` or `Function._` bound in the position they
are given. The returned function accepts any unbound arguments.

	var fn = function(){ return Array().slice.call(arguments); }
	var part = fn.partial(1,undefined,_,4)		// <#Function:part>
	part(2,3,5)									// [1,2,3,4,5]

### curry(\[arg\]*)
A simplified `partial`. Creates a partially applied function has its
arguments bound to those passed to `curry` in the order in which they
are given.

	var fn = function(){ return Array().slice.call(arguments); }
	var some = fn.curry(1,2)		// <#Function:some>
	some()							// [1,2]
	var most = some.curry(3)		// <#Function:most>
	var all = most(4,5)				// [1,2,3,4,5]

### not(\[arg\]*)
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

### append(fn)

### overload

### getArgs

### getArity

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


TODO
----


Known Issues
------------

There are currently no known issues.


Additional Info
---------------

I am always open for feature requests or any feedback.
I can be reached at [Github](http://github.com/michaelficarra).

Thanks to [ShiftSpace](http://github.com/ShiftSpace) for the
inspiration and original idea.
