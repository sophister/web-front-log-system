
'use strict';

require('../globals.js');

let modelFactory = require('../model/model-factory.js');


let perfModel = modelFactory.getModel({
    platform : 'mo',
    type : 'perf',
    logDate : 20160307
});


for( var i = 0, len = 1000; i < len; i++ ){
    perfModel.add({
        page_id : 'test_' + i,
        log_data : JSON.stringify({ k1 : 'v1', k2 : i })
    });
}

perfModel.commit().then(function(){
    console.log('OK');
}).catch(function(err){
    console.error( err );
});

