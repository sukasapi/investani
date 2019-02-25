import express from 'express';
import {User, getUser } from '../models/User';

const router = express.Router();

router.get('/', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});

router.get('/user', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});

router.get('/user/investor', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});

router.get('/user/investor/individual', isLoggedIn, isAdmin, function (req, res) {
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/investor/individual', {users: users});
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

function isAdmin(req, res, next) {
    if (req.user.user_type[0].name == 'super_user' && req.user.user_type[0].status == 'verified') {
        next();
    }
    else {
        res.redirect('/');
    }
}

export default router;