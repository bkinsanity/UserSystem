var express = require('express');
var Router = express.Router();
var multer = require('multer');
var upload = multer({dest: './uploads'});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var nodemailer = require('nodemailer');
var async = require('async');
var bcrypt = require('bcryptjs');
crypto = require('crypto');

var smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  secureConnection: true,
  auth: {
    user: 'bkinsanity@gmail.com',
    pass:
  }
});

/* GET users listing. */
Router.get('/', (req, res, next) => { // http://localhost:3000/users/
  res.send('respond with a resource');
});

/*
Login logic
get: Render login.jade to user to fill in.
post: Apply passport module to verify user, then go into the alumni db system
*/
Router.get('/login', (req, res, next) => {
  res.render('login', {title: 'Login'});
});

Router.post('/login',
  passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid email, password or inactive username'}),
  (req, res) => {
    req.flash('success', 'You are now logged in');
    res.redirect('/'); // http://localhost:3000/
  }
);

/*
Passport logic
*/
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new LocalStrategy((username, password, done) => {
  User.getUserByUsername(username, (err, user) => {
    if (err)
      throw err;

    if (!user)
      return done(null, false, {message: 'Unknown User'});

    if (!user.isActive)
      return done(null, false, {message: 'User has not been activated yet'});

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err)
        return done(err);

      if (isMatch)
        return done(null, user);
      else
        return done(null, false, {message: 'Invalid Password'});
    });
  });
}));

/*
Register logic
get: Render register.jade to user to fill in.
post: If inputs are valid, then create a inactive user account first.
      After verifying user's email, mark this account active.
get verify token: Update the accout which holds the token to be active.
*/
Router.get('/register', (req, res, next) => {
  res.render('register', {title: 'Register'});
});

Router.post('/register', upload.single('profileimage'), (req, res, next) => {
  // Form Validator
  req.checkBody('username', 'Username field is required').notEmpty();
  req.checkBody('email', 'Email field is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password field is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  // Check Errors
  var errors = req.validationErrors();

  if (errors) {
  	res.render('register', {errors});
  } else {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          userCredentials = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            verifyEmailToken: buf.toString('hex'),
            verifyEmailExpires: Date.now() + 300000, // 5min
            isActive: false, // create an inactive account first
            isSuperUser: false // create an inactive account first
          };
          done(err, userCredentials);
        });
      },
      function(userCredentials, done) {
        console.log(userCredentials);
        var mailOptions = {
          to: userCredentials.email,
          from: 'bkinsanity@gmail.com',
          subject: 'Tsing Hua Alumni Email Verification',
          text: 'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/users/verify/' + userCredentials.verifyEmailToken + '\n\n' +
            'If you did not request this, please ignore this email.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log(err);
          req.flash('info', 'An e-mail has been sent to ' + userCredentials.email + ' with further instructions.');
          done(err, userCredentials);
        });
      },
      function(userCredentials, done) {
        console.log("Creating new user.");
        User.createUser(new User(userCredentials), (err, user) => {
          if (err) {
            console.log("Can't create new user.");
            req.flash('error', err);
            res.redirect('/users/login');
          } else {
            console.log("Created new user successfully.");
            res.location('/');
            res.redirect('/users/login');
          }
        });
      }
    ], (err) => {
      if (err)
        return next(err);

      res.redirect('/users/register');
    });
  }
});

Router.get('/verify/:token', (req, res) => {
  User.getUserByVerifyEmailToken(req.params.token, (err, user) => {
    if (!user) {
      req.flash('error', 'No account with that email address exists.');
      return res.redirect('/users/login');
    }
    user.isActive = true;
    User.findOneAndUpdate({username: user.username}, user, (err, user) => {
      if (err) {
        req.flash('error', 'No account with that email address exists.');
        return res.redirect('/users/login');
      } else {
        req.flash('Your email address has been verified. You can login now');
        return res.redirect('/users/login');
      }
    });
  });
});

/*
forget logic
get: Render forget.jade to user to fill in.
post: Send a reset email to user.
get rest token: Render reset.jade to user.
post rest token: Update user's password.
*/
Router.get('/forgot', (req, res) => {
  res.render('forgot', {user: req.user});
});

Router.post('/forgot', (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, (err, buf) => {
        done(err, buf.toString('hex'));
      });
    },
    function(token, done) {
      User.findOne({email: req.body.email}, (err, user) => {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 300000; // 5min
        user.save((err) => {
          done(err, user);
        });
      });
    },
    function(user, done) {
      var mailOptions = {
        to: user.email,
        from: 'bkinsanity@gmail.com',
        subject: 'Alumni Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + user.resetPasswordToken + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], (err) => {
    if (err)
      return next(err);

    res.redirect('/users/forgot');
  });
});

Router.get('/reset/:token', function(req, res) {
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/forgot');
    }
    res.render('reset', {user: req.user});
  });
});

Router.post('/reset/:token', (req, res) => {
  async.waterfall([
    function(done) {
      User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/users/login');
        }

        //user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        bcrypt.genSalt(10, (err, salt) => {
    	    bcrypt.hash(req.body.password, salt, (err, hash) => {
   		  	  user.password = hash;
            user.save((err) => {
              done(err, user);
            });
    	    });
	      });
      });
    }
  ], (err) => {
    res.redirect('/');
  });
});

/*
Logout logic
get: Return to URL: /users/login
*/
Router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

module.exports = Router;
