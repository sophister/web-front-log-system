/**
 * 每天执行一次,扫描 task_define 表中,满足条件的task,写入待执行队列
 * Created by jess on 16/3/15.
 */


'use strict';


let pg = require('pg');

const DB_CONFIG = require('./conf/db-conf.js');
const TASK_CONST = require('./conf/task-const.js');
let logManager = require('./common/log-manager.js');

//用法
const USAGE = 'Usage: platform=[mo|pc] log_date=YYYYMMDD node daily-task-scan.js';


//要计算日志所属的平台, mo,pc
let platform = process.env.platform;
//要执行的日期
let rawLogDate = process.env.log_date;
let logDate = parseInt( rawLogDate, 10 );

const PLATFORM_CONF = DB_CONFIG[platform];


if( ! /^\d{8}$/.test(rawLogDate) || isNaN(logDate) ){
    logManager.fatal(`[daily-task-scan] 参数格式非法!! log_date=[${rawLogDate}]  正确格式为 log_date=YYYYMMDD`);
    logManager.info( USAGE );
    process.exit(1);
}

if( ! platform || ! PLATFORM_CONF ){
    logManager.fatal(`[daily-task-scan] 参数格式非法!! platform=[${platform}]  正确格式为 platform=[mo|pc]`);
    logManager.info( USAGE );
    process.exit(1);
}


function fatalHandle(e){
    logManager.fatal(`执行 [ daily-task-scan ] 失败. ${e}`);
    process.exit(1);
}

try{

    pg.connect(PLATFORM_CONF.CONNECT_STRING, function(err, client, done){

        if( err ){
            return fatalHandle(err);
        }

        //从task定义库中筛选符合日期要求的
        client.query(`SELECT id, priority from ${TASK_CONST.TABLE_NAMES.TASK_DEFINE} WHERE start_date <= ${logDate}
        AND end_date >= ${logDate}`, function(err, result){
            if( err ){
                return fatalHandle(err);
            }

            let rows = result.rows;

            if( rows.length < 1 ){
                logManager.info(`[daily-task-scan] 在[${TASK_CONST.TABLE_NAMES.TASK_DEFINE}]中未找到匹配条件的task;
                筛选条件为 platform=${platform} log_date=${logDate}`);
                process.exit(0);
            }

            //取出筛选出的任务 id 数组,将 执行队列中,对应记录删除
            const taskIDArray = rows.map(function(obj){
                return obj.id;
            });

            client.query(`DELETE FROM ${TASK_CONST.TABLE_NAMES.TASK_EXECUTE}
            WHERE log_date = ${logDate}
            AND task_id IN (${taskIDArray.join(',')})`, function(err, result){
                if( err ){
                    return fatalHandle(err);
                }

                logManager.info(`[daily-task-scan] 删除已经存在相同日期的task结果: `);
                logManager.info(result);

                //删除成功之后,再把所有要执行的task,写入 执行队列, 使用 事务 操作
                client.query('BEGIN');
                rows.forEach(function( obj ){
                    const SQL = `INSERT INTO ${TASK_CONST.TABLE_NAMES.TASK_EXECUTE} (task_id, log_date, priority) VALUES ($1, $2, $3)`;
                    client.query( SQL, [ obj.id, logDate, obj.priority] );
                });

                client.query('COMMIT', function(err, result){

                    if( err ){
                        return fatalHandle(err);
                    }

                    logManager.info(`[daily-task-scan] 写入${logDate}对应的task结果:`);
                    logManager.info( result );

                    logManager.info(`\n\n [daily-task-scan] 成功完成对平台 [${platform}]下 [${logDate}] 日期的任务写入!\n\n`);

                    done();

                    process.exit(0);

                } );

            });

        } );

    } );

}catch(e){
    fatalHandle(e);
}