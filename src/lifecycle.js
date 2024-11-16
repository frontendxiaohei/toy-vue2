import { createElementVNode, createTextVNode } from "./vdom"


// 虚拟节点转成真实DOM
function createElm(vnode){
    let {tag,data,children,text} = vnode;
    if(typeof tag === 'string'){ 
        vnode.el =  document.createElement(tag); 
        patchProps(vnode.el,data);
        children.forEach(child => {
            vnode.el.appendChild( createElm(child))
        });
    }else{
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

// 给元素设置属性
function patchProps(el,props){
    for(let key in props){
        if(key === 'style'){ 
            for(let styleName in props.style){
                el.style[styleName] = props.style[styleName];
            }
        }else{
            el.setAttribute(key,props[key]);
        }
    }
}

// 新旧节点的对比
function patch(oldVNode,vnode){
    const isRealElement = oldVNode.nodeType;
    if(isRealElement){
        const elm = oldVNode; 
        const parentElm = elm.parentNode; 
        let newElm =  createElm(vnode);
        parentElm.insertBefore(newElm,elm.nextSibling);
        parentElm.removeChild(elm); 

        return newElm
    }else{
        
    }
}


// 生命周期
export function initLifeCycle(Vue){
    // 初始化生命周期钩子函数
    Vue.prototype._update = function(vnode){ 
        const vm = this;
        const el = vm.$el;
        vm.$el = patch(el,vnode);
    }

  
    Vue.prototype._c = function(){
       return  createElementVNode(this,...arguments)
    }
 
    Vue.prototype._v = function(){
        return createTextVNode(this,...arguments)
    }
    Vue.prototype._s = function(value){
        if(typeof value !== 'object') return value
        return JSON.stringify(value)
    }
    Vue.prototype._render = function(){
       
        
        return this.$options.render.call(this); 
    }
}

export function mountComponent(vm,el){ 
    vm.$el = el;
    vm._update(vm._render()); 
}

