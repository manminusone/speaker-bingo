

// requires with no config needed
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var mailer = require('express-mailer');
var vhost = require('vhost');

var config = require('./config');

// requires with configs
mongoose.connect(config.mongodb.uri);
mongoose.Promise = require('bluebird');
var mongoStore = require('connect-mongo')(session);

var app = express(), adminApp = express(), mobileApp = express();

// library objects that may be used in multiple routes/libs
// var db = require('./routes/lib/db')({ 'mongoose': mongoose });
var userlib = require('./routes/lib/user')( { 'config': config, 'mongoose': mongoose } );
var doclib = require('./routes/lib/bingodocs')( { 'config': config, 'mongoose': mongoose });



// --- admin site setup ---

// view engine setup
adminApp.set('views', path.join(__dirname, 'views/admin'));
adminApp.set('view engine', 'pug');
// console.log('setting up mailer - ' + JSON.stringify( config.mailer));
mailer.extend(adminApp, config.mailer);

var adminRoutes = require('./routes/admin/index')({ 'config': config, 'userlib': userlib, 'doclib': doclib, 'mailer': adminApp.mailer });

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
adminApp.use(logger('dev'));
adminApp.use(bodyParser.json());
adminApp.use(bodyParser.urlencoded({ extended: false }));
adminApp.use(cookieParser());
adminApp.use(express.static(path.join(__dirname, 'public')));

adminApp.use(session({
  secret: 'fstrCokeCt',
  resave: false,
  saveUninitialized: false,
  store: new mongoStore({
    mongooseConnection: mongoose.connection
  })
}));

// --- api setup ---
var apiRoutes = require('./routes/api/index')({ 'config': config, 'userlib': userlib, 'doclib': doclib });



adminApp.use('/', adminRoutes);
adminApp.use('/api', apiRoutes);

// catch 404 and forward to error handler
adminApp.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (adminApp.get('env') === 'development') {
  adminApp.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      config: config
    });
  });
}

// production error handler
// no stacktraces leaked to user
adminApp.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    config: config
  });
});

app.use(vhost(config.vhost.adminDomain, adminApp));

// --- mobile site setup ---

// view engine setup
mobileApp.set('views', path.join(__dirname, 'views/uri'));
mobileApp.set('view engine', 'pug');

var mobileRoutes = require('./routes/mobile/index')({ 'config': config, 'userlib': userlib, 'doclib': doclib });

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
mobileApp.use(logger('dev'));
mobileApp.use(bodyParser.json());
mobileApp.use(bodyParser.urlencoded({ extended: false }));
mobileApp.use(cookieParser());
mobileApp.use(express.static(path.join(__dirname, 'public')));

mobileApp.use(session({
  secret: 'otherSecret',
  resave: false,
  saveUninitialized: false,
  store: new mongoStore({
    mongooseConnection: mongoose.connection
  })
}));


mobileApp.use('/', mobileRoutes);

// catch 404 and forward to error handler
mobileApp.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (mobileApp.get('env') === 'development') {
  mobileApp.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      config: config
    });
  });
}

// production error handler
// no stacktraces leaked to user
mobileApp.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    config: config
  });
});
app.use(vhost(config.vhost.uriDomain, mobileApp));

// catch-all
app.use(vhost('*', function(req,res) {
  res.send('generic domain received');
}));

module.exports = app;
