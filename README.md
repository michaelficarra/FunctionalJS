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

### Function.\_ (\[index\])
The underscore function accesses successive arguments of the function in which
it is called. If a number is given as an argument, the argument at that index
is returned and the internal pointer is not advanced.

The underscore function can also be passed to `Function::partial` as the
placeholder for undefined arguments rather than passing `undefined`.

	var fn = function(a){
		return [_(),_(3),_(),_(),_(0),_(),_()];
	}
	fn(1,2,3,4)    // [1,4,2,3,1,4,undefined]

### Function.empty ⇒ undefined
Returns `undefined` for any given value. Useful when overriding another
function and desiring no action.

	Function.empty()        // undefined
	Function.empty("")      // undefined
	Function.empty(2)       // undefined
	Function.empty(null)    // undefined
	Function.empty(true)    // undefined

### Function.identity (*args) ⇒ value
Returns whatever it is given. When many arguments are given, returns an array
containing those values. Useful when a function is expected and one would like
to pass a constant value.

	Function.identity(0)                 // 0
	Function.identity("str")             // "str"
	Function.identity(undefined)         // undefined
	Function.identity(null)              // null
	Function.identity(function a(){})    // <#Function:a>
	Function.identity()                  // undefined
	Function.identity(0,1,2)             // [0,1,2]
	Function.identity(0,undefined)       // [0,undefined]

### Function.context ⇒ this
A function that returns its context (the `this` value).

	Function.context()            // global scope object, likely window
	Function.context.call(1,2)    // 1

### Function.lambda (value) ⇒ function() ⇒ value
Returns a function that returns **value**.

	var fn = Function.lambda("lambda")    // <#Function:fn>
	fn()         // "lambda"
	fn(false)    // "lambda"
	fn(18)       // "lambda"

### Function.pluck (property) ⇒ function(obj) ⇒ obj[property]
Returns a function that returns the property of the passed object referenced by
**property**.

	var arr = [[0],[1,2,3],[2,3]],
		len = Function.pluck('length')
	arr.map(Function.pluck(0))        // [0,1,2]
	arr.map(Function.pluck(1))        // [undefined,2,3]
	arr.map(len)                      // [1,3,2]
	len(arr)                          // 3
	len("string")                     // 6
	len({test:"abc",length:"def"})    // "def"

### Function.invoke (method, \*defaultArg) ⇒ function(obj)
Returns a function that calls the method referenced by **method** of **obj**.
Any additional arguments passed to `Function.invoke` will be used as the
default arguments to be passed to the given method by the generated function.
Any arguments passed to the generated function beyond the first will be passed
to the function it calls instead of passing the default arguments.

	var now   = Function.invoke('now'),
		first = Function.invoke(0,'a'),
		obj   = {now:Function.identity},
		arr   = [Function.identity];
	now(Date)         // <the current date>
	now(obj,0,1,2)    // [0,1,2]
	first(arr)        // 'a'
	first(arr,'b')    // 'b'

### Function.sequence (\*fn) ⇒ function(\*arg)
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
	seq()    // 1
	seq()    // 2
	seq()    // 3
	seq()    // 1
	seq()    // 2

### Function.concat\[enate\] (\*fn) ⇒ function(\*arg)
Creates a function that runs all functions passed to `Function.concat`
sequentially. The return value of the last function is returned by the
generated function. Arguments given to the generated function are passed to all
functions.

	var sharedArr = [],
		fnA = function(){ sharedArr.push('A'); return 0; },
		fnB = function(){ sharedArr.push('B'); return 1; },
		fnC = function(_){ sharedArr.push(_+23); return 2; }
	Function.concat(fnA,fnB,fnC)(100)    // 2
	sharedArr                            // ['A','B',123]

### Function.compose (\*fn) ⇒ function(\*arg)
Creates a function that runs all functions passed in reverse order, passing the
return value of the last function run as the input to the next function. Any
arguments given to the generated function will be passed to the first function
called.

	var a = function(str){ return 'a'+str; },
		b = function(str){ return 'b'+str; },
		c = function(str1,str2){ return 'c'+str1+str2+'f'; },
		fn = Function.compose(a,b,c)
	fn('d','e')    // "abcde"

