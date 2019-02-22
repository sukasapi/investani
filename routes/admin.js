import express from 'express';

const router = express.Router();

router.get('/', isLoggedIn, isAdmin, function (req, res) {
    console.log('admin')
    res.render('pages/admin/dashboard');
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