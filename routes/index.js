import express from 'express';
import { getUserBySecretToken, updateUser } from '../models/User';

let router = express.Router();

router.get('/', isLoggedIn, function (req, res) {
    res.render('pages/index');
});

router.get('/welcome', function (req, res) {
    res.render('pages/welcome');
});

router.get('/activation/:secretToken', notLoggedIn, function (req, res) {
    let secretToken = req.params.secretToken;
    
    getUserBySecretToken(secretToken, function (err, user) {
        if (err) {
            error_message = "Terjadi kesalahan"; 
        }
        if (!user) {
            error_message = "Token tidak valid"; 
            req.flash('error_message', error_message);
        }
        let updateValue = {
            active: true,
            secretToken: ""
          }
        updateUser(user, updateValue, function (err, user) {
            console.log(user);
        });
        res.redirect('/users/login');
    });
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

export default router;