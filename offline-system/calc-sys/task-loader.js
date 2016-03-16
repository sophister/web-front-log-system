/**
 * 加载指定的任务JS并执行
 * 根据传入的 log_date task_id 执行对应的任务
 * Created by jess on 16/3/11.
 */


'use strict';

let path = require('path');
let fs = require('fs');
let pg = require('pg');


let calcSystemGlobal = require('./globals.js');

const DB_CONFIG = calcSystemGlobal.DB_CONFIG;
const TASK_DIR = './task-collection';

let logManager = calcSystemGlobal.logManager;
const TASK_CONST = calcSystemGlobal.TASK_CONST;

//用法
const USAGE = 'Usage: platform=[mo|pc] task_id=xxx log_date=YYYYMMDD node task-loader.js';

const platform = process.env.platform;
const LOG_DATE = parseInt(process.env.log_date, 10);
let taskID = parseInt( process.env.task_id, 10);

//任务开始执行时间
const TASK_START_TIME = Date.now();

if( ! platform || ! DB_CONFIG[platform] ){
    logManager.error(`[task-loader] 任务 [ ${taskID} ] 运行的平台 [ ${platform} ] 不能为空!!`);
    logManager.info(USAGE);
    process.exit(0);
}

if( ! LOG_DATE ){
    logManager.error(`[task-loader] 任务 [ ${taskID} ] 运行的日期 [ ${LOG_DATE} ] 不能为空!!`);
    logManager.info(USAGE);
    process.exit(0);
}

if( ! taskID ){
    logManager.error(`[task-loader] 任务 [ ${taskID} ] 不能为空!!`);
    logManager.info(USAGE);
    process.exit(0);
}


function errorHandle(e){
    logManager.error(`[task-loader] 执行任务 [ ${taskID} ] 失败. ${e}`);
    process.exit(0);
}

function fatalHandle(e){
    logManager.fatal(`[task-loader] 执行任务 [ ${taskID} ] 失败. ${e}`);
    pg.end();
    process.exit(0);
}

function taskEnd(){
    let taskDuration = Date.now() - TASK_START_TIME;
    taskDuration = taskDuration / 1000;
    logManager.info(`[task-loader] 任务 [ ${taskID} ] 在日期 [ ${LOG_DATE} ] 执行完成,耗时: ${taskDuration} 秒 `);
}

//TODO 根据 taskID ,从 task_define 表中,获取 task对应的JS路径
const TASK_DEFINE_TABLE = TASK_CONST.TABLE_NAMES.TASK_DEFINE;
const TASK_EXECUTE_TABLE = TASK_CONST.TABLE_NAMES.TASK_EXECUTE;

const TASK_WAITING = TASK_CONST.EXECUTE_STATUS.WAITING;
const TASK_EXECUTING = TASK_CONST.EXECUTE_STATUS.EXECUTING;
const TASK_FAIL = TASK_CONST.EXECUTE_STATUS.FAIL;
const TASK_SUCCESS = TASK_CONST.EXECUTE_STATUS.SUCCESS;

const dbConnectString = DB_CONFIG[platform].CONNECT_STRING;


//从 task_define 表,读取当前task_id 对应的 file_path ,找到要执行的JS
try{
    pg.connect(dbConnectString, function(err, client, done){
        if( err ){
            return fatalHandle(err);
        }

        const SQL = `SELECT file_path FROM ${TASK_DEFINE_TABLE} WHERE id = ${taskID}`;
        client.query( SQL, function(err, result){
            if( err ){
                return fatalHandle(err);
            }

            let obj = result.rows[0];

            if( ! obj || ! obj.file_path ){
                //未找到匹配的 task_id
                logManager.warn(`[task-loader] 在[${TASK_DEFINE_TABLE}]表中未找到id=[${taskID}]的任务`);
                process.exit(0);
            }

            const RAW_FILE_PATH = obj.file_path;


            //要加载的 任务JS 路径
            const TASK_FILE_PATH =  `${TASK_DIR}${path.sep}${RAW_FILE_PATH}`;

            let taskConfig;

            try{
                taskConfig = require( TASK_FILE_PATH );
            }catch(e){
                logManager.error(`[task-loader] 加载任务 [ ${taskID} ] 失败. ${e}`);
                process.exit(0);
            }

            let filter = taskConfig.filter;

            const type = filter.type;

            if(  LOG_TYPE.ALL_TYPES.indexOf(type) < 0 ){
                logManager.error(`执行任务 [ ${taskID} ] 失败. 找不到对应的 type [ ${type} ] `);
                process.exit(0);
            }

            tryStartTask( function(){
                runTask( taskConfig );
            } );

        } );

    });

}catch(e){
    fatalHandle(e);
}


/**
 * 尝试将 task_execute 表中对应的 status 从 等待中(或 失败) 更新为 执行中, 如果成功,则继续执行任务; 失败,结束任务
 * @param successCallback {function} 成功的回调
 */
