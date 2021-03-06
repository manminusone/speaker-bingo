

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config');
var mongoose = require('mongoose');
mongoose.connect(config.mongodb.uri);
mongoose.Promise = require('bluebird');

var session = require('express-session');
var mongoStore = require('connect-mongo')(session);

var db = require('./routes/db')({ 'mongoose': mongoose });
var adminUsers = require('./routes/users')({ 'db': db });
var adminRoutes = require('./routes/index')({ 'db': db, 'config': config });
var uriRoutes = require('./routes/uri')({ 'db': db, 'config': config });
var apiRoutes = require('./routes/api')({ 'db': db, 'config': config });
var vhost = require('vhost');

var app = express(), adminApp = express(), uriApp = express();
var mailer = require('express-mailer');
mailer.extend(app, config.mailer);


// view engine setup
adminApp.set('views', path.join(__dirname, 'views/admin'));
adminApp.set('view engine', 'pug');

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


adminApp.use('/', adminRoutes);
adminApp.use('/users', adminUsers);
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
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
adminApp.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

console.log('setting up ' + config.vhost.adminDomain);
app.use(vhost(config.vhost.adminDomain, adminApp));


// view engine setup
uriApp.set('views', path.join(__dirname, 'views/uri'));
uriApp.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
uriApp.use(logger('dev'));
uriApp.use(bodyParser.json());
uriApp.use(bodyParser.urlencoded({ extended: false }));
uriApp.use(cookieParser());
uriApp.use(express.static(path.join(__dirname, 'public')));

uriApp.use(session({
  secret: 'otherSecret',
  resave: false,
  saveUninitialized: false,
  store: new mongoStore({
    mongooseConnection: mongoose.connection
  })
}));


uriApp.use('/', uriRoutes);

// catch 404 and forward to error handler
uriApp.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (uriApp.get('env') === 'development') {
  uriApp.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
uriApp.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
console.log('setting up ' + config.vhost.uriDomain);
app.use(vhost(config.vhost.uriDomain, uriApp));

app.use(vhost('*', function(req,res) {
  res.send('generic domain received');
}));

module.exports = app;