### Function.overload (\*fn) ⇒ function(\*arg)
If an object having numeric keys is given as the sole argument, returns a
function that will call the function indexed by the number of arguments passed
to it. If a list of functions is given as arguments, returns a function that
calls the last function given that has an arity of the number of arguments
passed to the returned function.

	var fnA = function(){ return 'A'; },
		fnB = function(x){ return 'B'; },
		fnC = function(y,y){ return 'C'; },
		fnD = funciton(z,z,z){ return 'D'; }
	var overloaded = Function.overload(fnA,fnB,fnC,fnD)  // <#Function:overloaded>
	overload()           // 'A'
	overload(0,0)        // 'C'
	overload(0,0,0,0)    // undefined

	overloaded = Function.overload({
		0:fnD, 1:fnC, 2:fnB, 8:fnA
	})
	overloaded(0)                        // 'C'
	overloaded(0,0,0)                    // undefined
	overloaded.apply({},new Array(8))    // 'A'

### Function.and (\*fn) ⇒ function(\*arg)
Returns a function that returns the result of performing a Boolean AND
operation on the return values of all functions passed to `Function.and`.
Arguments given to the generated function will be passed to the called
functions. Short-circuit evaluation logic is applied. When only a single
function is given to `Function.and`, the Boolean interpretation of the return
value of that function is returned. When no arguments are given, returns
`Function.empty`.

	var fnTrue = Function.lambda(true),
		fnFalse = Function.lambda(false);
	Function.and()()                   // undefined
	Function.and(fnTrue)()             // true
	Function.and(fnFalse)()            // false
	Function.and(fnTrue,fnFalse)()     // false
	Function.and(fnFalse,fnFalse)()    // false
	Function.and(fnTrue,fntrue)()      // true

### Function.or (\*fn) ⇒ function(\*arg)
Behaves exactly as `Function.and`, except uses Boolean *OR* logic instead of
Boolean *AND* logic.

### Function.xor (\*fn) ⇒ function(\*arg)
Behaves as `Function.and` and `Function.or`, except uses Boolean *XOR* logic
and does not short-circuit.


Instance Methods
----------------

### toFunction ⇒ this
Returns the function upon which `toFunction` is called.

### wrap (fn, \[bind\]) ⇒ function(\*arg)
Returns a function that calls **fn**, passing to it this function instance as
the first argument and the arguments given to the generated function as the
second argument.

In other words, it wraps this Function instance in **fn**. The arguments given
to the generated function (the wrapper function) are the function upon which
`wrap` is called and the arguments object from the generated function (as an
array).

An optional second argument may be given, which binds the function upon which
`wrap` is called to **bind**.

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

### getOrigin ⇒ function(\*arg)
*Note: All Function instance methods defined in FunctionTools that return a function use `wrap` to create it; you should, too!*
When called on functions passed through `wrap`, `getOrigin` returns the value
returned when `getOrigin` is applied to the function on which `wrap` was
originally called.  Otherwise, `getOrigin` acts like `Function.context` and
returns the function upon which it is called. This essentially walks the chain
of wrapped functions to find the original function with none of the
modifications applied to it.

	var fn = function(a,b){ return a+b; },
		notted = fn.not(),
		curried = notted.curry(2);

	notted.getOrigin()            // <#Function:fn>
	notted === fn                 // false
	notted.getOrigin() === fn     // true
	curried.getOrigin() === fn    // true

### memoize (\[memos\]) ⇒ function(*args)
*Note: Objects are compared using exact equality (`===`), arrays are considered equal if their contents are equal*

Returns a memoized version of the function upon which memoize is called.  The
memoized function keeps track of return values and the inputs that generated
them, causing a faster, cached response the next time the same set of inputs is
given. The unique key used to determine if a return value exists is the set of
the context (the `this` value) and all arguments passed to the memoized
function.

The internal memo collection can be initialized by passing one or more
specially formatted objects containing a set of predetermined inputs and
outputs as the first argument to `memoize` (**memos**). The object must have a
`returnValue` property, and may have `context` and `args` properties. The
`returnValue` property specifies the value returned by the generated function
on a cache hit. The `context` property defines the context that must be
matched, and the `args` property defines the arguments that must be matched for
a cache hit. The context or args values, if undefined, will match any context
or arguments.  The `args` value can either be a single value or an array
containing zero or more values.

	var tFunction = Function.lambda(true),
		defs = [
			{args: 3, returnValue: false},
			{args: [1,2], returnValue: false}
		]
		memoized = tFunction.memoize(defs);

	memoized()       // true
	memoized(1)      // true
	memoized(1,2)    // false
	memoized(2,1)    // true
	memoized(2)      // true
	memoized(3)      // false
	tFunction(3)     // true

### traced ([name, [opts]]) ⇒ function(\*args)
Wraps the function upon which `trace` is called so that it logs useful
information to the console (according to **opts**) whenever it is called. If a
non-falsey value is given for **name**, it will be used in the console's group
name. The available options for `traced` are:

