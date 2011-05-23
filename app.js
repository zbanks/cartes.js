
/**
 * Module dependencies.
 */

var express = require('express');
var connect = require('connect');
var auth = require('connect-auth');
var RedisStore = require('connect-redis');
var authStrategy = require('./authStrategy');
var db = require("./redisdb");
var Sandbox = require("sandbox");

var app = module.exports = express.createServer();
var redis = db.redis;

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "ragoflago", store: new RedisStore }));
  app.dynamicHelpers({ messages: require('express-messages') });
  app.use(auth(authStrategy()));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Middleware

function requireAuth(req, res, next){
    req.authenticate(['dbAuth'], function(error, authenticated){
        if(authenticated){
            next();
        }else{
            res.redirect('/auth/form_callback');
        }
    });
}

// Routes

app.get('/', function(req, res){
    req.session.count = (req.session.count || 0) + 1;
    res.render("index", {
        title: "Express " + req.session.count,
    });
});

app.get('/test', requireAuth, function(req, res){
    res.render('index', {
        title: 'Yay, ' + req.session.user + '!'
    });
});



app.post("/signup", function(req, res, next){
    var make_hash = function(password){
        var salt = (+new Date()).toString();
        return salt + "$" + crypto.createHash("sha512").update(salt+password).digest("hex");
    }
    if(!req.body.user || !req.body.password || !req.body.verify){
        return next();
    }
    var username = db.sanitize_user(req.body.user);
    if(username != req.body.user){
        req.flash("error", "Invalid username. Letters, numbers, and underscores only");
    }
    if(req.body.password != req.body.verify){
        req.flash("error", "Passwords do not match");
        return next();
    }
    redis.get("username:" + req.body.user + ":uid", function(err, v){
        if(err) throw err;
        if(v){
            req.flash("error", "Username taken");
            return next();
        }else{
            redis.incr("global:nextUserId", function(err, uid){
                if(err) throw err;
                var pwhash = db.make_hash(req.body.password);
                
                redis.mset(
                    db.build("uid", uid, "username"), req.body.user, 
                    db.build("uid", uid, "password"), pwhash,
                    db.build("username", req.body.user, "uid"), uid,
                    function(err){ 
                        if(err) throw err; 
                        req.flash("info", "Signup sucessful");
                        res.render("login", {
                            title: "Login",
                            redirectUrl: "/auth/form_callback?redirect_url=/"
                        });
                    }
                );
            });
        }
    });
});

app.all("/signup", function(req, res){
    res.render("signup", {
        title: "Signup",
        redirectUrl: "/signup"
    });
});

app.get("/code", requireAuth, function(req, res){
    req.authenticate(['dbAuth
});

app.post("/exec", requireAuth, function(req, res, next){
    if(req.body.code){
        s = new Sandbox();
        s.run(req.body.code, function(output){
            req.flash("info", output.result);
            next();
        });
    }else{
        next();
    }
});

app.all("/exec", requireAuth, function(req, res){
    res.render("exec", {
        title: "Execute JS"
    });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
