/**
 * Task 相关的常量
 * Created by jess on 16/3/15.
 */


'use strict';

//任务执行各个阶段的状态
const TASK_EXECUTE_STATUS = {
    //任务在等待被执行
    WAITING : 0,
    //任务执行中
    EXECUTING : 1,
    //任务执行失败
    FAIL : 2,
    //任务执行成功
    SUCCESS : 3
};

//任务存储的表
const TASK_TABLE_NAMES = {
    //所有任务定义表
    TASK_DEFINE : 'task_define',
    //任务执行表
    TASK_EXECUTE : 'task_execute'
};


module.exports = {
    EXECUTE_STATUS : TASK_EXECUTE_STATUS,
    TABLE_NAMES : TASK_TABLE_NAMES
};