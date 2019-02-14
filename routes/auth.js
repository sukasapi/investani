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
    res.render('pages/auth/register');
});
router.post('/register', notLoggedIn, function (req, res) {
    let email = req.body.email;
    let user_type = req.body.user_type;
    let password = req.body.password;
    let secretToken = randomstring.generate();
    let error_message;

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
                error_message = errors[index].msg;                
            }
            if (errors[index].param == 'password') {
                error_message = errors[index].msg;
                
            }
            if (errors[index].param == 'cfm_pwd') {
                error_message = errors[index].msg;
            }
        }
        req.flash('error_message', error_message);
        res.redirect('/auth/register');
        return ;
    }
    else {
        getUserByEmail(email, function (err, user) {
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
                let mailOptions = {
                    from: '"Investani" <investaninx@gmail.com>',
                    to: email,
                    subject: "Konfimrasi Email Pendaftaran",
                    html: `<!DOCTYPE > <html> <head> <title>Internal_email-29</title> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <style type="text/css"> * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:none; -webkit-text-resize:100%; text-resize:100%; } a{ outline:none; color:#40aceb; text-decoration:underline; } a:hover{text-decoration:none !important;} .nav a:hover{text-decoration:underline !important;} .title a:hover{text-decoration:underline !important;} .title-2 a:hover{text-decoration:underline !important;} .btn:hover{opacity:0.8;} .btn a:hover{text-decoration:none !important;} .btn{ -webkit-transition:all 0.3s ease; -moz-transition:all 0.3s ease; -ms-transition:all 0.3s ease; transition:all 0.3s ease; } table td {border-collapse: collapse !important;} .ExternalClass, .ExternalClass a, .ExternalClass span, .ExternalClass b, .ExternalClass br, .ExternalClass p, .ExternalClass div{line-height:inherit;} @media only screen and (max-width:500px) { table[class="flexible"]{width:100% !important;} table[class="center"]{ float:none !important; margin:0 auto !important; } *[class="hide"]{ display:none !important; width:0 !important; height:0 !important; padding:0 !important; font-size:0 !important; line-height:0 !important; } td[class="img-flex"] img{ width:100% !important; height:auto !important; } td[class="aligncenter"]{text-align:center !important;} th[class="flex"]{ display:block !important; width:100% !important; } td[class="wrapper"]{padding:0 !important;} td[class="holder"]{padding:30px 15px 20px !important;} td[class="nav"]{ padding:20px 0 0 !important; text-align:center !important; } td[class="h-auto"]{height:auto !important;} td[class="description"]{padding:30px 20px !important;} td[class="i-120"] img{ width:120px !important; height:auto !important; } td[class="footer"]{padding:5px 20px 20px !important;} td[class="footer"] td[class="aligncenter"]{ line-height:25px !important; padding:20px 0 0 !important; } tr[class="table-holder"]{ display:table !important; width:100% !important; } th[class="thead"]{display:table-header-group !important; width:100% !important;} th[class="tfoot"]{display:table-footer-group !important; width:100% !important;} } </style> </head> <body style="margin:0; padding:0;" bgcolor="#eaeced"> <table style="min-width:320px;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eaeced"> <!-- fix for gmail --> <tr> <td class="hide"> <table width="600" cellpadding="0" cellspacing="0" style="width:600px !important;"> <tr> <td style="min-width:600px; font-size:0; line-height:0;">&nbsp;</td> </tr> </table> </td> </tr> <tr> <td class="wrapper" style="padding:0 10px;"> <!-- module 3 --> <table data-module="module-3" data-thumb="thumbnails/03.png" width="100%" cellpadding="0" cellspacing="0"> <tr> <td data-bgcolor="bg-module" bgcolor="#eaeced"> <table class="flexible" width="600" align="center" style="margin:0 auto;" cellpadding="0" cellspacing="0"> <tr> <td class="img-flex"><img src="images/img-02.jpg" style="vertical-align:top;" width="600" height="249" alt="" /></td> </tr> <tr> <td data-bgcolor="bg-block" class="holder" style="padding:50px 50px 50px;" bgcolor="#f9f9f9"> <table width="100%" cellpadding="0" cellspacing="0"> <tr> <td data-color="title" data-size="size title" data-min="20" data-max="40" data-link-color="link title color" data-link-style="text-decoration:none; color:#292c34;" class="title" align="center" style="font:30px/33px Arial, Helvetica, sans-serif; color:#292c34; padding:0 0 24px;"> Investani </td> </tr> <tr> <td data-color="text" data-size="size text" data-min="10" data-max="26" data-link-color="link text color" data-link-style="font-weight:bold; text-decoration:underline; color:#40aceb;" align="center" style="font:12px Arial, Helvetica, sans-serif; color:#888; padding:0 0 21px;"> Email ini dibuat secara otomatis. Mohon tidak mengirimkan balasan ke email ini. Bila membutuhkan bantuan, hubungi ... </td> </tr> <tr> <td data-color="text" data-size="size text" data-min="10" data-max="26" data-link-color="link text color" data-link-style="font-weight:bold; text-decoration:underline; color:#40aceb;" align="left" style="font:bold 1.5em Arial, Helvetica, sans-serif; color:#292c34; padding:0 0 23px;"> Hi, </td> </tr> <tr> <td data-color="text" data-size="size text" data-min="10" data-max="26" data-link-color="link text color" data-link-style="font-weight:bold; text-decoration:underline; color:#40aceb;" align="left" style="font:16px Arial, Helvetica, sans-serif; color:#292c34; padding:0 0 21px;"> Terima kasih telah mendaftarkan email anda di Investani. <br> Tekan tombol di bawah ini untuk aktivasi email Anda. </td> </tr> <tr> <td style="padding:0 0 20px;"> <table width="134" align="left" style="margin:0 auto;" cellpadding="0" cellspacing="0"> <tr> <td data-bgcolor="bg-button" data-size="size button" data-min="10" data-max="16" class="btn" align="center" style="font:12px/14px Arial, Helvetica, sans-serif; color:#f8f9fb; text-transform:uppercase; mso-padding-alt:12px 10px 10px; border-radius:2px;" bgcolor="#40aceb"> <a target="_blank" style="text-decoration:none; color:#f8f9fb; display:block; padding:12px 10px 10px;" href="http://127.0.0.1:3000/activation/${secretToken}">Klik di sini</a> </td> </tr> </table> </td> </tr> <tr> <td data-color="text" data-size="size text" data-min="10" data-max="26" data-link-color="link text color" data-link-style="font-weight:bold; text-decoration:underline; color:#40aceb;" align="left" style="font:16px Arial, Helvetica, sans-serif; color:#888; padding:0 0 21px;"> <b>Mengapa harus mengaktivasi email?</b> <br> Ini adalah bentuk keamanan sistem kami. Jika email Anda tidak diverifikasi, maka Anda tidak dapat melanjutkan pendaftaran. </td> </tr> </table> </td> </tr> <tr><td height="28"></td></tr> </table> </td> </tr> </table> </td> </tr> <!-- fix for gmail --> <tr> <td style="line-height:0;"><div style="display:none; white-space:nowrap; font:15px/1px courier;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div></td> </tr> </table> </body></html>`
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
                                status: "waiting"
                            }],
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

router.get('/login', notLoggedIn, function (req, res) {
    res.render('pages/auth/login');
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
            res.redirect('/welcome/email-activated');
            return ;
        }
        if (user.active == true && user.profile.length == 0) {
            res.redirect('/complete-profile');
            return ;
        }
        else {
            res.redirect('/');
            return ;
        }
    });
});

router.get('/logout', isLoggedIn, function (req, res) {
    req.logOut();
    req.flash('success_message', 'Anda berhasil keluar');
    res.redirect('/auth/login');
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
                return done(null, user, req.flash('error_message', 'Anda berhasil masuk!!'));
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