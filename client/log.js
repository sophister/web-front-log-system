
! function(){
    'use strict';
    
    var toString = Object.prototype.toString;
    
    //判断当前是否已经 dom ready
    var readyRE = /complete|loaded|interactive/;
    
    var point = 'm.we.com/s1/w.gif';
    
    var platform = '';
    
    var protocol = location.protocol;
    var pageID = '';
    
    var URL = protocol + '//' + point;
    
    function isString(s){
        return toString.call(s) === '[object String]';
    }
    
    function extend(to, from){
        for( var i in from ){
            if( from.hasOwnProperty(i) ){
                to[i] = from[i];
            }
        }
    }
    
    function json2query(data){
        var out = '';
        for( var i in data ){
            out += i + '=' + encodeURIComponent( data[i] ) + '&';
        }
        return out;
    }
    
    function request( url ){
        var now = ( new Date() ).getTime();
        var name = '___log_' + now;
        var img = new Image();
        window[name] = img;
        img.onload = img.onerror = function(){
            img.onload = img.onerror = null;
            window[name] = null;
            img = null;
        };
        img.src = url + '&_r=' + now;
    }
    
    /**
     * @param data {Object} { perf : { 性能数据 }, click : {}, error : {} }
     * @
     */
    function send( data ){
        var finalData = {
            pl : platform,
            pid : pageID
        };
        for( var i in data ){
            if( data.hasOwnProperty(i) ){
                if( ! isString(data[i]) ){
                    finalData[i] = JSON.stringify( data[i] );
                }else{
                    finalData[i] = data[i];
                }
            }
        }
        
        var url = URL + '?' +  json2query( finalData ) ;
        request( url );
        
    }
    
    var perfSent = false;
    
    var perfData = {
        
    };
    
    var singleton = {
        
        init : function( data ){
            platform = data.platform;
            pageID = data.pageID;
            if( ! pageID ){
                //默认取当前页面的 path  部分
                pageID = location.pathname;
            }
        },
        
        perf : {
            headStart : function( timestamp ){
                perfData.jhead_start = timestamp;
                return singleton;
            },
            bodyStart : function( timestamp ){
                timestamp = timestamp || ( new Date()).getTime();
                perfData.jbody_start = timestamp;
                return singleton;
            },
            bodyEnd : function( timestamp ){
                timestamp = timestamp || ( new Date()).getTime();
                perfData.jbody_end = timestamp;
                return singleton;
            },
            domReady : function( timestamp ){
                timestamp = timestamp || ( new Date()).getTime();
                perfData.jdom_ready = timestamp;
                return singleton;
            },
            fullLoad : function( timestamp ){
                timestamp = timestamp || ( new Date()).getTime();
                perfData.jfull_load = timestamp;
                return singleton;
            },
            send : function(){
                if( ! perfSent ){
                    if( window.performance && window.performance.timing ){
                        extend( perfData, window.performance.timing );
                    }
                    send( { perf : perfData } );    
                }
                perfSent = true;
                
            }
        }
    };
    
    //统计domready onload time
    if( readyRE.test( document.readyState ) && document.body ){
        singleton.perf.domReady();
    }else{
        document.addEventListener('DOMContentLoaded', function(){
            singleton.perf.domReady();
        } );
    }
    
    if( document.readyState !== 'complete' ){
        document.addEventListener('load', function(){
            singleton.perf.fullLoad();
            singleton.perf.send();
        } );
    }
    
    window.weLogger = singleton;
    
}();