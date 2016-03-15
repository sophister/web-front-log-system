
# 每天定时执行 `crontab` 命令的日志目录

`crontab` 中设置类似:

```
0 3 * * * cd /home/frontend/fe-log-system/web-front-log-system/offline-system && sh index.sh > ./crontab-log/`date +\%Y\%m\%d`.log 2>& 1
```