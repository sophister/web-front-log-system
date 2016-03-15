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

### Task 表

执行里每一个统计任务,都对应 `Task` 表的一条记录(`Record`),每一个`task`,都必须有 *起止日期* ,在起止日期内,系统会自动执行该任务.

每个 task , 实际执行的JS是保存在 系统的task目录下,数据库里,仅保存该JS的 `相对路径`. 具体执行该任务时,系统会 `require` 对应的JS文件
并执行.

每个 task, 都有一个标志优先级的 `priority` 字段,默认为 0, 数字越大, 优先级越高, 越会优先执行.

`task_define` 表字段详解:

* id: auto increment, PK
* page_id: text 该task对应的页面识别URL
* file_path: text NOT NULL 该task的实际执行文件路径
* start_date: integer 该task的开始执行日期,格式为 YYYYMMDD
* end_date: integer 该task默认结束日期,格式为 YYYYMMDD
* priority: smallint 优先级,默认 0


表名: task_define

创建表的SQL: 

```
CREATE TABLE task_define ( id serial UNIQUE, page_id text NOT NULL, file_path text NOT NULL, start_date integer NOT NULL, end_date integer NOT NULL, priority smallint DEFAULT 0 );
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



