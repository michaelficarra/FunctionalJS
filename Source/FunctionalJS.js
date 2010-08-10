var __hasProp = Object.prototype.hasOwnProperty;
/*
---
description: Extensions that allow a more functional programming style
license: LGPL
authors: ['Michael Ficarra']
requires: []
provides: [
	FunctionalJS, Function._, Function.empty, Function.identity,
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
...
*/
(function(global, undefined) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, bools, constant, fn, n, opName, toFunction;
  if (!(typeof global !== "undefined" && global !== null)) {
    global = {};
  }
  Function.TRACE_ALL = (Function.TRACE_NONE = 0);
  _a = ['TRACE_ARGUMENTS', 'TRACE_CONTEXT', 'TRACE_RETURN', 'TRACE_TIME', 'TRACE_STACK'];
  for (n = 0, _b = _a.length; n < _b; n++) {
    constant = _a[n];
    Function.TRACE_ALL |= Function[constant] = 1 << n;
  }
  !((typeof (_c = Function.prototype.overloadSetter) !== "undefined" && _c !== null)) ? (Function.prototype.overloadSetter = function(forceObject) {
    var self;
    self = this;
    return function(a, b) {
      var _d, _e, k;
      if (!(typeof a !== "undefined" && a !== null)) {
        return this;
      }
      if (forceObject || typeof a !== 'string') {
        _e = a;
        for (k in _e) {
          if (!__hasProp.call(_e, k)) continue;
          _d = _e[k];
          self.call(this, k, a[k]);
        }
      } else {
        self.call(this, a, b);
      }
      return this;
    };
  }) : null;
  !((typeof (_d = Function.prototype.overloadGetter) !== "undefined" && _d !== null)) ? (Function.prototype.overloadGetter = function(forceObject) {
    var self;
    self = this;
    return function(prop) {
      var _e, _f, arg, args, result;
      if (forceObject || typeof prop !== 'string') {
        args = prop;
      } else if (arguments.length > 1) {
        args = arguments;
      }
      if (!(args)) {
        return self.call(this, prop);
      }
      result = {};
      _f = args;
      for (arg in _f) {
        if (!__hasProp.call(_f, arg)) continue;
        _e = _f[arg];
        result[arg] = self.call(this, arg);
      }
      return result;
    };
  }) : null;
  !((typeof (_e = Function.prototype.extend) !== "undefined" && _e !== null)) ? (Function.prototype.extend = (function(name, method) {
    var _f;
    if (!((typeof (_f = this[name]) !== "undefined" && _f !== null))) {
      return (this[name] = method);
    }
  }).overloadSetter()) : null;
  !((typeof (_f = Function.prototype.implement) !== "undefined" && _f !== null)) ? (Function.prototype.implement = (function(name, method) {
    var _g;
    if (!((typeof (_g = this.prototype[name]) !== "undefined" && _g !== null))) {
      this.prototype[name] = method;
      return this.constructor.extend(name, function(context) {
        return method.apply(context, Array.prototype.slice.call(arguments, 1));
      });
    }
  }).overloadSetter()) : null;
  Function.extend({
    _: function(_) {
      var _g, args, caller;
      caller = arguments.callee.caller || arguments.caller;
      if (!(typeof caller !== "undefined" && caller !== null)) {
        return null;
      }
      args = caller.arguments;
      if (!(typeof _ !== "undefined" && _ !== null)) {
        args._ = ((typeof (_g = args._) !== "undefined" && _g !== null) ? args._ += 1 : 0);
      }
      return args[(typeof _ !== "undefined" && _ !== null) ? _ : args._];
    },
    empty: function() {},
    identity: function(_) {
      return arguments.length > 1 ? Array.prototype.slice.call(arguments) : _;
    },
    context: function() {
      return this;
    },
    lambda: function(_) {
      return function() {
        return _;
      };
    },
    pluck: function(property) {
      return function(obj) {
        return obj[property];
      };
    },
    invoke: function(method) {
      var defaultArgs;
      defaultArgs = Array.prototype.slice.call(arguments, 1);
      return function(obj) {
        var args;
        args = Array.prototype.slice.call(arguments, 1);
        return obj[method].apply(obj, (args.length ? args : defaultArgs));
      };
    },
    sequence: function() {
      var _g, functions;
      if ((_g = arguments.length) === 0) {
        return Function.empty;
      } else if (_g === 1) {
        return arguments[0];
      } else {
        functions = arguments;
        return (function(idx) {
          return function() {
            idx %= functions.length;
            return functions[idx++].apply(this, arguments);
          };
        }).call(this, 0);
      }
    },
    concatenate: function() {
      var functions;
      functions = arguments;
      return function() {
        var _g, _h, _i, fn, result;
        _h = functions;
        for (_g = 0, _i = _h.length; _g < _i; _g++) {
          fn = _h[_g];
          result = fn.apply(this, arguments);
        }
        return result;
      };
    },
    compose: function() {
      var functions;
      functions = Array.prototype.slice.call(arguments);
      return function() {
        var _g, _h, fn, i, lastReturn;
        lastReturn = arguments;
        _g = functions.reverse();
        for (i = 0, _h = _g.length; i < _h; i++) {
          fn = _g[i];
          lastReturn = fn[i ? 'call' : 'apply'](this, lastReturn);
        }
        return lastReturn;
      };
    },
    overload: function(funcTable) {
      var _g, _h, _i, fn, newTable;
      if (!arguments.length || funcTable instanceof Function) {
        newTable = {};
        _h = arguments;
        for (_g = 0, _i = _h.length; _g < _i; _g++) {
          fn = _h[_g];
          newTable[fn.getArity()] = fn;
        }
        funcTable = newTable;
      }
      return function() {
        fn = funcTable[arguments.length];
        if (!((typeof fn !== "undefined" && fn !== null) && fn instanceof Function)) {
          return undefined;
        }
        return fn.apply(this, arguments);
      };
    }
  });
  Function.extend('concat', Function.concatenate);
  bools = {
    xor: function(a, b) {
      return !!(!a ^ !b);
    },
    and: function(a, b) {
      return !!(a && b);
    },
    or: function(a, b) {
      return !!(a || b);
    }
  };
  _h = bools;
  for (_g in _h) {
    if (!__hasProp.call(_h, _g)) continue;
    (function() {
      var opName = _g;
      var op = _h[_g];
      return Function.extend(opName, function() {
        var _i, fn, functions;
        if ((_i = arguments.length) === 0) {
          return Function.empty;
        } else if (_i === 1) {
          fn = arguments[0];
          return function() {
            return !!fn.apply(this, arguments);
          };
        } else {
          functions = Array.prototype.slice.call(arguments);
          return (function(op) {
            return function() {
              var recurse;
              recurse = function(functions, args) {
                var first;
                if (functions.length === 1) {
                  return !!functions[0].apply(this, args);
                } else {
                  first = functions[0].apply(this, args);
                  if ((op === bools.and && !first) || (op === bools.or && first)) {
                    return !!first;
                  }
                  return op(first, recurse.call(this, functions.slice(1), args));
                }
              };
              return recurse.call(this, functions, arguments);
            };
          })(op);
        }
      });
    })();
  }
  Function.implement({
    toFunction: function() {
      return this;
    },
    bind: function(scope) {
      var self;
      self = this.curry(Array.prototype.slice.call(arguments, 1));
      return function() {
        return self.apply(scope, arguments);
      };
    },
    wrap: function(fn, bind) {
      var self, wrapper;
      self = this;
      wrapper = function() {
        var args;
        args = Array.prototype.slice.call(arguments);
        return fn.call(this, ((typeof bind !== "undefined" && bind !== null) ? self.bind(bind) : self), args);
      };
      wrapper._origin = this;
      return wrapper;
    },
    getOrigin: function() {
      var origin;
      origin = this;
      while (origin._origin) {
        origin = origin._origin;
      }
      return origin;
    },
    memoize: (function() {
      var arrayCoerce, equalityCheck, every, indexOf, typeOf;
      typeOf = global.typeOf || function(_) {
        var _i, _j, _k, _l;
        if (_ === undefined) {
          return 'undefined';
        }
        if (_ === null) {
          return 'null';
        }
        if ((_i = _.constructor) === Array) {
          return 'array';
        } else if (_i === RegExp) {
          return 'regexp';
        } else if (_i === Object) {
          return 'object';
        }
        if (!(typeof (_l = _.nodeName) !== "undefined" && _l !== null) && typeof _.length === 'number') {
          if ((typeof (_j = _.callee) !== "undefined" && _j !== null)) {
            return 'arguments';
          }
          if ((typeof (_k = _.item) !== "undefined" && _k !== null)) {
            return 'collection';
          }
        }
        return typeof item;
      };
      arrayCoerce = Array.from || function(_) {
        if (!(typeof _ !== "undefined" && _ !== null)) {
          return [];
        }
        return (typeof _ !== "undefined" && _ !== null) && typeof _.length === 'number' && _.constructor !== Function && typeof _ !== 'string' ? typeOf(_) === 'array' ? _ : Array.prototype.slice.call(_) : [_];
      };
      every = Array.every || function(iterable, fn) {
        var _i, _j, el, i;
        _i = iterable;
        for (i = 0, _j = _i.length; i < _j; i++) {
          el = _i[i];
          if (!(fn.call(this, el, i, iterable))) {
            return false;
          }
        }
        return true;
      };
      equalityCheck = function(a, b) {
        var type;
        type = typeOf(a);
        if (!(type === typeOf(b))) {
          return false;
        }
        if (type === 'object') {
          return a === b;
        } else if (type === 'regexp') {
          return a.toString() === b.toString();
        } else if (type === 'array' || type === 'collection' || type === 'arguments') {
          return a.length === b.length && every(a, function(a_i, i) {
            return equalityCheck(a_i, b[i]);
          });
        } else {
          try { a = a.valueOf() } catch(e) {};
          try { b = b.valueOf() } catch(e) {};
          return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
        }
      };
      indexOf = function(iterable, key) {
        var _i, _j, _k, _l, el, i;
        _i = iterable;
        for (i = 0, _j = _i.length; i < _j; i++) {
          el = _i[i];
          if ((!(typeof (_k = el.args) !== "undefined" && _k !== null) || equalityCheck(el.args, key.args)) && (!(typeof (_l = el.context) !== "undefined" && _l !== null) || equalityCheck(el.context, key.context))) {
            return i;
          }
        }
        return -1;
      };
      return function(userMemos) {
        var _i, _j, _k, keys, memo, memos, userKey;
        keys = [];
        memos = {};
        userMemos = arrayCoerce(userMemos);
        _j = userMemos;
        for (_i = 0, _k = _j.length; _i < _k; _i++) {
          memo = _j[_i];
          if (!(typeof memo !== "undefined" && memo !== null)) {
            continue;
          }
          userKey = {
            context: memo.context,
            args: arrayCoerce(memo.args)
          };
          memos[keys.push(userKey) - 1] = memo.returnValue;
        }
        return this.wrap(function(original, args) {
          var idx, key;
          key = {
            context: this,
            args: args
          };
          idx = indexOf(keys, key);
          if (idx > -1) {
            return memos[idx];
          }
          return (memos[keys.push(key) - 1] = original.apply(this, args));
        });
      };
    })(),
    traced: (function() {
      var _i, _j, _k, _l, _m, _n, _o, console, error, group, groupEnd, hasConsole, log, time, timeEnd, trace;
      console = global.console;
      hasConsole = (typeof console !== "undefined" && console !== null);
      log = hasConsole && (typeof (_i = console.log) !== "undefined" && _i !== null) ? console.log.bind(console) : Function.empty;
      error = hasConsole && (typeof (_j = console.error) !== "undefined" && _j !== null) ? console.error.bind(console) : Function.empty;
      group = hasConsole && (typeof (_k = console.group) !== "undefined" && _k !== null) ? console.group.bind(console) : log;
      groupEnd = hasConsole && (typeof (_l = console.groupEnd) !== "undefined" && _l !== null) ? console.groupEnd.bind(console) : Function.empty;
      time = hasConsole && (typeof (_m = console.time) !== "undefined" && _m !== null) ? console.time.bind(console) : Function.empty;
      timeEnd = hasConsole && (typeof (_n = console.timeEnd) !== "undefined" && _n !== null) ? console.timeEnd.bind(console) : Function.empty;
      trace = hasConsole && (typeof (_o = console.trace) !== "undefined" && _o !== null) ? console.trace.bind(console) : Function.empty;
      return function(name, opts) {
        opts = (typeof opts !== "undefined" && opts !== null) ? opts : Function.TRACE_ARGUMENTS | Function.TRACE_RETURN;
        name = (typeof name !== "undefined" && name !== null) ? name : this.getOrigin().toString().match(/^function\s*([^\s\(]*)\(/)[1];
        name === "" ? (name = undefined) : null;
        (typeof name !== "undefined" && name !== null) ? (name = name.toString ? name.toString() : null) : Object.prototype.toString.call(name);
        return this.wrap(function(fn, args) {
          var exception, ret, title;
          title = 'Called ' + ((typeof name !== "undefined" && name !== null) ? '"' + name.replace(/"/g, '\\"') + '"' : 'anonymous function');
          opts === Function.TRACE_NONE ? log(title + ' (', fn, ')') : null;
          if (!(opts === Function.TRACE_NONE)) {
            group(title + ' (', fn, ')');
            opts & Function.TRACE_ARGUMENTS ? log(' Arguments: ', args) : null;
            opts & Function.TRACE_CONTEXT ? log(' Context: ', this) : null;
            opts & Function.TRACE_TIME ? time(fn) : null;
            group('Console Output');
          }
          try {
            ret = fn.apply(this, args);
          } catch (e) {
            exception = e;
          }
          if (!(opts === Function.TRACE_NONE)) {
            groupEnd();
            opts & Function.TRACE_TIME ? timeEnd(fn) : null;
            opts & Function.TRACE_RETURN ? ((typeof exception !== "undefined" && exception !== null) ? error(exception) : log(' Return value: ', ret)) : null;
            opts & Function.TRACE_STACK ? trace() : null;
            groupEnd();
          }
          if (exception) {
            throw exception;
          }
          return ret;
        });
      };
    })(),
    partial: function() {
      var partialArgs;
      partialArgs = Array.prototype.slice.call(arguments);
      return this.wrap(function(original, passedArgs) {
        var _i, _j, _k, arg, collectedArgs;
        collectedArgs = [];
        _j = partialArgs;
        for (_i = 0, _k = _j.length; _i < _k; _i++) {
          arg = _j[_i];
          collectedArgs.push((!(typeof arg !== "undefined" && arg !== null) || arg === Function._ ? passedArgs.shift() : arg));
        }
        return original.apply(this, collectedArgs.concat(passedArgs));
      });
    },
    curry: function() {
      var curriedArgs;
      curriedArgs = Array.prototype.slice.call(arguments);
      return this.wrap(function(original, passedArgs) {
        return original.apply(this, curriedArgs.concat(passedArgs));
      });
    },
    rcurry: function() {
      var curriedArgs;
      curriedArgs = Array.prototype.slice.call(arguments);
      return this.wrap(function(original, passedArgs) {
        return original.apply(this, passedArgs.concat(curriedArgs));
      });
    },
    not: function() {
      if (arguments.length) {
        return this.not().apply(this, arguments);
      }
      return this.wrap(function(fn, args) {
        return !fn.apply(this, args);
      });
    },
    prepend: function() {
      var functions;
      functions = arguments;
      return this.wrap(function(self, args) {
        var _i, _j, _k, fn;
        _j = functions;
        for (_i = 0, _k = _j.length; _i < _k; _i++) {
          fn = _j[_i];
          fn.apply(this, args);
        }
        return self.apply(this, args);
      });
    },
    append: function() {
      var functions;
      functions = arguments;
      return this.wrap(function(self, args) {
        var _i, _j, _k, fn, ret;
        ret = self.apply(this, args);
        _j = functions;
        for (_i = 0, _k = _j.length; _i < _k; _i++) {
          fn = _j[_i];
          fn.apply(this, args);
        }
        return ret;
      });
    },
    overload: function(funcTable) {
      var others;
      if (!arguments.length || funcTable instanceof Function) {
        others = Array.prototype.slice.call(arguments);
        return Function.overload.apply(null, others.concat(this));
      } else {
        funcTable[this.getArity()] = this;
        return Function.overload(funcTable);
      }
    },
    saturate: function() {
      var args;
      args = arguments;
      return this.wrap(function(fn) {
        return fn.apply(this, args);
      });
    },
    aritize: function(arity) {
      return this.wrap(function(fn, args) {
        return fn.apply(this, args.slice(0, arity));
      });
    },
    getArity: function() {
      return this.arity || this.length || this.getArgs().length;
    }
  });
  Function.implement({
    getArgs: (function() {
      var args, fn;
      fn = this.getOrigin();
      args = fn.toString().match(/^function\s*[^\s\(]*\((.*?)\)/)[1].split(/\s*,\s*/);
      return args.filter(function(_) {
        return _ !== "";
      });
    }).memoize()
  });
  _j = ['forEach', 'each', 'every', 'some', 'filter', 'map', 'reduce', 'reduceRight', 'sort'];
  for (_i = 0, _k = _j.length; _i < _k; _i++) {
    var fnStr = _j[_i];
    if (!((typeof (_l = Array.prototype[fnStr]) !== "undefined" && _l !== null))) {
      continue;
    }
    fn = (function(fnStr) {
      return function() {
        var args, arr;
        args = Array.prototype.slice.call(arguments);
        arr = args.shift();
        return arr[fnStr].apply(arr, [this].concat(args));
      };
    })(fnStr);
    fn._origin = Array.prototype[fnStr];
    Function.implement(fnStr, fn);
  }
  Function.implement({
    foldl: Function.prototype.reduce,
    foldr: Function.prototype.reduceRight
  });
  toFunction = function() {
    var self;
    self = this;
    return function(index) {
      return self[index];
    };
  };
  Array.implement('toFunction', toFunction);
  (typeof Hash !== "undefined" && Hash !== null) ? Hash.implement('toFunction', toFunction) : null;
  Object.extend('toFunction', function(obj) {
    return toFunction.call(obj);
  });
  if (!((typeof (_m = global._) !== "undefined" && _m !== null))) {
    global._ = Function._;
  }
  return global;
})(this);
/*
Copyright 2010 Michael Ficarra
This program is distributed under the (very open)
terms of the GNU Lesser General Public License
*/
