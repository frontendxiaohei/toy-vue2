(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TVue = factory());
})(this, (function () { 'use strict';

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
    const startTagOpen = new RegExp(`^<${qnameCapture}`);
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    const startTagClose = /^\s*(\/?)>/;

    /**
     * 把模板转换为AST树
     * @param {*} html 
     * @returns 
     */
    function parseHTML(html) {
      const ELEMENT_TYPE = 1;
      const TEXT_TYPE = 3;
      const stack = [];
      let currentParent;
      let root;

      // 生成AST节点
      function createASTElement(tag, attrs) {
        return {
          tag,
          type: ELEMENT_TYPE,
          children: [],
          attrs,
          parent: null
        };
      }

      // 开始标签
      function start(tag, attrs) {
        let node = createASTElement(tag, attrs);
        if (!root) {
          root = node;
        }
        if (currentParent) {
          node.parent = currentParent;
          currentParent.children.push(node);
        }
        stack.push(node);
        currentParent = node;
      }
      // 文本
      function chars(text) {
        text = text.replace(/\s/g, ' ');
        text && currentParent.children.push({
          type: TEXT_TYPE,
          text,
          parent: currentParent
        });
      }
      // 结束标签
      function end(tag) {
        stack.pop();
        currentParent = stack[stack.length - 1];
      }
      // 截取html
      function advance(n) {
        html = html.substring(n);
      }
      // 解析开始标签
      function parseStartTag() {
        const start = html.match(startTagOpen);
        if (start) {
          const match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length);
          let attr, end;
          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            advance(attr[0].length);
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5] || true
            });
          }
          if (end) {
            advance(end[0].length);
          }
          return match;
        }
        return false;
      }
      while (html) {
        let textEnd = html.indexOf('<');
        if (textEnd == 0) {
          const startTagMatch = parseStartTag();
          if (startTagMatch) {
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          }
          let endTagMatch = html.match(endTag);
          if (endTagMatch) {
            advance(endTagMatch[0].length);
            end(endTagMatch[1]);
            continue;
          }
        }
        if (textEnd > 0) {
          let text = html.substring(0, textEnd);
          if (text) {
            chars(text);
            advance(text.length);
          }
        }
      }
      return root;
    }

    /**
     * 
     * _c 创建元素
     * _v 创建文本 
     * _s 拼接文本
     * 
     */

    // 生成属性字符串
    function genProps(attrs) {
      let str = '';
      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];
        if (attr.name === 'style') {
          let obj = {};
          attr.value.split(';').forEach(item => {
            let [key, value] = item.split(':');
            obj[key] = value;
          });
          attr.value = obj;
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`;
      }
      return `{${str.slice(0, -1)}}`;
    }

    // 小胡子正则
    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

    // 生成代码
    function gen(node) {
      if (node.type === 1) {
        return codegen(node);
      } else {
        let text = node.text;
        if (!defaultTagRE.test(text)) {
          return `_v(${JSON.stringify(text)})`;
        } else {
          let tokens = [];
          let match;
          defaultTagRE.lastIndex = 0;
          let lastIndex = 0;
          while (match = defaultTagRE.exec(text)) {
            let index = match.index;
            if (index > lastIndex) {
              tokens.push(JSON.stringify(text.slice(lastIndex, index)));
            }
            tokens.push(`_s(${match[1].trim()})`);
            lastIndex = index + match[0].length;
          }
          if (lastIndex < text.length) {
            tokens.push(JSON.stringify(text.slice(lastIndex)));
          }
          return `_v(${tokens.join('+')})`;
        }
      }
    }
    function genChildren(children) {
      return children.map(child => gen(child)).join(',');
    }
    function codegen(ast) {
      let children = genChildren(ast.children);
      let code = `_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'}${ast.children.length ? `,${children}` : ''})`;
      return code;
    }
    function compileToFunction(template) {
      let ast = parseHTML(template);
      let code = codegen(ast);
      code = `with(this){return ${code}}`;
      let render = new Function(code);
      return render;
    }

    // 虚拟dom
    function createElementVNode(vm, tag, data, ...children) {
      if (data == null) {
        data = {};
      }
      let key = data.key;
      if (key) {
        delete data.key;
      }
      return vnode(vm, tag, key, data, children);
    }

    // 文本节点
    function createTextVNode(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    // 虚拟节点
    function vnode(vm, tag, key, data, children, text) {
      return {
        vm,
        tag,
        key,
        data,
        children,
        text
        // ....
      };
    }

    // 虚拟节点转成真实DOM
    function createElm(vnode) {
      let {
        tag,
        data,
        children,
        text
      } = vnode;
      if (typeof tag === 'string') {
        vnode.el = document.createElement(tag);
        patchProps(vnode.el, data);
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }
      return vnode.el;
    }

    // 给元素设置属性
    function patchProps(el, props) {
      for (let key in props) {
        if (key === 'style') {
          for (let styleName in props.style) {
            el.style[styleName] = props.style[styleName];
          }
        } else {
          el.setAttribute(key, props[key]);
        }
      }
    }

    // 新旧节点的对比
    function patch(oldVNode, vnode) {
      const isRealElement = oldVNode.nodeType;
      if (isRealElement) {
        const elm = oldVNode;
        const parentElm = elm.parentNode;
        let newElm = createElm(vnode);
        parentElm.insertBefore(newElm, elm.nextSibling);
        parentElm.removeChild(elm);
        return newElm;
      }
    }

    // 生命周期
    function initLifeCycle(Vue) {
      // 初始化生命周期钩子函数
      Vue.prototype._update = function (vnode) {
        const vm = this;
        const el = vm.$el;
        vm.$el = patch(el, vnode);
      };
      Vue.prototype._c = function () {
        return createElementVNode(this, ...arguments);
      };
      Vue.prototype._v = function () {
        return createTextVNode(this, ...arguments);
      };
      Vue.prototype._s = function (value) {
        if (typeof value !== 'object') return value;
        return JSON.stringify(value);
      };
      Vue.prototype._render = function () {
        return this.$options.render.call(this);
      };
    }
    function mountComponent(vm, el) {
      vm.$el = el;
      vm._update(vm._render());
    }

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
      // key 对应 的 value 可能是对象
      observe(value);
      Object.defineProperty(obj, key, {
        get() {
          return value;
        },
        set(newValue) {
          if (newValue === value) return;
          // 如果用户设置的是一个对象，应该将其进行劫持
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

        // 状态初始化
        initState(vm);
        let el = options.el;
        if (el) {
          vm.$mount(el);
        }
      };
      Vue.prototype.$mount = function (el) {
        const vm = this;
        el = document.querySelector(el);
        let opts = vm.$options;
        if (!opts.render) {
          let template;
          if (!opts.template && el) {
            template = el.outerHTML;
          } else {
            if (el) {
              template = opts.template;
            }
          }
          if (template && el) {
            const render = compileToFunction(template);
            opts.render = render;
          }
        }
        // 挂载
        mountComponent(vm, el);
      };
    }

    function TVue(options) {
      this._init(options);
    }

    // 把_init挂到TVue原型链上
    initMixin(TVue);
    initLifeCycle(TVue);

    return TVue;

}));
//# sourceMappingURL=toy-vue.js.map
