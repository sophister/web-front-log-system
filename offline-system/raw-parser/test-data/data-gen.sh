#!/bin/sh


#用来生成测试用的 日志文件 

line='180.97.180.99 - - [08/Mar/2016:18:49:41 +0800] "GET /s1/w.gif?pl=mo&pid=%2Fn%2Ftest%2Flayout%2Flayout&perf=%7B%22jhead_start%22%3A1457434204591%2C%22jbody_start%22%3A1457434204604%2C%22jbody_end%22%3A1457434204782%2C%22jdom_ready%22%3A1457434204784%2C%22jfull_load%22%3A1457434204787%2C%22navigationStart%22%3A1457434204538%2C%22unloadEventStart%22%3A1457434204564%2C%22unloadEventEnd%22%3A1457434204564%2C%22redirectStart%22%3A0%2C%22redirectEnd%22%3A0%2C%22fetchStart%22%3A1457434204539%2C%22domainLookupStart%22%3A1457434204539%2C%22domainLookupEnd%22%3A1457434204539%2C%22connectStart%22%3A1457434204539%2C%22connectEnd%22%3A1457434204539%2C%22secureConnectionStart%22%3A0%2C%22requestStart%22%3A1457434204556%2C%22responseStart%22%3A1457434204562%2C%22responseEnd%22%3A1457434204564%2C%22domLoading%22%3A1457434204570%2C%22domInteractive%22%3A1457434204782%2C%22domContentLoadedEventStart%22%3A1457434204783%2C%22domContentLoadedEventEnd%22%3A1457434204786%2C%22domComplete%22%3A1457434204787%2C%22loadEventStart%22%3A1457434204787%2C%22loadEventEnd%22%3A0%7D&&_r=1457434204788 HTTP/1.1" 200 0 "http://localhost:9000/n/test/layout/layout" "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.20 Mobile Safari/537.36" "113.208.138.106" "E322C3C9AAA7E3B56F5AB6573E1719E2E1EAE693087EFABA6491AE8F06C390C0" "-""-" "-" "0.000"'

file_name='test-log.txt'

for ((i=0; i< 100; i++)); 
do
echo "${line}" >> "./${file_name}"
done