* Function.TRACE\_NONE
  Will cause the traced function to only log that it was called.
* Function.TRACE\_ALL
  Will cause the traced function to act as if all options were enabled.
* Function.TRACE\_ARGUMENTS
  Will log the arguments passed to the traced function.
* Function.TRACE\_CONTEXT
  Will log the context (`this` value) of the traced function.
* Function.TRACE\_RETURN
  Will log the return value of the traced function.
* Function.TRACE\_TIME
  Will log the time it takes to run the function.
* Function.TRACE\_STACK
  Will log a stack trace.

**opts** may be the bitwise OR of any of these options. **opts** defaults to
`Function.TRACE_ARGUMENTS | Function.TRACE_RETURN`. 

	var fn1 = function(){},
		traced1 = fn1.traced('fn1');
	traced1();

	var fn2 = function funcTwo(){},
		traced2 = fn2.traced(undefined,Function.TRACE_ALL);
	traced2();

	var fn3 = function(){},
		traced3 = fn3.traced('fn3',Function.TRACE_RETURN | Function.TRACE_CONTEXT);
	traced3();

### partial (\*args) ⇒ function(\*args)
*Note: Function.\_ is defined as \_ in the global scope*

Creates a partially applied function that has any passed arguments that are not
`undefined` or `Function._` bound in the position they are given. The returned
function accepts any unbound arguments.

	var fn = function(){ return [].slice.call(arguments); }
	var part = fn.partial(1,undefined,_,4)      // <#Function:part>
	part(2,3,5)                                 // [1,2,3,4,5]

### curry (\*args) ⇒ function(\*args)
A simplified `Function::partial`. Creates a partially applied function that has
the arguments given to `curry` bound to its leftmost arguments in the order in
which they are given.

	var fn = function(){ return [].slice.call(arguments); }
	var some = fn.curry(1,2)        // <#Function:some>
	some()                          // [1,2]
	var most = some.curry(3)        // <#Function:most>
	var all = most(4,5)             // [1,2,3,4,5]

### rcurry (\*args) ⇒ function(\*args)
Creates a partially applied function that has the arguments given to `rcurry`
bound to its rightmost arguments in the order in which they are given.

	var fn = function(){ return [].slice.call(arguments); }
	var some = fn.rcurry(4,5)       // <#Function:some>
	some()                          // [4,5]
	var most = some.rcurry(3)       // <#Function:most>
	var all = most(1,2)             // [1,2,3,4,5]

### not (\*args) ⇒ mixed
When called with no arguments, returns a function that returns the opposite
Boolean representation of the return value of the function upon which `not` is
called. When arguments are passed to `not`, the opposite Boolean representation
of the return value of the function upon which `not` is called when passed
those arguments is returned.

	var powerOfTwo = function(n){ return n>0 && !(n&(n-1)); }
	var notted = powerOfTwo.not()   // <#Function:notted>
	powerOfTwo(2)        // true
	notted(2)            // false
	powerOfTwo(5)        // false
	powerOfTwo.not(5)    // true

### append (\*fn) ⇒ function(\*args)
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
	fnA()        // 0
	sharedArr    // [0]
	fnAB()       // 0
	sharedArr    // [0,0,1]
	fnBC()       // 1
	sharedArr    // [0,0,1,1,2]
	fnABC()      // 0
	sharedArr    // [0,0,1,1,2,0,1,2]

### prepend (\*fn) ⇒ function(\*args)
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
	fnA(0)       // 0
	sharedArr    // [0]
	fnAB(1)      // 1
	sharedArr    // [0,1,2]
	fnBC(2)      // 2
	sharedArr    // [0,1,2,3,4]
	fnABC(3)     // 2
	sharedArr    // [0,1,2,3,4,3,4,5]

### overload (\[funcTable\]) ⇒ function(\*args)
If a numerically indexed object containing functions is given as the only
argument, the function upon which `overload` is called is added to the object
(indexed by its arity) and the object is passed to `Function.overload`. If a
list of functions is given, the function upon which `overload` is called is
appended to the list and the list is passed to `Function.overload`. In either
case, the return value of `Function.overload` is returned.

	var fnA = function(){ return "A"; },
		fnB = function(b){ return "B"; },
		fnC = function(){ return "C"; }
	fnA.overload(fnB,fnC)()             // "A"
	fnA.overload({1:fnB,2:fnC})(0)      // "B"
	fnC.overload(fnA,fnB)()             // "C"

