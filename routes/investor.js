import express from 'express';

const router = express.Router();

router.get('/dashboard', isLoggedIn, isInvestor, function (req, res) {
    res.render('pages/investor/dashboard');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/auth/login');
    }
}

function isInvestor(req, res, next) {
    if (req.user.user_type[0].name == 'investor') {
        next();
    }
    else {
        res.redirect('/');
    }
}
export default router;