function tryStartTask(successCallback){
    try{
        pg.connect(dbConnectString, function(err, client, done){
            if( err ){
                return fatalHandle(err);
            }

            const SQL = `UPDATE ${TASK_EXECUTE_TABLE} set status = ${TASK_EXECUTING}
                        WHERE task_id = ${taskID} AND log_date = ${LOG_DATE} AND status in (${TASK_WAITING}, ${TASK_FAIL})`;
            client.query( SQL, function(err, result){
                if( err ){
                    return fatalHandle(err);
                }

                done();

                if( result.rowCount === 1 ){
                    //更新成功,继续执行任务
                    logManager.info(`[task-loader] 在表[${TASK_EXECUTE_TABLE}]中更新id=[${taskID}]状态为 [1] 成功`);
                    successCallback();
                    return;
                }

                //更新失败,不执行任务
                logManager.warn(`[task-loader] 尝试在表[${TASK_EXECUTE_TABLE}]中更新id=[${taskID}]状态为 [1] 失败,结束执行该任务!`);
                process.exit(0);

            } );

        });

    }catch(e){
        fatalHandle(e);
    }
}


/**
 * 执行对应的 任务配置JS
 * @param taskConfig {Object}
 * @param taskConfig.filter {Object} 该任务对原始日志的筛选配置
 */
function runTask(taskConfig){

    try{
        let filter = taskConfig.filter;
        const type = filter.type;
        const pageID = filter.page_id;

        //连接数据库
        pg.connect( dbConnectString, function(err, client, done){
            if( err ){
                return errorHandle(err);
            }
            const tableName = `${type}${DB_CONFIG[platform].RAW_TABLE_SUFFIX}`;
            let sql = `SELECT * FROM ${tableName} WHERE log_date=${LOG_DATE}`;
            if( pageID ){
                sql += ` AND page_id='${pageID}'`;
            }
            sql += ';';

            let query = client.query( sql );

            query.on('row', function(row, result){
                taskConfig.handleLine( row );
            } );

            query.on('end', function(){


                let calcResult = taskConfig.getResult();

                //console.log( calcResult );

                //保存结果到DB
                const resultTable = `${type}${DB_CONFIG[platform].RESULT_TABLE_SUFFIX}`;

                //启动事务
                client.query('BEGIN');

                //先检查该 page_id 所对应的 log_date 的数据是否已经存在
                const deleteOldSQL = `DELETE from ${resultTable}
                                    WHERE task_id='${taskID}' AND log_date=${LOG_DATE}`;
                client.query( deleteOldSQL);

                //向计算结果表写入数据
                const saveSQL = `INSERT INTO ${resultTable} (task_id, log_date, log_data) VALUES ($1, $2, $3)`;
                client.query( saveSQL, [ taskID, LOG_DATE, JSON.stringify(calcResult) ] );

                //更新 task_execute 执行表的状态
                const taskSuccessStatusSQL = `UPDATE ${TASK_EXECUTE_TABLE} set status = ${TASK_SUCCESS} where task_id = ${taskID}; `;
                client.query( taskSuccessStatusSQL );

                //提交
                client.query('COMMIT', function(err, result){
                    if( err ){
                        setTaskFail( function(){
                            fatalHandle(err)
                        } );
                        return ;
                    }

                    done();

                    logManager.log( result );

                    taskEnd();

                    process.exit(0);

                } );

            } );

            query.on('error', function(err){
                logManager.error(`[task-loader] 执行 platform=[${platform}] task_id=[${taskID}] log_date=[${LOG_DATE}] 出错:`);
                logManager.error(err);
                setTaskFail( function(){
                    process.exit(1);
                } );

            } );

        } );

    }catch(e){
        errorHandle(e);
    }


}

/**
 * 修改任务执行状态为  失败
 * @param callback {Function} 执行完之后的回调
 */
function setTaskFail(callback){
    try{
        pg.connect(dbConnectString, function(err, client, done){
            if( err ){
                return fatalHandle(err);
            }

            const SQL = `UPDATE ${TASK_EXECUTE_TABLE} set status = ${TASK_FAIL}
                        WHERE task_id = ${taskID} AND log_date = ${LOG_DATE} AND status = ${TASK_EXECUTING}`;
            client.query( SQL, function(err, result){
                if( err ){
                    return fatalHandle(err);
                }

                done();

                if( result.rowCount === 1 ){
                    //更新成功,继续执行任务
                    logManager.info(`[task-loader] 在表[${TASK_EXECUTE_TABLE}]中更新id=[${taskID}]状态为 [${TASK_FAIL}] 成功`);
                    callback();
                    return;
                }

                //更新失败,不执行任务
                logManager.warn(`[task-loader] 尝试在表[${TASK_EXECUTE_TABLE}]中更新id=[${taskID}]状态为 [${TASK_FAIL}] 失败,结束执行该任务!`);
                process.exit(0);

            } );

        });

    }catch(e){
        fatalHandle(e);
    }
}