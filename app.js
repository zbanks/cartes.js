
/**
 * Module dependencies.
 */

var express = require('express');
var connect = require('connect');
var auth = require('connect-auth');
var RedisStore = require('connect-redis');
var redis = require("redis").createClient();
var authStrategy = require('./authStrategy');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "ragoflago", store: new RedisStore }));
  app.use(auth(authStrategy()));

  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
    req.session.count = (req.session.count || 0) + 1;
    res.render("index", {
        title: "Express " + req.session.count,
    });
});

app.get('/test', function(req, res){
    req.authenticate(['dbAuth'], function(error, authenticated){
        if(authenticated){
            res.render('index', {
                title: 'Yay, ' + req.session.user + '!'
            });
        }else{
            res.render('index', {
                title: 'awww...'
            });
        }
    });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
