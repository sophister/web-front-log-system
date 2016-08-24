/**
 * 性能分析任务的基础类,绝大多数的 性能统计 task,都可以简单的从这里实现
 * Created by jess on 16/3/11.
 */


'use strict';


//超过2分钟的值,认为是无用的,可以抛弃掉
const MAX_LIMIT = 60000 * 2;

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

            let headStart = logData.jhead_start;
            let bodyStart = logData.jbody_start;
            let fullLoad = logData.jfull_load;
            //实际日志中,发现有些缺少了 jbody_end 数据
            let domReady = logData.jdom_ready || fullLoad;
            let bodyEnd = logData.jbody_end || domReady;


            let jHeadTime = bodyStart - headStart;
            let jBodyTime = bodyEnd - bodyStart;
            let jDomReadyTime = domReady - headStart;
            let jFullLoadTime = fullLoad - headStart;

            if( isNaN(jHeadTime) || isNaN(jBodyTime) || isNaN(jDomReadyTime) || isNaN(jFullLoadTime) ){
                logManager.warn(`性能统计时间有误!${JSON.stringify(line)}`);
                return;
            }

            if( jFullLoadTime >= MAX_LIMIT ){
                logManager.warn(`性能时间段超出最大值[${MAX_LIMIT}ms], 当做噪声点, 不参加平均值的计算`);
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