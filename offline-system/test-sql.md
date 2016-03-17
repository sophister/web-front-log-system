# 开发使用的一些SQL

## 注入task_define 表, 创建task

```
INSERT INTO task_define (page_id, name, file_path, type, start_date, end_date) values ('/n/test/ui/carousel', 'carousel page performance', 'mo/perf/mo-perf-task-2.js', 'perf', 20160101, 20160501);

INSERT INTO task_define (page_id, name, file_path, type, start_date, end_date) values ('/n/mo/lp/wecaishuo', 'wecaishuo page performance', 'mo/perf/mo-perf-task.js', 'perf', 20160101, 20160501);

INSERT INTO task_define (page_id, name, file_path, type, start_date, end_date) values ('/n/test/ui/carouselPrimary', 'carousel-base page performance', 'mo/perf/mo-perf-task-3.js', 'perf', 20160101, 20160501);
```

