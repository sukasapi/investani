import express from 'express';
// Import User model
import { User, createUser, getUserByEmail, comparePassword, getUserByID } from '../models/User';
import passport from 'passport';

let router = express.Router();
let LocalStrategy = require('passport-local').Strategy;

router.get('/', function (req, res) {
    res.render('pages/users');
});
router.get('/register', notLoggedIn, function (req, res) {
    res.render('pages/register');
});
router.post('/register', notLoggedIn, function (req, res) {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Please enter a valid email').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('cfm_pwd', 'Confirm Password is required').notEmpty();
    req.checkBody('cfm_pwd', 'Confirm Password must matches with Password').equals(password);
    
    let errors = req.validationErrors();
    if (errors) {
        res.render('pages/register', {
            errors: errors
        });
    }
    else {
        let user = new User({
            name: name,
            email: email,
            password: password
        });
        createUser(user, function (err, user) {
            if (err) {
                throw err;
            }
            else {
                console.log(user);
            }
        });
        req.flash('success_message', 'You have registered, Now please login');
        res.redirect('login');
    }
});
router.get('/login', notLoggedIn, function (req, res) {
    res.render('pages/login');
});
// Passport authenticate middleware
router.post('/login', notLoggedIn, passport.authenticate('local', {
    failureRedirect: '/users/login', failureFlash: true
}), function (req, res) {
    req.flash('success_message', 'You are now logged in!!');
    res.redirect('/');
});
router.get('/logout', isLoggedIn, function (req, res) {
    req.logOut();
    req.flash('success_message', 'You are logged out');
    res.redirect('/users/login');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/users/login');
    }
}
function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/');
    }
}

// Local passport strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
function (req, email, password, done) {
    getUserByEmail(email, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, req.flash('error_message', 'No email is found'));
        }
        comparePassword(password, user.password, function (err, isMatch) {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(null, user, req.flash('success_message', 'You have successfully loged in!!'));
            }
            else {
                return done(null, false, req.flash('error_message', 'Incorrect password'));
            }
        });
    });
}));

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    getUserByID(id, function (err, user) {
        done(err, user);
    });
});

export default router;