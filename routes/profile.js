import express from 'express';
import request from 'request';
import { User, updateUser } from '../models/User';

let router = express.Router();

router.get('/', isLoggedIn, function (req, res) {
    request({
        url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
        method: 'GET', // specify the request type
    }, 
    function(error, response, body){
        let province = JSON.parse(body).semuaprovinsi;
        if(error) {
            console.log(error);
        } else {
            res.render('pages/profile/complete-profile', { province: province });
        }
    });
});

router.get('/get-city', isLoggedIn, function (req, res) {  
    request({
        url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/${req.query.province_id}/kabupaten`, //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){
        let city = JSON.parse(body).daftar_kecamatan;
        if(error) {
            res.json({success: false, city: null});
        } else {
        res.json({success: true, city: city});
        }
    });
});

router.get('/get-district', isLoggedIn, function (req, res) {  
    request({
        url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/kabupaten/${req.query.city_id}/kecamatan`, //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){
        let district = JSON.parse(body).daftar_kecamatan;
        if(error) {
            console.log(error);
            res.json({success: false, district: null});
        } else {
        res.json({success: true, district: district});
        }
    });
});

router.get('/get-sub_district', isLoggedIn, function (req, res) {  
    request({
        url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/kabupaten/kecamatan/${req.query.district_id}/desa`, //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){
        let sub_district = JSON.parse(body).daftar_desa;
        if(error) {
            res.json({success: false, sub_district: null});
        } else {
        res.json({success: true, sub_district: sub_district});
        }
    });
});

router.post('/', isLoggedIn, function (req, res) {
    let registration_type = req.body.registration_type;
    let name = req.body.name;
    let phone = req.body.phone;
    let gender = req.body.gender;
    let birth_date = req.body.birth_date;
    let province = req.body.province;
    let city = req.body.city;
    let district = req.body.district;
    let sub_district = req.body.sub_district;
    let address = req.body.address;
    
    req.checkBody('registration_type', );

    updateUser(req.user, {
        profile: {
            registration_type: registration_type,
            name: name,
            phone: phone,
            gender: gender,
            birth_date: birth_date,
            province: province,
            city: city,
            district: district,
            sub_district: sub_district,
            address: address
        }
    }, 
    function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan"; 
            req.flash('error_message', error_message);
            res.redirect('/complete-profile');
            return ;
        }
        if (!user) {
            error_message = "User tidak tersedia"; 
            req.flash('error_message', error_message);
            res.redirect('/complete-profile');
            return ;
        }
        else {    
            res.redirect('/complete-profile');
            return ;
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

export default router;