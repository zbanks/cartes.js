var connect = require("connect");
var url = require("url");
var db = require("./redisdb");

var redis = db.redis;

module.exports = function(options){
    options = options || {};
    var that = {};
    var my = {};
    
    that.name = options.name || "dbAuth";
    
    function failed_validation( req, res, uri ) {
        var parsedUrl = url.parse(req.url, true);
        var redirectUrl = "/auth/form_callback"
        if( uri ) {
          redirectUrl= redirectUrl + "?redirect_url=" + uri;
        }
        else if( parsedUrl.query && parsedUrl.query.redirect_url ) {
          redirectUrl = redirectUrl + "?redirect_url=" + parsedUrl.query.redirect_url;
        }
        
        req.session.login = false;
        req.session.user = null;
        req.session.uid = null;
        //req.session.regenerate();
        res.redirect(redirectUrl);
    }
    
    function validate_credentials( executionScope, request, response, callback ) {    
        //setTimeout(function() {
            var parsedUrl= url.parse(request.url, true);
            if( request.body && request.body.user && request.body.password ) {
                console.log(request.body.user);
                redis.get(db.build("username", request.body.user, "uid"), function(err, uid){
                    if(err || !uid){
                        return executionScope.fail(callback);
                    }
                    uid = parseInt(uid.toString("ascii"), 10);
                   
                    redis.get(db.build("uid", uid, "password"), function(err, pwhash){
                        if(!err && pwhash && db.check_hash(request.body.password, pwhash.toString("ascii"))) {
                            //request.session.regenerate();
                            request.session.user = request.body.user;
                            request.session.uid = uid;
                            request.session.login = true;
                            executionScope.success( {name:request.body.user, uid:uid}, callback );
                        }else{
                            executionScope.fail( callback )
                        }
                    });
                });
            }else{
                failed_validation( request, response );
            }
        //}, 100);
    };
    that.authenticate = function(request, response, callback) {
        if( request.body && request.body.user && request.body.password ) { 
            validate_credentials( this, request, response, callback );
        }else if(request.session.login && request.session.user){
            this.success({ name: request.session.user, uid: request.session.uid }, callback);
        }else{
            failed_validation( request, response, request.url );
        }
    }
    that.setupRoutes = function(server) {
        server.use('/', connect.router(function routes(app){
            app.post('/auth/form_callback', function(request, response){
                request.authenticate( [that.name], function(error, authenticated) {
                    var redirectUrl= "/"
                    var parsedUrl= url.parse(request.url, true);
                    if( parsedUrl.query && parsedUrl.query.redirect_url ) {
                        redirectUrl= parsedUrl.query.redirect_url;
                    }
                    response.redirect(redirectUrl);
                })
            });
            app.get('/auth/form_callback', function(request, response){
                var parsedUrl= url.parse(request.url, true);
                var redirectUrl= "";
                if( parsedUrl.query && parsedUrl.query.redirect_url ) {
                    redirectUrl= "?redirect_url="+ parsedUrl.query.redirect_url;
                }
                redirectUrl = "/auth/form_callback" + redirectUrl
                response.render("login", {
                    title: "Login",
                    redirectUrl: redirectUrl
                });
            });
        }));
    };
    return that;
};
