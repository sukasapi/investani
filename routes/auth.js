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
    let error_message;
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
        res.redirect('/auth/register');
    }
    else {
        getUserByEmail(email, function (err, user) {
            if (err) {
                error_message = "Terjadi kesalahan"; 
                req.flash('error_email', error_message);
                res.redirect('/auth/register');
            }
            if (user) {
                error_email = "User sudah ada"; 
                req.flash('error_email', error_email);
                res.redirect('/auth/register');
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
                    html: `<a href="http://127.0.0.1:3000/activation/${secretToken}">http://127.0.0.1:3000/activation/${secretToken}</a>`
                };
        
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        error_message = "Email gagal terkirim"; 
                        req.flash('error_email', error_message);
                        res.redirect('/auth/register');
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
                                req.flash('success_message', 'Anda sudah terdaftar, silahkan melakukan aktivasi');
                                passport.authenticate('local')(req, res, function () {
                                    console.log(req);
                                    res.redirect('/welcome');
                                });
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
router.post('/login', notLoggedIn, passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }), function (req, res) {
    let email = req.body.email;
    getUserByEmail(email, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan"; 
            req.flash('error_email', error_message);
            res.redirect('/auth/login');
        }
        if (!user) {
            error_email = "User tidak tersedia"; 
            req.flash('error_email', error_email);
            res.redirect('/auth/login');
        }
        if (!user.active) {
            res.redirect('/welcome/email-activated');
        }
        if (user.profile.length == 0) {
            console.log(user.profile.length);
            res.redirect('/welcome/email-activated');
        }
        else {          
            res.redirect('/');
        }
    });
});

router.get('/logout', isLoggedIn, function (req, res) {
    req.logOut();
    req.flash('success_message', 'You are logged out');
    res.redirect('/auth/login');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/auth/login');
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
            return done(null, false, req.flash('error_email', 'Email tidak ditemukan'));
        }
        comparePassword(password, user.password, function (err, isMatch) {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(null, user, req.flash('success_message', 'Anda berhasil masuk!!'));
            }
            else {
                return done(null, false, req.flash('error_password', 'Password salah'));
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