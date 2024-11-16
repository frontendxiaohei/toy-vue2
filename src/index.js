import { initMixin } from "./init";
import { initLifeCycle } from "./lifecycle";

function TVue(options){ 
    this._init(options); 
}

// 把_init挂到TVue原型链上
initMixin(TVue); 
initLifeCycle(TVue);

export default TVue