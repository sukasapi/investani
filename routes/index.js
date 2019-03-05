import express from 'express';
import { getUserBySecretToken, updateUser } from '../models/User';
import upload from '../uploadMiddleware';
import Resize from '../Resize';
import path from 'path';


const router = express.Router();

router.get('/', isLoggedIn, function (req, res) {
    res.render('pages/index');
});

router.get('/activation/:secretToken', function(req, res) {

    let secretToken = req.params.secretToken;
    let error_message;
    getUserBySecretToken(secretToken, function (err, user) {
        if (err) {
            error_message = "Terjadi kesalahan"; 
            req.flash('error_message', error_message);
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

router.get('/contract', isLoggedIn, isInvestor, isCompleteProfile, isNotContract, function (req, res) { 
    res.render('pages/contract/contract', req.user);
});

router.post('/contract', isLoggedIn, isInvestor, isCompleteProfile, isNotContract, upload.fields([{name: 'signature', maxCount: 1}]), async function (req, res) {
    const imagePath = path.join(__dirname, '../public/images/signatures');
    const fileUpload = new Resize(imagePath);

    let success_message;
    let error_message;

    if (!req.files['signature']) {
        req.flash('error_message', ' Tanda tangan wajib diunggah.');
        res.redirect('/contract');
        return ;
    }
    let contract = await fileUpload.save(req.files['signature'][0].buffer);
    
    updateUser(req.user, {
        contract: contract.slice(0, -4)
    }, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan"; 
            return res.json({success: false, message: error_message});

        }
        if (!user) {
            error_message = "User tidak tersedia"; 
            return res.json({success: false, message: error_message});
        }
        else {
            success_message = "Berhasil menandatangani kontrak"
            return res.json({success: true, message: success_message});
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

function isInvestor(req, res, next) {    
    if (req.user.user_type[0].name == 'investor') {
        next();
    }
    else {
        res.redirect('/');
    }
}

function isCompleteProfile(req, res, next) {
    if (req.user.bank.length != 0) {
        next();
    }
    else {
        res.redirect('/');
    }
}

function isNotContract(req, res, next) {
    if (req.user.contract == '') {
        next();
    }
    else {
        res.redirect('/');
    }
}

export default router;