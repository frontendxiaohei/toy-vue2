import { initState } from "./state";
import { isElement, isString } from "./utils";

export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options;

        // 状态初始化
        initState(vm);

        if ($options.el) {
            vm.$mount(vm.$options.el);
        }
    }

    Vue.prototype.$mount = function (el) {
        const vm = this;
        const options = vm.$options;
        if (isString(el)) {
            el = document.querySelector(el);
        } else if (isElement(el)) {
            el = el;
        } else {
            throw new Error('el 必须是一个字符串或者一个元素');
        }
        vm.$el = el;

        // 有render 就用render 没有就用template
        if (!options.render) {
            // 渲染
        } else {
            // 模板编译
        }
    }
}