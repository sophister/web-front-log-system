/**
 * 从数据库读取移动端的性能统计日志,计算结果并保存
 * Created by jess on 16/3/11.
 */

'use strict';


//<head> finish 时间
let resultHeadFinish = {
    average : 0,
    max : 0,
    min : 0,
    total : 0,
    count : 0
};

let resultBodyFinish = {
    average : 0,
    max : 0,
    min : 0,
    total : 0,
    count : 0
};

let resultDomReady = {
    average : 0,
    max : 0,
    min : 0,
    total : 0,
    count : 0
};

let resultFullLoad = {
    average : 0,
    max : 0,
    min : 0,
    total : 0,
    count : 0
};


let isFirstLine = true;

let task = {

    filter : {
        platform : PLATFORM_TYPE.MOBILE,
        type : LOG_TYPE.PERFORMANCE,
        page_id : '/n/test/layout/layout'
    },

    handleLine : function( line ){
        let logData = line.log_data;


        let jHeadTime = logData.jbody_start - logData.jhead_start;
        let jBodyTime = logData.jbody_end - logData.jbody_start;
        let jDomReadyTime = logData.jdom_ready - logData.jhead_start;
        let jFullLoadTime = logData.jfull_load - logData.jhead_start;

        if( ! isFirstLine ){
            //非第一次收到数据
            resultHeadFinish.total += jHeadTime;
            resultHeadFinish.max = Math.max( resultHeadFinish.max, jHeadTime );
            resultHeadFinish.min = Math.min( resultHeadFinish.min, jHeadTime);
            resultHeadFinish.count++;
            
            resultBodyFinish.total += jBodyTime;
            resultBodyFinish.max = Math.max( resultBodyFinish.max, jBodyTime);
            resultBodyFinish.min = Math.min( resultBodyFinish.min, jBodyTime);
            resultBodyFinish.count++;

            resultDomReady.total += jDomReadyTime;
            resultDomReady.max = Math.max( resultDomReady.max, jDomReadyTime);
            resultDomReady.min = Math.min( resultDomReady.min, jDomReadyTime);
            resultDomReady.count++;

            resultFullLoad.total += jFullLoadTime;
            resultFullLoad.max = Math.max( resultFullLoad.max, jFullLoadTime);
            resultFullLoad.min = Math.min( resultFullLoad.min, jFullLoadTime);
            resultFullLoad.count++;
        }else{
            //第一次数据
            isFirstLine = false;
            resultHeadFinish.total = jHeadTime;
            resultHeadFinish.max = resultHeadFinish.min = jHeadTime;
            resultHeadFinish.count++;

            resultBodyFinish.total = resultBodyFinish.max = resultBodyFinish.min = jBodyTime;
            resultBodyFinish.count++;

            resultDomReady.total = resultDomReady.max = resultDomReady.min = jDomReadyTime;
            resultDomReady.count++;

            resultFullLoad.total = resultFullLoad.max = resultFullLoad.min = jFullLoadTime;
            resultFullLoad.count++;
        }
        
    },

    getResult : function(){
        resultHeadFinish.average = resultHeadFinish.total / resultHeadFinish.count;
        resultBodyFinish.average = resultBodyFinish.total / resultBodyFinish.count;
        resultDomReady.average = resultDomReady.total / resultDomReady.count;
        resultFullLoad.average = resultFullLoad.total / resultFullLoad.count;

        return {
            j_head : resultHeadFinish,
            j_body : resultBodyFinish,
            j_dom_ready : resultDomReady,
            j_full_load : resultFullLoad
        };
    }

};


module.exports = task;