# web-front-log-system
网站web前端日志收集、分析系统

## 目录结构

```
├── client(部署在线上web页面，收集发送统计到server)

├── log-dashboard(最终计算结果的呈现系统)

└── offline-system(离线的计算相关)
```

## 系统架构图


### 线上部署JS


### 离线日志分析计算系统


### 数据结果展示系统


## 数据库表结构

数据库使用 `PostgreSQL 9.5`

数据库设计, 根据不同的 `platform` 划分 `database`, 即 *移动端* 的原始日志/任务定义/任务结果都保存在 数据库 `mo` 下;
 *PC* 端的原始日志/任务定义/任务结果 都保存在数据库 `pc` 下.
 
以下的表结构, 都是以 *移动端* 
 

### 原始日志存放表, `xxx_raw` 

表名, 以 日志类型 + _raw 作为, 比如 性能 表: perf_raw; 点击日志表: click_raw.

下面以 `perf_raw` 为例:

* id: serial auto increment, PK
* page_id: text NOT NULL 日志对应的页面URL
* log_date: integer 计算结果对应的日期,格式为 YYYYMMDD
* log_data: json 原始的日志的有效内容,格式为 JSON

表名: `perf_raw`

创建表的SQL:

```
CREATE TABLE perf_raw (id serial, page_id text NOT NULL, log_date integer NOT NULL, log_data json NOT NULL); 
```


### Task 表

执行里每一个统计任务,都对应 `Task` 表的一条记录(`Record`),每一个`task`,都必须有 *起止日期* ,在起止日期内,系统会自动执行该任务.

每个 task , 实际执行的JS是保存在 系统的task目录下,数据库里,仅保存该JS的 `相对路径`. 具体执行该任务时,系统会 `require` 对应的JS文件
并执行.

每个 task, 都有一个标志优先级的 `priority` 字段,默认为 0, 数字越大, 优先级越高, 越会优先执行.

`task_define` 表字段详解:

* id: auto increment, PK
* name: text UNIQUE 该task的名字,方便用户查看,惟一
* type: text 该task要统计的数据类型, 只能是  perf/click/error
* page_id: text 该task对应的页面识别URL
* file_path: text NOT NULL 该task的实际执行文件路径
* start_date: integer 该task的开始执行日期,格式为 YYYYMMDD
* end_date: integer 该task默认结束日期,格式为 YYYYMMDD
* priority: smallint 优先级,默认 0


表名: task_define

创建表的SQL: 

```
CREATE TABLE task_define ( id serial UNIQUE, name text UNIQUE NOT NULL, type text NOT NULL, page_id text NOT NULL, file_path text NOT NULL, start_date integer NOT NULL, end_date integer NOT NULL, priority smallint DEFAULT 0 );
```


### Task 执行结果表

系统会每天定时扫描上述的 `task_define` 表,将符合运行条件的任务,写入 `task_execute` 表,等待排队执行.

`task_execute` 表字段详解:

* id: auto increment
* task_id: integer Foreign Key
* log_date: integer 该task执行的日期,格式为 YYYYMMDD
* priority: smallint 优先级,默认 0
* status: 该任务执行状态, 只能是如下值之一:
    0: 等待中,任务未开始执行
    1: 正在执行中
    2: 任务执行成功
    3: 任务执行失败


表名: task_execute

创建表的SQL: 

```
CREATE TABLE task_execute ( id serial, task_id integer REFERENCES task_define (id), log_date integer NOT NULL, priority smallint DEFAULT 0 , status smallint DEFAULT 0, CONSTRAINT task_run_date PRIMARY KEY(task_id, log_date) );
```

### 任务统计输出结果表 xxx_result

每种不同 `type` 的任务, 产出的统计结果,保存到对应的 `${type}_result` 表里. 比如 *性能* 统计结果,保存到 `perf_result` 表中;
 *点击* 统计结果,保存到 `click_result` 表中 .
 
 以 `perf_result` 表结果为例, 字段详解:
 
* id: serial auto increment
* task_id: integer Foreign Key -> task_define(id)
* log_date: integer 计算结果对应的日期,格式为 YYYYMMDD
* log_data: json 计算的结果,格式为 JSON
 
主键(Primary Key): (task_id, log_date) 
 
创建表的SQL:
 
```
CREATE TABLE perf_result ( id serial, task_id integer REFERENCES task_define (id), log_date integer NOT NULL, log_data json, CONSTRAINT task_result_date PRIMARY KEY(task_id, log_date) );
```



## 相关文档

* [PostgreSQL 9.5](http://www.postgresql.org/docs/9.5/interactive/index.html)
