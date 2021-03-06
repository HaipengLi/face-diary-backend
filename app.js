var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var serveStatic = require('serve-static');
var cors = require('cors');
var User = require('./models/user');
var consts = require('./consts');

var mongoDB = consts.MONGO_URI;
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// enable debug
mongoose.set('debug', true);

var index = require('./routes/index');
var users = require('./routes/users');
var emotion = require('./routes/emotion');
var entries = require('./routes/entries');

var app = express();

// view engine setup
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// about user authentication
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// serve media files
app.use(serveStatic(path.join(__dirname, 'media')));

app.use(function (req, res, next) {

  // console.log(req.headers);
  var origin = req.headers.origin;
  console.log("origin: " + origin);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // console.log(origin);
  // if (consts.ALLOWED_HOSTS.findIndex(function (value) { return value === origin }) >= 0) {
  //   res.setHeader('Access-Control-Allow-Origin', origin);
  // }
  // Website you wish to allow to connect

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Auth-Token,X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  if ('OPTIONS' === req.method) {
    //respond with 200
    res.send(200);
  }

  // Pass to next layer of middleware
  next();
});

app.use('/', index);
app.use('/users', users);
app.use('/emotion', emotion);
app.use('/entries', entries);

// passport config
passport.use(User.createStrategy());
passport.use(new FacebookStrategy({
    clientID: consts.FACEBOOK_APP_ID,
    clientSecret: consts.FACEBOOK_APP_SECRET,
    callbackURL: consts.BASE_URL + '/users/facebook-token',
  },
  function(req, accessToken, refreshToken, profile, cb) {
    // asynchronous verification, for effect...
    if (req.user) {
      console.log("User is logged in ????");
      cb(null);
    } else {
      User.findOne({ facebookId: profile.id }, function (err, existingUser) {
        if (existingUser) {
          console.log("user exists");
          return cb(undefined, existingUser);
        } else {
          user = new User();
          user.email = profile.id;  // better solution ?
          user.facebookId = profile.id;
          user.name = (profile.name.givenName + profile.name.familyName) || profile.displayName;
          user.save(function (err) {
            cb(err, user);
          });
        }
      });
    }
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
