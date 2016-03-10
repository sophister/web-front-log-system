
'use strict';

let _ = require('lodash');
let util = require('util');

/**
 * 
 * @param args {Object}
 * @param args.dbClient {} 数据库连接对象
 */
function BaseModel(args){
    //平台， mo/pc
    this._platform = args.platform;
    //perf/click/error
    this._type = args.type;
    //日志对应的日期，比如 20160308
    this._logDate = parseInt(args.logDate, 10 );
    //要存储的表名
    this._table = args.table || ( args.type + '_raw');
    this._dbClient = args.dbClient;
    
    this._hasBegin = false;
}

_.extend( BaseModel.prototype, {
    
    begin : function(){
        if( ! this._hasBegin ){
            this._dbClient.query('BEGIN');
            this._hasBegin = true;
        }
        return this;
    },
    
    /**
     * 添加一个日志条目数据
     * @param data {Object}
     * @param data.page_id {String} 页面ID标记
     * @param data.log_data {String} 原始统计数据
     */
    add : function( data ){
        
        this.begin();
        
        const SQL = `INSERT INTO ${this._table} (page_id, log_date, log_data) VALUES ($1, $2, $3)`;
        this._dbClient.query( SQL, [ data.page_id, this._logDate, data.log_data] );
        
        return this;
    },
    
    /**
     * 提交所有的日志条目
     * @return {Promise}
     */
    commit : function(){
        if( ! this._hasBegin ){
            return Promise.resolve();
        }
        let that = this;
        return new Promise(function(resolve, reject){
            that._dbClient.query('COMMIT', function(err, result){
                if( err ){
                    return reject( err );
                }
                resolve( result );
            } );
        });
    },
    
    end : function(){
        this._dbClient.end();
    }
    
} );

module.exports = BaseModel;