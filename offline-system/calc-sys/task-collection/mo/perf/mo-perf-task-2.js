/**
 * /n/test/ui/carousel 页面的性能统计 demo
 * Created by jess on 16/3/11.
 */

'use strict';


module.exports = taskGenerator.createPerformanceTask({
    filter : {
        platform : PLATFORM_TYPE.MOBILE,
        type : LOG_TYPE.PERFORMANCE,
        page_id : '/n/test/ui/carousel'
    }
});