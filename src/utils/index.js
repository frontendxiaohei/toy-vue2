export function isObject(val) {
    return val!== null && typeof val === 'object';
}

export function isFunction(val) {
    return typeof val === 'function';
}