import express from 'express';
import {
    getUserBySecretToken
} from '../models/User';

let router = express.Router();

router.get('/', isLoggedIn, function (req, res) {
    if (req.user.active && req.user.profile.length != 0) {       
        res.redirect('/complete-profile');
    }
    else {
        res.render('pages/welcome/welcome');
    }
});

router.get('/email-activated/:secretToken', function (req, res) {
    getUserBySecretToken(req.params.secretToken, function (err, user) {
        if (err) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            res.redirect('/auth/login');
        }
        if (!user) {
            error_message = "Token tidak valid";
            req.flash('error_message', error_message);
            res.redirect('/auth/login');
        } else {
            if (user.active) {
                res.render('pages/welcome/email-activated');
            }
            else {
                res.redirect('/welcome');
            }
        }
    });
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