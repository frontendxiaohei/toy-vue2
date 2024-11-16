import { compileToFunction } from "./compiler";
import { mountComponent } from "./lifecycle";
import { initState } from "./state";
import { isElement, isString } from "./utils";

export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options;

        // 状态初始化
        initState(vm);
        let el = options.el;

        if (el) {
            vm.$mount(el);
        }
    }

    Vue.prototype.$mount = function (el) {
        const vm = this;
        el = document.querySelector(el);
        let opts = vm.$options
        if (!opts.render) { 
            let template; 
            if (!opts.template && el) { 
                template = el.outerHTML
            } else {
                if (el) {
                    template = opts.template 
                }
            }
            if (template && el) {
                const render = compileToFunction(template);
                opts.render = render;
            }
        }
        // 挂载
        mountComponent(vm, el);
        
    }
}