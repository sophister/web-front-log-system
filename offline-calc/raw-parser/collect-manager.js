/**
 * 维护所有的不同平台不同类型的 model 数组
 */

'use strict';


let collectorArray = [];



//遍历collectors目录，加载该目录下所有的collector


let singleton = {
    
    collect : function( lineObj ){
        for( let i = 0, len = collectorArray.length; i < len; i++ ){
            let collector = collectorArray[i];
            collector( lineObj );
        }
    }
    
};


module.exports = singleton;