import express from 'express';
import request from 'request';
import { createProject } from '../models/Project';

const router = express.Router();

router.get('/dashboard', isLoggedIn, isInisiator, function (req, res) {
    request({
        url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){
        if(error) {
            res.json({success: false, province: null});
        } 
        else {
            let province = JSON.parse(body).semuaprovinsi;
            res.render('pages/inisiator/dashboard', { province: province });
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

function isInisiator(req, res, next) {
    if (req.user.user_type[0].name == 'inisiator') {
        next();
    }
    else {
        res.redirect('/');
    }
}

export default router;