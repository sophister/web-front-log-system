/**
 * 全局对象
 */


'use strict';

let dbConfig = require('../conf/db-conf.js');
let logManager = require('./log-manager.js');

let rawParser = {
    dbConfig : dbConfig,
    logManager : logManager
};


global.rawParser = rawParser;

module.exports = rawParser;