var redis = require("node-redis").createClient();
var crypto = require('crypto');
var _ = require("underscore");

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
    },
    
    sethash : function(key, value, callback){
        return redis.hmset(key, JSON.stringify(value), callback);
    },
    
    gethash : function(key, callback){
        return redis.hgetall(key, function(err, res){
            callback(err, JSON.parse(res));
        });
    },
    
    getdict : function(prefix, keys, callback){
        redis.mget.apply(redis, _.map(keys, function(k){return prefix + ":" + k;}).concat(function(err,  vals){
            var res = {};
            //console.log(arguments);
            if(!err)
                _.each(_.zip(keys, vals), function(kv){  
                    if(kv[1].length < 32){
                        res[kv[0]] = kv[1].toString("ascii");
                    }else{
                        res[kv[0]] = kv[1];
                    }
                });
            callback(err, res);
        }));
    },
    
    setdict : function(prefix, vals, callback){
        var query = [];
        _.each(vals, function(val, key){
            query.push(prefix + ":" + key);
            query.push(val);
        });
        query.push(callback);
        redis.mset.apply(redis, query);
    }
}
