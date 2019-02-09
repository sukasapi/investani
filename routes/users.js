import express from 'express';
// Import User model
import { User, createUser, getUserByEmail, comparePassword, getUserByID } from '../models/User';
import passport from 'passport';
import nodemailer from 'nodemailer';
import randomstring from 'randomstring';

let router = express.Router();
let LocalStrategy = require('passport-local').Strategy;

router.get('/', function (req, res) {
    res.render('pages/users');
});
router.get('/register', notLoggedIn, function (req, res) {
    res.render('pages/register');
});
router.post('/register', notLoggedIn, function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let secretToken = randomstring.generate();
    let error_email;
    let error_password;
    let error_cfm_pwd;

    req.checkBody('email', 'Email harus berupa alamat email yang benar.').isEmail();
    req.checkBody('email', 'Email wajib diisi.').notEmpty();
    req.checkBody('password', 'Password tidak boleh lebih dari 50 karakter.').isLength({ max: 50 });
    req.checkBody('password', 'Password minimal mengandung 8 karakter.').isLength({ min: 8 });
    req.checkBody('password', 'Password wajib diisi.').notEmpty();
    req.checkBody('cfm_pwd', 'Konfirmasi Password tidak cocok dengan password.').equals(password);
    req.checkBody('cfm_pwd', 'Konfirmasi Password wajib diisi.').notEmpty();
    
    let errors = req.validationErrors();
    
    if (errors) {
        for (let index = 0; index < errors.length; index++) {
            if (errors[index].param == 'email') {
                error_email = errors[index].msg;                
            }
            if (errors[index].param == 'password') {
                error_password = errors[index].msg;
                
            }
            if (errors[index].param == 'cfm_pwd') {
                error_cfm_pwd = errors[index].msg;
            }
        }

        req.flash('error_email', error_email);
        req.flash('error_password', error_password);
        req.flash('error_cfm_pwd', error_cfm_pwd);
        res.redirect('/users/register');
    }
    else {
        getUserByEmail(email, function (err, user) {
            if (err) {
                error_email = "Terjadi kesalahan"; 
            }
            if (user) {
                error_email = "User sudah ada"; 
                req.flash('error_email', error_email);
                res.redirect('/users/register');
            }
            else {
                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'investaninx@gmail.com',
                        pass: 'investani2019'
                    }
                });
                let mailOptions = {
                    from: '"Investani" <investaninx@gmail.com>',
                    to: email,
                    subject: "Konfimrasi Email Pendaftaran",
                    html: `<a href="http://127.0.0.1:3000/activation/${secretToken}">http://127.0.0.1/activation/${secretToken}</a>`
                };
        
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    else {
                        console.log('Message %s sent: %s', info.messageId, info.response);
                        let user = new User({
                            email: email,
                            password: password,
                            active: false,
                            secretToken: secretToken,
                        });
                        createUser(user, function (err, user) {
                            if (err) {
                                throw err;
                            }
                            else {
                                console.log(user);
                                req.flash('success_message', 'You have registered, Now please login');
                                res.redirect('/welcome');
                            }
                        });
                    }
                });
            }
        });
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