
'use strict';

let BaseModel = require('./base-model.js');
let pg = require('pg');

let rawParser = global.rawParser;

let dbConfig = rawParser.dbConfig;
let logManager = rawParser.logManager;

const MO_CONNECT_STR = dbConfig.mo.CONNECT_STRING;
const PC_CONNECT_STR = dbConfig.pc.CONNECT_STRING;


function connectCallback(err){
    if( err ){
        logManager.error( err );
    }
}

/**
 * 获取model对象
 * @param data {Object}
 * @param data.platform {String} 日志所属平台，mo/pc
 * @param data.type {String} 日志类型，perf/click/error
 * @param data.logDate {int} 日志所属日期，20160308
 */
function getModel( data ){
    let db;
    switch( data.platform ){
        case 'mo':
            db = new pg.Client(MO_CONNECT_STR);
            break;
        case 'pc':
            db = new pg.Client(PC_CONNECT_STR);
            break;
        default:
            db = null;
    }
    if( ! db ){
        logManager.error(`不支持的platform[${data.platform}]`);
        return null;
    }
    
    db.connect( connectCallback );
    
    return new BaseModel({
        dbClient : db,
        platform : data.platform,
        type : data.type,
        logDate : data.logDate,
        table : ( data.type + '_raw')
    });
}


let singleton = {
    getModel : getModel
};

module.exports = singleton;