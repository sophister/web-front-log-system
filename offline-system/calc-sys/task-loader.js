/**
 * 加载指定的任务JS并执行
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


const LOG_DATE = parseInt(process.env.log_date, 10);
let taskID = process.env.task_id;

//任务开始执行时间
const TASK_START_TIME = Date.now();

if( ! LOG_DATE ){
    logManager.error(`任务 [ ${taskID} ] 运行的日期 [ ${LOG_DATE} ] 不能为空!!`);
    process.exit(0);
}

if( ! taskID ){
    logManager.error(`任务 [ ${taskID} ] 不能为空!!`);
    process.exit(0);
}

if( taskID.indexOf('..') >= 0 ){
    //不能包含 ..
    logManager.error(`任务 [ ${taskID} ] 格式非法,不能包含 .. 字符!!`);
    process.exit(0);
}

//要加载的 任务JS 路径
const TASK_FILE_PATH =  `${TASK_DIR}${path.sep}${taskID}`;

let taskConfig;

try{
    taskConfig = require( TASK_FILE_PATH );
}catch(e){
    logManager.error(`加载任务 [ ${taskID} ] 失败. ${e}`);
    process.exit(0);
}


function errorHandle(e){
    logManager.error(`执行任务 [ ${taskID} ] 失败. ${e}`);
    process.exit(0);
}

function fatalHandle(e){
    logManager.fatal(`执行任务 [ ${taskID} ] 失败. ${e}`);
    process.exit(0);
}

function taskEnd(){
    let taskDuration = Date.now() - TASK_START_TIME;
    taskDuration = taskDuration / 1000;
    logManager.info(`任务 [ ${taskID} ] 在日期 [ ${LOG_DATE} ] 执行完成,耗时: ${taskDuration} 秒 `);
}

try{
    let filter = taskConfig.filter;
    const platform = filter.platform;
    const type = filter.type;
    const pageID = filter.page_id;

    let dbConnectString;
    if( DB_CONFIG[platform] ){
        dbConnectString = DB_CONFIG[platform].CONNECT_STRING;
    }

    if( ! dbConnectString ){
        logManager.error(`执行任务 [ ${taskID} ] 失败. 找不到对应的 platform [ ${platform} ] `);
        process.exit(0);
    }

    if(  LOG_TYPE.ALL_TYPES.indexOf(type) < 0 ){
        logManager.error(`执行任务 [ ${taskID} ] 失败. 找不到对应的 type [ ${type} ] `);
        process.exit(0);
    }

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

            //先检查该 page_id 所对应的 log_date 的数据是否已经存在
            const deleteOldSQL = `DELETE from ${resultTable}
                                    WHERE page_id='${pageID}' AND log_date=${LOG_DATE}`;

            client.query( deleteOldSQL, function(err, result){
                if( err ){
                    return errorHandle(err);
                }

                //现在可以插入新的计算数据了
                const saveSQL = `INSERT INTO ${resultTable} (page_id, log_date, log_data) VALUES ($1, $2, $3)`;
                client.query( saveSQL, [ pageID, LOG_DATE, JSON.stringify(calcResult) ], function(err, result){
                    if( err ){
                        return errorHandle(err);
                    }
                    console.log( result );

                    taskEnd();

                    done();

                    process.exit(0);
                } );

            } );


        } );

        query.on('error', function(err){
            fatalHandle(err);
        } );

    } );

}catch(e){
    errorHandle(e);
}


