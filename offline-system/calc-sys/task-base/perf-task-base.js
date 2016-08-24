/**
 * 性能分析任务的基础类,绝大多数的 性能统计 task,都可以简单的从这里实现
 * Created by jess on 16/3/11.
 */


'use strict';


function createPerformanceTask( conf ){


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
            //platform : PLATFORM_TYPE.MOBILE,
            //type : LOG_TYPE.PERFORMANCE,
            //page_id : '/n/test/layout/layout'
        },

        handleLine : function( line ){
            let logData = line.log_data;


            let jHeadTime = logData.jbody_start - logData.jhead_start;
            let jBodyTime = logData.jbody_end - logData.jbody_start;
            let jDomReadyTime = logData.jdom_ready - logData.jhead_start;
            let jFullLoadTime = logData.jfull_load - logData.jhead_start;

            if( isNaN(jHeadTime) || isNaN(jBodyTime) || isNaN(jDomReadyTime) || isNaN(jFullLoadTime) ){
                logManager.warn(`性能统计时间有误!${JSON.stringify(line)}`);
                return;
            }

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

    for( let i in conf ){
        if( conf.hasOwnProperty(i) ){
            task[i] = conf[i];
        }
    }

    return task;
}


module.exports = createPerformanceTask;