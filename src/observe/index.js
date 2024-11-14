import { isObject } from "../utils";
import { newArrayProto } from "./array";

class Observer {
    constructor(value) {
        // 这也太巧妙了吧
        // 给数据加了一个标识，如果数据上有__ob__则说明被观测过
        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false,
        })

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
        arr.forEach(item => observe(item))
    }
}

export function defineReactive(obj, key, value) {
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
    })
}


export function observe(data) {
    if (!isObject(data)) return;
    if (data.__ob__ instanceof Observer) return data.__ob__;
    return new Observer(data);
}