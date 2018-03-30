var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var generalResponse = require('../tools/generalResponse');
var router = express.Router();

/* GET users listing. */
router.get('/me', function (req, res, next) {
  if (!req.user) {
    res.json(generalResponse.json('unauthenticated', null, "Please Login"));
  } else {
    res.json(generalResponse.json(true, req.user));
  }
});

// TODO: require privileges
router.get('/:email/info', function (req, res, next) {
  // TODO: query and return user info
  // res.json({ user:  })
});

router.post('/register', function (req, res, next) {
  User.register(new User({ email: req.body.email, name: req.body.name }), req.body.password, function (err, user) {
    if (err) {
      return res.json(generalResponse.json(false, null, err.message));
    }
    passport.authenticate('local')(req, res, function () {
      res.json(generalResponse.json());
    })
  })
});

router.get('/login-failed', function (req, res) {
  res.json(generalResponse.json(false, null, "Wrong email or password"));
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/users/me',
  failureRedirect: '/users/login-failed'
}));

router.get('/logout', function (req, res) {
  req.logout();
  res.json(generalResponse.json());
});

router.get('/is-login', function (req, res, next) {
  res.json(generalResponse.json(true, !!req.user));
});

module.exports = router;
