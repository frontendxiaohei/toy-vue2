import { observe } from "./observe";
import { isFunction } from "./utils";

export function initState(vm) {
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
    })
}

function initData(vm) {
    let data = vm.$options.data;
    data = vm._data = isFunction(data) ? data.call(vm) : data;

    observe(data)

    for (let key in data) {
        proxy(vm, '_data', key);
    }
}