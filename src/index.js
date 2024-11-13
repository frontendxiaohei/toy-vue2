import { initMixin } from "./init";

function TVue(options){ 
    this._init(options); 
}

// 把_init挂到TVue原型链上
initMixin(TVue); 

export default TVue