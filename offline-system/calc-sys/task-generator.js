/**
 * Created by jess on 16/3/11.
 */


'use strict';


let createPerformanceTask = require('./task-base/perf-task-base.js');



let singleton = {

    createPerformanceTask : createPerformanceTask

};


module.exports = singleton;