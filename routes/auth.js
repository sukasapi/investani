import express from 'express';
// Import User model
import { User, createUser, getUserByEmail, comparePassword, getUserByID, getUserBySecretToken } from '../models/User';
import passport from 'passport';
import nodemailer from 'nodemailer';
import randomstring from 'randomstring';
import path from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';
import bcrypt from 'bcryptjs';

const router = express.Router();
const LocalStrategy = require('passport-local').Strategy;

const compile = async function (templateName, data) {
    const filePath = path.join(__dirname, '../storage/email/', `${templateName}.ejs`);
    const html = await fs.readFile(filePath, 'utf-8');
    return ejs.render(html, data);
};

router.get('/', function (req, res) {
    res.redirect('/auth/login');
});
router.get('/register', notLoggedIn, function (req, res) {
    res.render('pages/auth/register');
});
router.get('/login', notLoggedIn, function (req, res) {
    res.render('pages/auth/login');
});
router.get('/forgot-password', notLoggedIn, function (req, res) {
    res.render('pages/auth/forgot-password');
});
router.get('/change-password/:secretToken', notLoggedIn, function (req, res) {
    let data = {
        secretToken: req.params.secretToken
    }
    res.render('pages/auth/change-password', data);
});
router.get('/logout', isLoggedIn, function (req, res) {
    req.logOut();
    req.flash('success_message', 'Anda berhasil keluar');
    res.redirect('/auth/login');
});

