import express from 'express';
import request from 'request';
import { updateUser } from '../models/User';

let router = express.Router();
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();


router.get('/', isLoggedIn, function (req, res) {
    request({
        url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
        method: 'GET', // specify the request type
    }, 
    function(error, response, body){
        let province = JSON.parse(body).semuaprovinsi;
        if(error) {
            res.json({success: false, province: null});
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
    let error_message;
    let registration_type = req.body.registration_type;
    let name = req.body.name;
    let phone = req.body.phone;
    let birth_date = req.body.birth_date;
    let province = {
        province_id: req.body.province_id,
        province_name: req.body.province_name
    };
    let city = {
        city_id : req.body.city_id,
        city_name : req.body.city_name
    }
    let district = {
        district_id : req.body.district_id,
        district_name : req.body.district_name
    }
    let sub_district = {
        sub_district_id : req.body.sub_district_id,
        sub_district_name : req.body.sub_district_name
    }
    let address = req.body.address; 

    let gender = req.body.gender;

    let established_place = req.body.established_place;
    let company_phone = req.body.company_phone;

    req.checkBody('address', 'Alamat Korespondensi tidak boleh lebih dari 250 karakter.').isLength({ max: 250 });
    req.checkBody('address', 'Alamat Korespondensi minimal mengandung 10 karakter.').isLength({ min: 10 });
    req.checkBody('address', 'Alamat Korespondensi wajib diisi.').notEmpty();
    req.checkBody('sub_district', 'Kelurahan wajib dipilih.').notEmpty();
    req.checkBody('district', 'Kecamatan wajib dipilih.').notEmpty();
    req.checkBody('city', 'Kota wajib dipilih.').notEmpty();
    req.checkBody('province', 'Provinsi wajib dipilih.').notEmpty();
    req.checkBody('phone', 'Nomor Handphone tidak boleh lebih dari 15 karakter.').isLength({ max: 15 });
    req.checkBody('phone', 'Nomor Handphone minimal mengandung 5 karakter.').isLength({ min: 5 });
    req.checkBody('phone', 'Nomor Handphone wajib diisi.').notEmpty();
    req.checkBody('name', 'Nama Lengkap tidak boleh lebih dari 255 karakter.').isLength({ max: 255 });
    req.checkBody('name', 'Nama Lengkap minimal mengandung 3 karakter.').isLength({ min: 3 });
    req.checkBody('name', 'Nama Lengkap wajib diisi.').notEmpty();
    req.checkBody('registration_type', 'Tipe Pendaftaran wajib dipilih.').notEmpty();

    if (registration_type == 'individual') {
        req.checkBody('gender', 'Jenis Kelamin wajib dipilih.').notEmpty();
        req.checkBody('birth_date', 'Tanggal Lahir wajib diisi.').notEmpty();
    }
    else {
        registration_type = 'company';
        req.checkBody('company_phone', 'Nomor Telepon tidak boleh lebih dari 15 karakter.').isLength({ max: 15 });
        req.checkBody('company_phone', 'Nomor Telepon minimal mengandung 5 karakter.').isLength({ min: 5 });
        req.checkBody('company_phone', 'Nomor Telepon wajib diisi.').notEmpty();
        req.checkBody('birth_date', 'Tanggal Berdiri wajib diisi.').notEmpty();
        req.checkBody('established_place', 'Tempat Didirikan tidak boleh lebih dari 255 karakter.').isLength({ max: 255 });
        req.checkBody('established_place', 'Tempat Didirikan minimal mengandung 3 karakter.').isLength({ min: 3 });
        req.checkBody('established_place', 'Tempat Didirikan wajib diisi.').notEmpty();
    }

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/complete-profile');
        return ;
    }
    else {
        if(gender != 'male') {
            gender = 'female';
        }
        if (registration_type == 'individual') {
            let check_phone = phoneUtil.parseAndKeepRawInput(phone, 'ID');

            if (phoneUtil.isPossibleNumber(check_phone)) {
                phone = req.body.phone;
            } else {
                error_message = "Nomor Handphone tidak valid";
                req.flash('error_message', error_message);
                res.redirect('/complete-profile');
                return ;
            }

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
        }
        else {
            let check_company_phone = phoneUtil.parseAndKeepRawInput(company_phone, 'ID');

            if (phoneUtil.isPossibleNumber(check_company_phone)) {
                company_phone = req.body.phone;
            } else {
                error_message = "Nomor Handphone tidak valid";
                req.flash('error_message', error_message);
                res.redirect('/complete-profile');
                return ;
            }

            updateUser(req.user, {
                profile: {
                    registration_type: registration_type,
                    name: name,
                    phone: phone,
                    established_place: established_place,
                    company_phone: company_phone,
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
        }
        
        
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