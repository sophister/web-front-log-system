/**
 * 移动端的性能数据收集
 */

'use strict';

let logManager = rawParser.logManager;

const PLATFORM = 'pc';
const TYPE = 'perf';

let modelFactory;
let model;

let singleton = {
    
    init : function( factory, data ){
        modelFactory = factory;
        model = modelFactory.getModel({
            platform : PLATFORM,
            type : TYPE,
            logDate : data.logDate
        });
    },
    
    /**
     * 判断当前的日志对象是否符合条件，符合条件的，添加进model里
     * @param lineObj {Object} 一行日志处理后的JSON
     * @return {boolean} true 符合条件，已保存；false 不属于本类，不处理
     */
    add : function( lineObj ){
        let rawData = lineObj[TYPE];
        if( lineObj.platform === PLATFORM && rawData ){
            //尝试读取 perf 数据，能解析为JSON格式的，就入库
            try{
                JSON.parse( rawData );
                model.add({
                    page_id : lineObj.page_id,
                    log_data : rawData
                });
                return true;
            }catch(e){
                logManager.warn(`解析性能的perf数据失败: ${e.message}`);
                //非JSON数据，不保存
                return false;
            }
        }
        return false;
    },
    
    commit : function(){
        return model.commit();
    },
    
    end : function(){
        model.end();
    }
};

module.exports = singleton;