### saturate (*args) ⇒ function()
Returns a function that fixes the arguments passed to `saturate` to the
function upon which it is called. Arguments given to the returned function will
be ignored in favor of the originally passed arguments.

	Function.identity.saturate(1,2)()         // [1,2]
	Function.identity.saturate(1,2)(3,4)      // [1,2]
	Function.identity.saturate()()            // undefined
	Function.identity.saturate()(1,2)         // undefined
	Function.identity.saturate(1)()           // 1
	Function.identity.saturate(2)(1,2)        // 2

### aritize (arity) ⇒ function(*args)
If given a non-negative **arity**, a function that only accepts the first
**arity** arguments is returned. If **arity** is less than zero, a function
that accepts all but the last **arity** arguments is returned.

	Function.identity.aritize(2)(0,1,2)       // [0,1]
	Function.identity.aritize(0)(0,1)         // undefined
	Function.identity.aritize(-2)(0,1,2)      // 0

### getArgs ⇒ array
Returns an array containing the arguments expected by the function upon which
`getArgs` is called.

	function(one,two){}.getArgs()             // ["one","two"]
	function(a,b,c){}.memoize().getArgs()     // ["a","b","c"]
	function(){}.getArgs()                    // []

### getArity ⇒ integer
Returns the number of arguments expected by the function upon which `getArity`
is called.

	function(one,two){}.getArity()            // 2
	function(a,b,c){}.memoize().getArity()    // 3
	function(){}.getArity()                   // 0

### Array Methods
The array methods `forEach`, `each`, `every`, `some`, `filter`, `map`,
`reduce`, `reduceRight`, and `sort` are defined as Function instance methods
that accept an array as input. `foldl` and `foldr` are implemented as aliases
to `reduce` and `reduceRight`. The function call is translated into the
associated method call on the array, passing the function upon which the method
was called as the first argument and any other arguments supplied as successive
arguments.

	var sum = function (a,b){ return a+b; }    // <#Function:sum>
	sum.reduce([1,2,3,4],0)                    // 10

	var gtZero = function(_){ return _>0; }    // <#Function:gtZero>
	gtZero.every([5,6,7,8])                    // true


Array Instance Methods
----------------------

### Array::toFunction ⇒ function(*args)
Returns a function that returns the value of any property of the array upon
which `toFunction` was called. Most useful for accessing the numeric properties
of the array.

	var arr = ['a','b','c']         // ['a','b','c']
	var fn = arr.toFunction()       // <#Function:fn>
	fn(0)                           // 'a'
	fn(2)                           // 'c'
	fn(3)                           // undefined
	fn('length')                    // 3


Hash Instance Methods
---------------------

### Hash::toFunction ⇒ function(*args)
Returns a function that returns the value of any property of the hash upon
which `toFunction` was called.

	var obj = new Hash({a:0,b:1,c:2})   // {a:0,b:1,c:2}
	var fn = obj.toFunction()           // <#Function:fn>
	fn('a')                             // 0
	fn('c')                             // 2
	fn('z')                             // undefined
	fn('hasOwnProperty')                // <#Function:hasOwnProperty>


Object Class Methods
--------------------

### Object.toFunction (obj) ⇒ function(*args)
Returns a function that returns the value of any property of **obj**.

	var obj = {a:0,b:1,c:2},            // {a:0,b:1,c:2}
		fn = Object.toFunction(obj)     // <#Function:fn>
	fn('a')                             // 0
	fn('c')                             // 2
	fn('z')                             // undefined
	fn('hasOwnProperty')                // <#Function:hasOwnProperty>

	// Object.toFunction can make a function out of ANY object
	var node = document.createElement('div')         // <#HTMLDivElement:node>
	node.id = 'testID'
	node.style.color = '#EEE'
	var divFunc = Object.toFunction(node)            // <#Function:divFunc>
	var styleFunc = Object.toFunction(node.style)    // <#Function:styleFunc>
	divFunc('id')                                    // "testID"
	styleFunc('color')                               // "#EEE"


Globals
-------

### \_
The global \_ function is a short, global reference to Function.\_.


TODO
----

* document Function::overloadSetter and Function::overloadGetter
* document Function::extend and Function::implement
* document Function::bind

Known Issues
------------

* The underscore function is broken in chrome, caused by
arguments.callee.caller.arguments not returning the same object on separate
accesses. See [V8 Issue 222](http://code.google.com/p/v8/issues/detail?id=222).


Additional Info
---------------

I am always open for feature requests or any feedback.
I can be reached at [Github](http://github.com/michaelficarra).
