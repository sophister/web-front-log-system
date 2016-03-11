/**
 * 不同类型的日志,对应的常量
 * Created by jess on 16/3/11.
 */


'use strict';


let LOG_TYPE = {};



//定义 性能日志 对应的type常量
Object.defineProperty(LOG_TYPE, 'PERFORMANCE', {
    value : 'perf',
    writable : false
});


LOG_TYPE.ALL_TYPES = [ LOG_TYPE.PERFORMANCE ];

module.exports = LOG_TYPE;