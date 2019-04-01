import express from 'express';

const router = express.Router();

router.get('/dashboard', isLoggedIn, isInvestor, function (req, res) {
    let data = {
        user_id: req.user._id,
        url: "dashboard"
    }
    res.render('pages/investor/dashboard', data);
});

router.get('/:user_id/backed-project', isLoggedIn, isInvestor, function (req, res) {
    let data = {
        user_id: req.user._id,
        url: "backed-project"
    }
    res.render('pages/investor/backed-project', data);
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