/**
 * 设置全局变量
 * Created by jess on 16/3/11.
 */


'use strict';

const LOG_TYPE = require('../conf/type-const.js');
const PLATFORM_TYPE = require('../conf/platform-const.js');
const DB_CONFIG = require('../conf/db-conf.js');
const TASK_CONST = require('../conf/task-const.js');
let logManager = require('../common/log-manager.js');

const taskGenerator = require('./task-generator.js');


let singleton = {
    PLATFORM_TYPE : PLATFORM_TYPE,
    LOG_TYPE : LOG_TYPE,
    DB_CONFIG : DB_CONFIG,
    TASK_CONST : TASK_CONST,
    logManager:logManager
};

//平台类型
Object.defineProperty(global, 'PLATFORM_TYPE', {
    value : PLATFORM_TYPE,
    writable : false
});

//日志类型
Object.defineProperty(global, 'LOG_TYPE', {
    value : LOG_TYPE,
    writable : false
});


Object.defineProperty(global, 'logManager', {
    value : logManager,
    writable : false
});

Object.defineProperty(global, 'taskGenerator', {
    value : taskGenerator,
    writable : false
});

module.exports = singleton;
