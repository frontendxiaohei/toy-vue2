# 写一个玩具vue2

1. 实现数据劫持
- 对象, Object.defineProperty, value为对象递归, 复制新对象,递归
- 数组 重写数组原型方法, 把新增的部分, 进行劫持, 数组的方法有 push, pop, shift, unshift, splice, sort, reverse
2. 实现模板编译
options有 el,render,template, 最终转换为一个render方法, 
模板编译就是把模板字符串, 变成render函数

3. 实现虚拟dom
简单版本,还有实现diff算法
 





