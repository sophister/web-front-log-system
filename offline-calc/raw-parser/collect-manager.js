/**
 * 维护所有的不同平台不同类型的 model 数组
 */

'use strict';

let fs = require('fs');
let path = require('path');
let modelFactory = require('./model/model-factory.js');
let logManager = require('./log-manager.js');


const COLLECTOR_DIR = './collectors';
let collectorArray = [];
let logDate;


let singleton = {
    
    /**
     * 初始化
     * @param data {Object}
     * @param logDate {int} 正在处理日志对应的日期，如 20160308
     */
    init : function( data ){
        logDate = data.logDate;
        
        //遍历collectors目录，加载该目录下所有的collector
        let files = fs.readdirSync( COLLECTOR_DIR );
        for( let i = 0, len = files.length; i < len; i++ ){
            let filePath = path.resolve( COLLECTOR_DIR, files[i] );
            
            let stat = fs.statSync(filePath);
            if( ! stat.isFile() ){
                continue;
            }
            let ext = path.extname(filePath);
        
           
            if( ext === '.js'){
                
                let collector = require(filePath);
                
                collector.init( modelFactory,  { logDate : logDate });
                collectorArray.push( collector );
            }
        }
        
     
    },
    
    /**
     * 将解析为JSON的一行日志数据，交给各个collector判断入库
     * @param lineOjb {Object} 一行日志解析之后的JSON
     * @return {boolean} true 日志成功入库；false 日志没有找到符合条件的collector，未入库
     */
    collect : function( lineObj ){
        let isSaved = false;
        for( let i = 0, len = collectorArray.length; i < len; i++ ){
            let collector = collectorArray[i];
            let out = collector.add( lineObj );
            if( ! isSaved ){
                isSaved = out;
            }
        }
        return isSaved;
    },
    
    save : function(){
        return Promise.all( collectorArray.map( function(collector){
            return collector.commit();
        } ) );
    },
    
    //关闭与数据库的连接
    end : function(){
        collectorArray.map( function( collector ){
            collector.end();
        } );
    }
    
};


module.exports = singleton;