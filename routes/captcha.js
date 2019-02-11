import express from 'express';
// HTTP request package
import request from 'request';

let router = express.Router();

// Access recaptcha page
router.get('/', isLoggedIn, function (req, res) {
    res.render('pages/captcha');
});
// Handle response
router.post('/', isLoggedIn, function (req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        return res.json({
            "responseError": "Please select captcha first"
        });
    }
    const secretKey = "6LdxdY8UAAAAAL6dntB-bAnq7yvnVSwIRfKsvxns";
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

    request(verificationURL, function (error, response, body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            return res.json({
                "responseError": "Failed captcha verification"
            });
        }
        res.json({
            "responseSuccess": "Success"
        });
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