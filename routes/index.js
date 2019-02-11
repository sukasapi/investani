import express from 'express';
import { getUserBySecretToken, updateUser } from '../models/User';

let router = express.Router();

router.get('/', isLoggedIn, function (req, res) {
    res.render('pages/index');
});

router.get('/welcome', isLoggedIn, function (req, res) {
    if (req.user.active) {
        res.redirect('/');
    }
    else {
        res.render('pages/welcome/welcome');
    }
});
router.get('/activation/:secretToken', function(req, res) {

    let secretToken = req.params.secretToken;
    let error_message;
    getUserBySecretToken(secretToken, function (err, user) {
        if (err) {
            error_message = "Terjadi kesalahan"; 
        }
        if (!user) {
            error_message = "Token tidak valid"; 
            req.flash('error_message', error_message);
        }
        else {
            let updateValue = {
                active: true,
                secretToken: ""
              }
            updateUser(user, updateValue, function (err, user) {               
                if (err) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    res.redirect('/auth/login');
                }
                if (!user) {
                    error_message = "User tidak ada"; 
                    req.flash('error_message', error_message);
                    res.redirect('/auth/login');
                }
                else {
                    res.redirect('/auth/login');
                }
            });
        }
    });
});
router.get('/welcome/email-activated', isLoggedIn, function (req, res) {
    if (req.user.active) {
        res.render('pages/welcome/email-activated');
    }
    else {
        res.redirect('/welcome');
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/auth/login');
    }
}

export default router;