import express from 'express';
import nodemailer from 'nodemailer';

let router = express.Router();

// Route for email page
router.get('/', isLoggedIn, function (req, res) {
    res.render('pages/email');
});
// Route for post request
router.post('/send-email', isLoggedIn, function (req, res) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'sisteminformasiua15@gmail.com',
            pass: '15siadmin'
        }
    });
    let mailOptions = {
        from: '"Simolas" <sisteminformasiua15@gmail.com>',
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.body,
        html: '<b>NodeJS Email Tutorial</b>'
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        res.render('pages/email');
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

export default router;