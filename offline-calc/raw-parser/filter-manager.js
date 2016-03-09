/**
 * 负责对原始日志解析出来的结果，根据条件过滤
 */


'use strict';


let singleton = {
    
    /**
     * 判断传入的 lineObj ，是否合法
     * @param lineObj {Object}
     * @return {boolean}
     */
    isValid : function( lineObj ){
        //TODO 后端增加，根据 本地IP、内网IP等过滤限制
        return true;
    }
    
};


module.exports = singleton;