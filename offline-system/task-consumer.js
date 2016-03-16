/**
 * 负责从 任务队列 中,取出任务并执行
 * 本入口只处理传入的platform下的日志队列,如果需要同时处理多个platform,需要启动多个本入口进程
 * Created by jess on 16/3/15.
 */

'use strict';


const pg = require('pg');
const exec = require('child_process').exec;
const fork = require('child_process').fork;

const DB_CONFIG = require('./conf/db-conf.js');
const TASK_CONST = require('./conf/task-const.js');
let logManager = require('./common/log-manager.js');

//同时起 50 个子进程来执行具体任务
const RUN_CONCURRENCY = 50;
//用法
const USAGE = 'Usage: platform=[mo|pc] task_status=[0|2] node task-consumer.js';

//要计算日志所属的平台, mo,pc
const platform = process.env.platform;
const MATCH_STATUS = parseInt(process.env.task_status, 10);

const PLATFORM_CONF = DB_CONFIG[platform];

if( ! platform || ! PLATFORM_CONF ){
    logManager.fatal(`[task-consumer] 参数格式非法!! platform=[${platform}]  正确格式为 platform=[mo|pc]`);
    logManager.info( USAGE );
    process.exit(1);
}

if( MATCH_STATUS !== 0 && MATCH_STATUS !== 2 ){
    logManager.fatal(`[task-consumer] 参数格式非法!!  task_status=[${MATCH_STATUS}]  正确格式为 task_status=[0|2]`);
    logManager.info( USAGE );
    process.exit(1);
}

function errorHandle(e){
    logManager.error(e);
}


function fatalHandle(e){
    logManager.fatal(`执行 [ task-consumer ] 失败. ${e}`);
    process.exit(1);
}

const TASK_WAITING = TASK_CONST.EXECUTE_STATUS.WAITING;
const TASK_EXECUTING = TASK_CONST.EXECUTE_STATUS.EXECUTING;

const TASK_EXECUTE_TABLE = TASK_CONST.TABLE_NAMES.TASK_EXECUTE;


//是否待执行表中,还有满足条件的数据
let hasMoreInTable = true;
//本地任务启动中, 当前正在执行,或已经执行过的所有 task_id 集合
let handledArray = [];
//正在执行中的 任务个数
let executingTaskNum = 0;
//总的成功次数
let totalSuccessNum = 0;
//总的出错次数
let totalFailNum = 0;
//任务开始执行时间
const startTime = Date.now();

//延迟启动批量执行的计时器
let batchStartTimer = null;


process.on('uncaughtException', function(err){
    pg.end();
    fatalHandle(err);
} );


function finishCheck(){
    if( ! hasMoreInTable && executingTaskNum < 1 ){
        //没有执行中任务,并且task_execute表中没有满足条件的任务,结束
        let duration = Date.now() - startTime;
        duration = duration / 1000;
        logManager.info(`[task-consumer] 所有任务(status=[${MATCH_STATUS}])执行完成, 总共耗时: [${duration}]秒`);
        logManager.info(`成功执行任务个数:[${totalSuccessNum}]个; 失败的任务个数: [${totalFailNum}]个`);
        pg.end();
        process.exit(0);
    }
}

/**
 * 获取满足条件的num个任务,并发执行
 * @param client {Client} postgresql 数据库连接对象
 * @param num {int} 要并发执行的任务个数
 * @param status {int} 筛选任务的状态,默认 等待中
 */
function fetchTaskAndRun(client, num, status){

    try{
        num = num || RUN_CONCURRENCY;
        if( status === undefined ){
            status = TASK_WAITING;
        }
        const SELECT_SQL = `SELECT task_id, log_date from ${TASK_EXECUTE_TABLE}
                    WHERE status = ${status} ORDER BY priority DESC limit ${num}`;

        client.query( SELECT_SQL, function(err, result){
            if( err ){
                return errorHandle(err);
            }

            let rows = result.rows;

            if( rows.length < num ){
                //找不到匹配的任务记录
                hasMoreInTable = false;
            }

            rows.forEach( function(obj){
                runTask( obj);
            } );

            if( rows.length < 1 ){
                finishCheck();
            }

        } );


    }catch(e){
        errorHandle(e);
    }


}

/**
 * 运行一个指定的任务
 * @param obj {Row} task_execute 表中的一条记录对象
 * @param obj.task_id {int} 任务ID
 * @param obj.log_date {int} 执行任务的日期
 */
function runTask( obj){

    if( handledArray.indexOf(obj.task_id) >= 0 ){
        //obj.task_id 指定的任务正在执行中,或者已经执行过了,不再启动
        return;
    }

    handledArray.push( obj.task_id );

    let taskID = obj.task_id;
    let logDate = obj.log_date;

    let isFinish = false;

    try{

        executingTaskNum++;

        let child = fork('./calc-sys/task-loader.js', {
            env : {
                platform : platform,
                task_id : taskID,
                log_date : logDate
            }
        });

        child.on('exit', function(code, signal){
            if( isFinish ){
                return;
            }
            isFinish = true;

            code  = parseInt(code, 10);
            if( code === 0 ){
                totalSuccessNum++;
                //成功执行
                logManager.info(`[task-consumer] 执行任务 [task_id=${taskID}, log_date=${logDate}] 成功 :)`);
            }else{
                //执行失败
                totalFailNum++;
                logManager.error(`[task-consumer] 执行任务 [task_id=${taskID}, log_date=${logDate}] 时出错! exit code: [${code}], signal:[${signal}]`);
            }

            taskFinish();
        } );

        child.on('error', function(err){
            if( isFinish ){
                return;
            }
            isFinish = true;

            totalFailNum++;
            logManager.error(`[task-consumer] 执行任务 [task_id=${taskID}, log_date=${logDate}] 时出错!详细信息:`);
            logManager.error(err);

            taskFinish();

        } );

        child.unref();

    }catch(e){
        isFinish = true;
        taskFinish();
        errorHandle(e);
    }
}


function taskFinish(){
    executingTaskNum--;
    finishCheck();
    if( ! hasMoreInTable ){
        return;
    }
    clearTimeout( batchStartTimer );
    batchStartTimer = setTimeout( function(){
        pg.connect( PLATFORM_CONF.CONNECT_STRING, function(err, client, done){

            if( err ){
                return fatalHandle(err);
            }

            //一开始启动 N 个子进程同事处理N个任务
            fetchTaskAndRun(client, RUN_CONCURRENCY, MATCH_STATUS);

        } );

    }, 30000);
}

pg.connect( PLATFORM_CONF.CONNECT_STRING, function(err, client, done){

    if( err ){
        return fatalHandle(err);
    }

    //一开始启动 N 个子进程同事处理N个任务
    fetchTaskAndRun(client, RUN_CONCURRENCY, MATCH_STATUS);

} );