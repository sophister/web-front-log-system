/**
 * 从数据库读取移动端的性能统计日志,计算结果并保存
 * Created by jess on 16/3/11.
 */

'use strict';


module.exports = taskGenerator.createPerformanceTask({
    filter : {
        platform : PLATFORM_TYPE.MOBILE,
        type : LOG_TYPE.PERFORMANCE,
        page_id : '/n/mo/lp/wecaishuo'
    }
});