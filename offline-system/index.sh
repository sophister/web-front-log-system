#!/bin/sh


# crontab 执行时,找不到node
export PATH=$PATH:/opt/app/node-v5.3.0-linux-x64/bin

# 本脚本是整个离线系统每天的入口,每天凌晨执行一次
# 主要做下面几件事情:
#       1. 从线上机器下载前一天的日志压缩文件,解压到指定目录
#       2. 启动原始日志解析入库JS
#       3. 启动task扫描JS,将匹配日子的tas放入待执行的表中
#       4. 启动task执行控制器

#要处理的日志所属的日期
log_date=$1
#线上生成的日志文件名,用到的日期
log_file_date=$2


if [ -z ${log_date} ]
then
    log_date=`date -d last-day +%Y%m%d`
fi

if [ -z ${log_file_date} ]
then
    log_file_date=`date +%Y%m%d`
fi

#下载到的压缩的日志文件名
log_file_gz="we_s1_access.log-${log_file_date}.gz"
#解压之后,日志文件名
log_file_unzip="we_s1_access-${log_file_date}.log"
#系统所在根目录
base_dir=$(cd "$(dirname "$0")";pwd)
#从线上拷贝日志文件后,存放在本地的目录
gz_log_dir='raw-logs-gz'
gz_log_dir_path="${base_dir}/${gz_log_dir}"
#解压之后,日志文件存在路径
unzip_log_dir="${base_dir}/raw-logs-unzip"

#原始日志解析入库目录
raw_parser_dir="${base_dir}/raw-parser"
raw_parser_index=""

#日志解析计算目录
calc_sys_dir="${base_dir}/calc-sys"
calc_sys_index=""


#自定义进度输出函数,加上时间
function process_log(){
    time=`date`
    echo "${time} ${1}"
}

cd ${base_dir}

#检查原始日志文件目录是否存在,不存在则创建
if [ ! -d ${gz_log_dir} ]
then
    mkdir ${gz_log_dir}
fi

if [ ! -d ${unzip_log_dir} ]
then
    mkdir ${unzip_log_dir}
fi


#如果对应日期的日志压缩文件不存在,则从线上下载
if [ ! -f "${gz_log_dir_path}/${log_file_gz}" ]
then
    process_log "原始日志的压缩文件不存在,开始从线上下载原始日志的压缩文件:"
    #下载日志文件
    cd ${gz_log_dir_path}
    wget "http://analysis.we.com/nginx/${log_file_gz}"

    if [ $? -ne 0 ]
    then
        process_log "从线上下载日志文件出错: http://analysis.we.com/nginx/${log_file_gz}"
        exit 1
    fi

fi

cd ${gz_log_dir_path}

gunzip -c ${log_file_gz} > ${log_file_unzip}

if [ $? -ne 0 ]
then
    process_log "解压日志文件${log_file_gz}出错"
    exit 1
fi

#如果解压之后的目录已经存在同名文件,先删除
if [ -f "${unzip_log_dir}/${log_file_unzip}" ]
then
    process_log "${unzip_log_dir}/${log_file_unzip} 已经存在,先删除旧的文件"
    rm "${unzip_log_dir}/${log_file_unzip}"
    if [ $? -ne 0 ]
    then
        process_log "删除旧的 ${unzip_log_dir}/${log_file_unzip} 出错,退出!!"
        exit 1
    fi
fi

#把解压之后的日志文件,拷贝到解压后的目录
mv ${log_file_unzip} ${unzip_log_dir}

#切换到 原始日志解析目录,执行解析程序
cd ${raw_parser_dir}
log_file_path=${unzip_log_dir}/${log_file_unzip} log_date=${log_date} node raw-parser-index.js

if [ $? -ne 0 ]
then
    process_log "执行原始日志解析出错,中止!!! log_file_path=${unzip_log_dir}/${log_file_unzip} log_date=${log_date} node raw-parser-index.js"
    exit 1
fi

#原始日志入库之后,切换到 日志解析目录,执行解析任务
process_log "开始扫描task表, 筛选要执行的task队列"
cd ${base_dir}
platform=mo log_date=${log_date} node daily-task-scan.js

if [ $? -eq 0 ]
then
    process_log "扫描需要执行的任务队列完成 "
else
    process_log "执行  任务队列筛选  出错!!"
    exit 1
fi

# 要执行的任务队列准备完成, 启动任务队列执行入口
process_log "开始执行 task_execute 中 status=0 的任务:"
cd ${base_dir}
platform=mo task_status=0 node task-consumer.js

if [ $? -eq 0 ]
then
    process_log " 执行  task_execute 中的任务队列 成功 :) "
else
    process_log "执行  task_execute 中的任务队列  出错!!"
    exit 1
fi

