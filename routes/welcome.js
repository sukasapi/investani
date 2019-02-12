import express from 'express';

let router = express.Router();

router.get('/', isLoggedIn, function (req, res) {
    if (req.user.active) {
        res.redirect('/welcome/email-activated');
    }
    else {
        res.render('pages/welcome/welcome');
    }
});

router.get('/email-activated', isLoggedIn, function (req, res) {   
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