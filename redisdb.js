var redis = require("node-redis").createClient();
var crypto = require('crypto');

redis.select(0);


module.exports = {
    redis : redis,
    
    check_hash : function(password, hashvalue){
        var salt = hashvalue.split("$")[0];
        var hash = hashvalue.split("$")[1];
        return hash == crypto.createHash("sha512").update(salt+password).digest("hex");
    },
    
    make_hash : function(password){
        var salt = (+new Date()).toString();
        return salt + "$" + crypto.createHash("sha512").update(salt+password).digest("hex");
    },
    
    sanitize_user : function(username){
        return username.replace(/\W/g, "");
    },
    
    build : function(){
        var query = "";
        for(var i = 0; i < arguments.length; i++){
            var a = arguments[i].toString();
            a = a.replace(/\:|\s/g, "");
            query += (i != 0 ? ":" : "") + a
        }
        return query;
    }
}
