export function isObject(val) {
    return val!== null && typeof val === 'object';
}

export function isFunction(val) {
    return typeof val === 'function';
}

export function isElement(ele) {
    return ele.nodeType === 1;
}

export function isString(ele) {
    return typeof ele === 'string';
}