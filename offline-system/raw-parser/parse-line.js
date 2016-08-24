/**
 * 解析一行原始的日志
 */

'use strict';

let url = require('url');

/**
 * 解析原始的一行日志
 */
function parseLine(line){
    let data = {};
    
    let reg = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s\-\s\-\s\[([^\]]+)\] "([^"]+)" (\d+) (\d+) "([^"]+)" "([^"]+)" "([^"]+)" "([^"]+)" "([^"]*)""([^"]+)" "([^"]+)" "([^"]+)"$/;
    
    let out = reg.exec(line);
    
    if( out ){
        //客户端IP
        data.remote_addr = out[1];
        //refer
        data.refer = out[6];
        //user agent
        data.user_agent = out[7];
        //sessionid
        data.session_id = out[9];
        
        //解析请求数据
        let reqString = out[3];
        
        let reqArray = reqString.split(' ');
        if( reqArray.length === 3 ){
            let href = reqArray[1];
            let obj = url.parse(href, true);
            let queryObj = obj.query;
            
            for( var i in queryObj ){
                if( queryObj.hasOwnProperty(i) && i ){
                    let key = i;
                    if( key === 'pl' ){
                        //platform
                        key = 'platform';
                    }else if( key === 'pid' ){
                        //page id
                        key = 'page_id';
                    }
                    data[key] = queryObj[i];
                }
            }
            
            return data;
        }else{
            return null;
        }
        
    }
    
    return null;
}


module.exports = parseLine;