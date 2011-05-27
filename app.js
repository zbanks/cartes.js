
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
var _ = require("underscore");
var cards = require("./cards");

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

app.post("/bots", requireAuth, function(req, res, next){
    if(req.body.name){
        var bot = {};
        bot.name = req.body.name;
        bot.uid = req.session.uid;
        bot.code = "function(a, b, c){\n\treturn a + b + c;\n}";
        redis.incr("global:nextBotId", function(err, bid){
            if(err) return;
            bot.bid = bid;
            db.setdict(db.build("bid", bid), bot, function(err){
                if(err) return;
                redis.sadd(db.build("uid", req.session.uid, "bots"), bid, function(err){
                    if(err) return;
                    next();
                });
            });
        });
    }
});
app.all("/bots", requireAuth, function(req, res){
    redis.smembers(db.build("uid", req.session.uid, "bots"), function(err, bids){
        if(!err){
            var bots = [];
            var botGenerator = function(){
                console.log(bots, bids);
                if(bots.length != bids.length){
                    db.getdict(
                        db.build("bid", bids[bots.length].toString("ascii")),
                        ["name", "code", "bid", "uid"], 
                        function(err, res){
                            if(err) return;
                            botGenerator();                  
                        }
                    );
                }else{
                    res.render("bots", {
                        title: "Bots",
                        user: req.session.user,
                        bots: bots
                    });
                }
            }
            botGenerator();
        }      
    });
});

app.post("/code/:bid", requireAuth, function(req, res, next){
    if(!req.body.code) return next();
    db.getdict(db.build("bid", req.params.bid), ["name", "code", "bid", "uid"],
        function(err, bot){
            if(err) return next();
            if(bot.uid != req.session.uid) return next();
            bot.code = req.body.code;
            db.setdict(db.build("bid", req.params.bid), bot, function(err){
                if(err) return;
                next();
            });
        }
   );
});

app.all("/code/:bid", requireAuth, function(req, res){
    db.getdict(db.build("bid", req.params.bid), ["name", "code", "bid", "uid"],
        function(err, bot){
            if(err) return;
            res.render("code", {
                title: "View Code",
                session: req.session,
                bot: bot
            });
        }
   );
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
