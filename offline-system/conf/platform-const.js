/**
 * 不同平台的类型常量
 * Created by jess on 16/3/11.
 */


'use strict';

let PLATFORM_TYPE = {};



//定义 移动端
Object.defineProperty(PLATFORM_TYPE, 'MOBILE', {
    value : 'mo',
    writable : false
});

//定义 PC
Object.defineProperty(PLATFORM_TYPE, 'PC', {
    value : 'pc',
    writable : false
});



module.exports = PLATFORM_TYPE;