(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TVue = factory());
})(this, (function () { 'use strict';

    function isObject(val) {
      return val !== null && typeof val === 'object';
    }
    function isFunction(val) {
      return typeof val === 'function';
    }

    let oldArrayProto = Array.prototype;
    let newArrayProto = Object.create(oldArrayProto);
    let methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(method => {
      newArrayProto[method] = function (...args) {
        const result = oldArrayProto[method].call(this, ...args);
        let inserted;
        let ob = this.__ob__;
        switch (method) {
          case 'push':
          case 'unshift':
            inserted = args;
            break;
          case 'splice':
            inserted = args.slice(2);
            break;
        }
        if (inserted) ob.observeArray(inserted);
        // ob.dep.notify();
        return result;
      };
    });

    class Observer {
      constructor(value) {
        // 这也太巧妙了吧
        // 给数据加了一个标识，如果数据上有__ob__则说明被观测过
        Object.defineProperty(value, '__ob__', {
          value: this,
          enumerable: false
        });
        if (Array.isArray(value)) {
          value.__proto__ = newArrayProto;
          this.observeArray(value);
        } else {
          this.walk(value);
        }
      }
      walk(obj) {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
          defineReactive(obj, keys[i], obj[keys[i]]);
        }
      }
      observeArray(arr) {
        arr.forEach(item => observe(item));
      }
    }
    function defineReactive(obj, key, value) {
      observe(value);
      Object.defineProperty(obj, key, {
        get() {
          return value;
        },
        set(newValue) {
          if (newValue === value) return;
          observe(newValue);
          value = newValue;
        }
      });
    }
    function observe(data) {
      if (!isObject(data)) return;
      if (data.__ob__ instanceof Observer) return data.__ob__;
      return new Observer(data);
    }

    function initState(vm) {
      const opts = vm.$options;
      // if (opts.props) {
      //     initProps(vm, opts.props);
      // }
      // if (opts.methods) {
      //     initMethods(vm, opts.methods);
      // }
      if (opts.data) {
        initData(vm);
      }
      // if (opts.computed) {
      //     initComputed(vm, opts.computed);
      // }
    }
    function proxy(vm, target, key) {
      Object.defineProperty(vm, key, {
        get() {
          return vm[target][key];
        },
        set(newValue) {
          vm[target][key] = newValue;
        }
      });
    }
    function initData(vm) {
      let data = vm.$options.data;
      data = vm._data = isFunction(data) ? data.call(vm) : data;
      observe(data);
      for (let key in data) {
        proxy(vm, '_data', key);
      }
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options;
        initState(vm);
      };
    }

    function TVue(options) {
      this._init(options);
    }

    // 把_init挂到TVue原型链上
    initMixin(TVue);

    return TVue;

}));
//# sourceMappingURL=toy-vue.js.map