router.post('/register', notLoggedIn, function (req, res) {
    let email = req.body.email;
    let user_type = req.body.user_type;
    let password = req.body.password;
    let secretToken = randomstring.generate();
    let success_message;
    let error_message;

    req.checkBody('cfm_pwd', 'Konfirmasi Password tidak cocok dengan password.').equals(password);
    req.checkBody('cfm_pwd', 'Konfirmasi Password wajib diisi.').notEmpty();
    req.checkBody('password', 'Password tidak boleh lebih dari 50 karakter.').isLength({ max: 50 });
    req.checkBody('password', 'Password minimal mengandung 8 karakter.').isLength({ min: 8 });
    req.checkBody('password', 'Password wajib diisi.').notEmpty();
    req.checkBody('email', 'Email harus berupa alamat email yang benar.').isEmail();
    req.checkBody('email', 'Email wajib diisi.').notEmpty();
    
    let errors = req.validationErrors();
    
    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/auth/register');
        return ;
    }
    else {
        getUserByEmail(email, async function (err, user) {
            if (err) {
                error_message = "Terjadi kesalahan"; 
                req.flash('error_message', error_message);
                res.redirect('/auth/register');
                return ;
            }
            if (user) {
                error_message = "User sudah ada"; 
                req.flash('error_message', error_message);
                res.redirect('/auth/register');
                return ;
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
                let data =  {
                    secretToken: secretToken
                }
                const content = await compile('confirmation', data);
                let mailOptions = {
                    from: '"Investani" <investaninx@gmail.com>',
                    to: email,
                    subject: "Konfirmasi Email Pendaftaran",
                    html: content
                };
        
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        error_message = "Email gagal terkirim"; 
                        req.flash('error_message', error_message);
                        res.redirect('/auth/register');
                        return ;
                    }
                    else {
                        let user = new User({
                            email: email,
                            password: password,
                            user_type: [{
                                name: user_type,
                                status: "waiting",
                            }],
                            active: false,
                            secretToken: secretToken,
                            profile: [],
                            occupation: [],
                            pic: [],
                            document: [],
                            bank: [],
                            contract: ""
                        });
                        createUser(user, function (err) {
                            if (err) {
                                error_message = 'Akun gagal dibuat';
                                req.flash('error_message', error_message);
                                res.redirect('/auth/register');
                            }
                            else {
                                success_message = 'Anda sudah terdaftar, silahkan melakukan aktivasi';
                                req.flash('success_message', success_message);
                                passport.authenticate('local')(req, res, function () {
                                    res.redirect('/welcome');
                                    return ;
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});
// Passport authenticate middleware
router.post('/login', notLoggedIn, passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }), function (req, res) {
    let email = req.body.email;
    
    getUserByEmail(email, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan"; 
            req.flash('error_message', error_message);
            res.redirect('/auth/login');
            return ;
        }
        if (!user) {
            error_message = "User tidak tersedia"; 
            req.flash('error_message', error_message);
            res.redirect('/auth/login');
            return ;
        }
        if (user.active == false) {
            res.redirect('/welcome');
            return ;
        }
        if (user.active == true && user.profile.length == 0) {
            if (user.user_type[0].name == 'super_user') {
                res.redirect('/admin');
            }
            else {
                res.redirect('/welcome/email-activated');
                return ;
            }
        }
        if (user.active == true && user.profile.length != 0 && user.bank.length == 0) {
            res.redirect('/complete-profile');
        }
        if (user.active == true && user.profile.length != 0 && user.bank.length != 0) {
            if (user.active == true && user.user_type[0].status == 'verified') {
                if (user.user_type[0].name == 'investor') {
                    if (user.contract == '') {
                        res.redirect('/contract');
                    }
                    else {
                        res.redirect('/');
                        return ;
                    }
                }
                else {                    
                    res.redirect('/');
                    return ;
                }  
            }
            else {
                res.redirect('/');
                return ;
            }
        }
        
    });
});
router.post('/forgot-password', notLoggedIn, function (req, res) {
    let email = req.body.email;
    let secretToken = randomstring.generate();
    let error_message;
    let success_message;

    req.checkBody('email', 'Email harus berupa alamat email yang benar.').isEmail();
    req.checkBody('email', 'Email wajib diisi.').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        return res.redirect('/auth/forgot-password');
    }
    else {
        getUserByEmail(email, async function (err, user) {
            if (err) {
                error_message = "Terjadi kesalahan"; 
                req.flash('error_message', error_message);
                return res.redirect('/auth/forgot-password');
            }
            if (!user) {
                error_message = "User tidak ada"; 
                req.flash('error_message', error_message);
                return res.redirect('/auth/forgot-password');
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
                let data =  {
                    user: user,
                    secretToken: secretToken
                }
                const content = await compile('forgot-password', data);
                let mailOptions = {
                    from: '"Investani" <investaninx@gmail.com>',
                    to: email,
                    subject: "Ubah Password Anda",
                    html: content
                };
        
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        error_message = "Email gagal terkirim"; 
                        req.flash('error_message', error_message);
                        return res.redirect('/auth/forgot-password');
                    }
                    else {
                        user.secretToken = secretToken;
                        user.save()
                        .then(user => {
                            success_message = "Email ubah password berhasil terkirim";
                            req.flash('success_message', success_message);
                            return res.redirect('/auth/forgot-password');
                        })
                        .catch(error => {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect('/auth/forgot-password');
                        });
                    }
                });
            }
        });
    }
});
router.post('/change-password/:secretToken', notLoggedIn, function (req, res) {
    let password = req.body.password;
    let error_message;
    let success_message;

    req.checkBody('repassword', 'Password tidak cocok.').equals(password);
    req.checkBody('repassword', 'Password wajib diisi.').notEmpty();
    req.checkBody('password', 'Password tidak boleh lebih dari 50 karakter.').isLength({ max: 50 });
    req.checkBody('password', 'Password minimal mengandung 8 karakter.').isLength({ min: 8 });
    req.checkBody('password', 'Password wajib diisi.').notEmpty();

    let errors = req.validationErrors();
    
    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        return res.redirect(`/auth/change-password/${req.params.secretToken}`);
    }
    else {
        getUserBySecretToken(req.params.secretToken, function (error, user) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect(`/auth/change-password/${req.params.secretToken}`);
            }
            if (!user) {
                error_message = "User tidak ada"; 
                req.flash('error_message', error_message);
                return res.redirect(`/auth/change-password/${req.params.secretToken}`);
            }
            else {
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(password, salt, function(err, hash) {
                        user.secretToken = "";
                        user.password = hash;
                        user.save()
                        .then(user => {
                            success_message = "Password berhasil diubah";
                            req.flash('success_message', success_message);
                            return res.redirect('/auth/login');
                        })
                        .catch(error => {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect('/auth/login');
                        });
                    });
                  });
            }
        });
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/auth/login');
        return ;
    }
}
function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/');
        return ;
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
            return done(null, false, req.flash('error_message', 'Email tidak ditemukan'));
        }
        comparePassword(password, user.password, function (err, isMatch) {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(null, user, req.flash('success_message', 'Anda berhasil masuk!!'));
            }
            else {
                return done(null, false, req.flash('error_message', 'Password salah'));
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