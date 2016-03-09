
'use strict';


let singleton = {
    log : function(){
        console.log.apply( console, arguments );
    },
    info : function(){
        console.info.apply( console, arguments );
    },
    warn : function(){
        console.warn.apply( console, arguments );
    },
    error : function(){
        console.error.apply( console, arguments );
    },
    fatal : function(){
        console.error.apply( console, arguments );
    }
};


module.exports = singleton;