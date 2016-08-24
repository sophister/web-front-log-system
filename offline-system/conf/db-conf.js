
'use strict';

module.exports = {
    mo : {
        CONNECT_STRING : 'postgres://wefe:wefe123456@localhost/mo',
        //原始日志解析之后保存的table,名字为 type + '_raw'
        RAW_TABLE_SUFFIX : '_raw',
        //日志分析计算的结果,保存的table,名为 type + '_result'
        RESULT_TABLE_SUFFIX : '_result'
    },
    pc : {
        CONNECT_STRING : 'postgres://wefe:wefe123456@localhost/pc',
        //原始日志解析之后保存的table,名字为 type + '_raw'
        RAW_TABLE_SUFFIX : '_raw',
        //日志分析计算的结果,保存的table,名为 type + '_result'
        RESULT_TABLE_SUFFIX : '_result'
    }
};