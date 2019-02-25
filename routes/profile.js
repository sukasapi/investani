import express from 'express';
import request from 'request';
import { updateUser, getUserByIdentityNumber, getUserByPICIdentityNumber } from '../models/User';
import upload from '../uploadMiddleware';
import Resize from '../Resize';
import path from 'path';

const router = express.Router();

const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

router.get('/', isLoggedIn, isUncompleted, isInvestor, function (req, res) {
    request({
        url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){
        if(error) {
            res.json({success: false, province: null});
        } 
        else {
            let data = {};
            let province = JSON.parse(body).semuaprovinsi;
            let profile_length = req.user.profile.length
            let occupation_length = req.user.occupation.length;
            let pic_length = req.user.pic.length;
            let document_length = req.user.document.length;
            let bank_length = req.user.bank.length;
            // belum isi profil
            if (profile_length == 0) {
                data = {
                    profile_length: profile_length,
                    province: province,
                    profile: null,
                    registration_type: null,
                    name: null,
                    phone: null,
                    gender: null,
                    established_place: null,
                    company_phone: null,
                    birth_date: null,
                    province_id: 0,
                    city_id: 0,
                    district_id: 0,
                    sub_district_id: 0,
                    address: null,
                    // occupation
                    occupation_length: occupation_length,
                    occupation: null,
                    company_name: null,
                    company_address: null,
                    position: null,
                    income: null,
                    income_source: null,
                    // pic
                    pic_length: pic_length,
                    pic_name: null,
                    pic_birth_date: null,
                    pic_identity_number:null,
                    pic_identity_image: null,
                    pic_identity_selfie_image: null,
                    // document
                    document_length: document_length,
                    identity_number: null,
                    identity_image: null,
                    identity_selfie_image: null,
                    npwp_number: null,
                    npwp_image: null,
                    company_registration_number: null,
                    company_registration_image: null,
                    sk_kemenkumham_number: null,
                    sk_kemenkumham_image: null,
                    business_permit_image: null,
                    // bank
                    bank_length: bank_length,
                    bank_name: null,
                    account_name: null,
                    account_number: null,
                    branch: null
                };
            }
            // sudah isi profil perseorangan
            if (profile_length != 0 && req.user.profile[0].registration_type == 'individual') {
                // belum isi pekerjaan
                if (occupation_length == 0) {
                    data = {
                        // profile
                        profile_length: profile_length,
                        province: province,
                        registration_type: req.user.profile[0].registration_type,
                        name: req.user.profile[0].name,
                        phone: req.user.profile[0].phone,
                        gender: req.user.profile[0].gender,
                        established_place: null,
                        company_phone: null,
                        birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                        province_id: req.user.profile[0].province[0].province_id,
                        city_id: req.user.profile[0].city[0].city_id,
                        district_id: req.user.profile[0].district[0].district_id,
                        sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                        address: req.user.profile[0].address,
                        // occupation
                        occupation_length: occupation_length,
                        occupation: null,
                        company_name: null,
                        company_address: null,
                        position: null,
                        income: null,
                        income_source: null,
                        // pic
                        pic_length: pic_length,
                        pic_name: null,
                        pic_birth_date: null,
                        pic_identity_number:null,
                        pic_identity_image: null,
                        pic_identity_selfie_image: null,
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_selfie_image: null,
                        npwp_number: null,
                        npwp_image: null,
                        company_registration_number: null,
                        company_registration_image: null,
                        sk_kemenkumham_number: null,
                        sk_kemenkumham_image: null,
                        business_permit_image: null,
                        // bank
                        bank_length: bank_length,
                        bank_name: null,
                        account_name: null,
                        account_number: null,
                        branch: null
                    };
                }
                // sudah isi pekerjaan dan belum isi dokumen
                if (occupation_length != 0 && document_length == 0) {
                    data = {
                        profile_length: profile_length,
                        province: province,
                        registration_type: req.user.profile[0].registration_type,
                        name: req.user.profile[0].name,
                        phone: req.user.profile[0].phone,
                        gender: req.user.profile[0].gender,
                        established_place: null,
                        company_phone: null,
                        birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                        province_id: req.user.profile[0].province[0].province_id,
                        city_id: req.user.profile[0].city[0].city_id,
                        district_id: req.user.profile[0].district[0].district_id,
                        sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                        address: req.user.profile[0].address,
                        // occupation
                        occupation_length: occupation_length,
                        occupation: req.user.occupation[0].occupation,
                        company_name: req.user.occupation[0].company_name,
                        company_address: req.user.occupation[0].company_address,
                        position: req.user.occupation[0].position,
                        income: req.user.occupation[0].income,
                        income_source: req.user.occupation[0].income_source,
                        // pic
                        pic_length: pic_length,
                        pic_name: null,
                        pic_birth_date: null,
                        pic_identity_number:null,
                        pic_identity_image: null,
                        pic_identity_selfie_image: null,
                        // document
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_selfie_image: null,
                        npwp_number: null,
                        npwp_image: null,
                        company_registration_number: null,
                        company_registration_image: null,
                        sk_kemenkumham_number: null,
                        sk_kemenkumham_image: null,
                        business_permit_image: null,
                        // bank
                        bank_length: bank_length,
                        bank_name: null,
                        account_name: null,
                        account_number: null,
                        branch: null
                    };
                }
                // sudah isi pekerjaan dan dokumen
                if (occupation_length != 0 && document_length != 0) {                   
                    data = {
                        // profile
                        profile_length: profile_length,
                        province: province,
                        registration_type: req.user.profile[0].registration_type,
                        name: req.user.profile[0].name,
                        phone: req.user.profile[0].phone,
                        gender: req.user.profile[0].gender,
                        established_place: null,
                        company_phone: null,
                        birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                        province_id: req.user.profile[0].province[0].province_id,
                        city_id: req.user.profile[0].city[0].city_id,
                        district_id: req.user.profile[0].district[0].district_id,
                        sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                        address: req.user.profile[0].address,
                        // occupation
                        occupation_length: occupation_length,
                        occupation: req.user.occupation[0].occupation,
                        company_name: req.user.occupation[0].company_name,
                        company_address: req.user.occupation[0].company_address,
                        position: req.user.occupation[0].position,
                        income: req.user.occupation[0].income,
                        income_source: req.user.occupation[0].income_source,
                        // pic
                        pic_length: pic_length,
                        pic_name: null,
                        pic_birth_date: null,
                        pic_identity_number:null,
                        pic_identity_image: null,
                        pic_identity_selfie_image: null,
                        // document
                        document_length: document_length,
                        identity_number: req.user.document[0].identity_number,
                        identity_image: req.user.document[0].identity_image,
                        identity_selfie_image: req.user.document[0].identity_selfie_image,
                        npwp_number: req.user.document[0].npwp_number,
                        npwp_image: req.user.document[0].npwp_image,
                        company_registration_number: null,
                        company_registration_image: null,
                        sk_kemenkumham_number: null,
                        sk_kemenkumham_image: null,
                        business_permit_image: null,
                        // bank
                        bank_length: bank_length,
                        bank_name: null,
                        account_name: null,
                        account_number: null,
                        branch: null
                    };
                }
            }
            // sudah isi profil perusahaan
            if (req.user.profile.length != 0 && req.user.profile[0].registration_type == 'company') {
                // belum isi penanggungjawab
                if (pic_length == 0) {
                    data = {
                        // profile
                        profile_length: profile_length,
                        province: province,
                        registration_type: req.user.profile[0].registration_type,
                        province: province,
                        name: req.user.profile[0].name,
                        phone: req.user.profile[0].phone,
                        gender: null,
                        established_place: req.user.profile[0].established_place,
                        company_phone: req.user.profile[0].company_phone,
                        birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                        province_id: req.user.profile[0].province[0].province_id,
                        city_id: req.user.profile[0].city[0].city_id,
                        district_id: req.user.profile[0].district[0].district_id,
                        sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                        address: req.user.profile[0].address,
                        // occupation
                        occupation_length: occupation_length,
                        occupation: null,
                        company_name: null,
                        company_address: null,
                        position: null,
                        income: null,
                        income_source: null,
                        // pic
                        pic_length: pic_length,
                        pic_name: null,
                        pic_birth_date: null,
                        pic_identity_number:null,
                        pic_identity_image: null,
                        pic_identity_selfie_image: null,
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_selfie_image: null,
                        npwp_number: null,
                        npwp_image: null,
                        company_registration_number: null,
                        company_registration_image: null,
                        sk_kemenkumham_number: null,
                        sk_kemenkumham_image: null,
                        business_permit_image: null,
                        // bank
                        bank_length: bank_length,
                        bank_name: null,
                        account_name: null,
                        account_number: null,
                        branch: null
                    };
                }
                // sudah isi penanggungjawab dan belum isi dokumen
                if (pic_length != 0 && document_length == 0) {
                    data = {
                        // profile
                        profile_length: profile_length,
                        province: province,
                        registration_type: req.user.profile[0].registration_type,
                        province: province,
                        name: req.user.profile[0].name,
                        phone: req.user.profile[0].phone,
                        gender: null,
                        established_place: req.user.profile[0].established_place,
                        company_phone: req.user.profile[0].company_phone,
                        birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                        province_id: req.user.profile[0].province[0].province_id,
                        city_id: req.user.profile[0].city[0].city_id,
                        district_id: req.user.profile[0].district[0].district_id,
                        sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                        address: req.user.profile[0].address,
                        // occupation
                        occupation_length: occupation_length,
                        occupation: null,
                        company_name: null,
                        company_address: null,
                        position: null,
                        income: null,
                        income_source: null,
                        // pic
                        pic_length: pic_length,
                        pic_name: req.user.pic[0].pic_name,
                        pic_birth_date: req.user.pic[0].pic_birth_date.toLocaleDateString(),
                        pic_identity_number: req.user.pic[0].pic_identity_number,
                        pic_identity_image: req.user.pic[0].pic_identity_image,
                        pic_identity_selfie_image: req.user.pic[0].pic_identity_selfie_image,
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_selfie_image: null,
                        npwp_number: null,
                        npwp_image: null,
                        company_registration_number: null,
                        company_registration_image: null,
                        sk_kemenkumham_number: null,
                        sk_kemenkumham_image: null,
                        business_permit_image: null,
                        // bank
                        bank_length: bank_length,
                        bank_name: null,
                        account_name: null,
                        account_number: null,
                        branch: null
                    };
                }
                // sudah isi penanggungjawab dan sudah isi dokumen
                if (pic_length != 0 && document_length != 0) {
                    data = {
                        // profile
                        profile_length: profile_length,
                        province: province,
                        registration_type: req.user.profile[0].registration_type,
                        province: province,
                        name: req.user.profile[0].name,
                        phone: req.user.profile[0].phone,
                        gender: null,
                        established_place: req.user.profile[0].established_place,
                        company_phone: req.user.profile[0].company_phone,
                        birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                        province_id: req.user.profile[0].province[0].province_id,
                        city_id: req.user.profile[0].city[0].city_id,
                        district_id: req.user.profile[0].district[0].district_id,
                        sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                        address: req.user.profile[0].address,
                        // occupation
                        occupation_length: occupation_length,
                        occupation: null,
                        company_name: null,
                        company_address: null,
                        position: null,
                        income: null,
                        income_source: null,
                        // pic
                        pic_length: pic_length,
                        pic_name: req.user.pic[0].pic_name,
                        pic_birth_date: req.user.pic[0].pic_birth_date.toLocaleDateString(),
                        pic_identity_number: req.user.pic[0].pic_identity_number,
                        pic_identity_image: req.user.pic[0].pic_identity_image,
                        pic_identity_selfie_image: req.user.pic[0].pic_identity_selfie_image,
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_selfie_image: null,
                        npwp_number: req.user.document[0].npwp_number,
                        npwp_image: req.user.document[0].npwp_image,
                        company_registration_number: req.user.document[0].company_registration_number,
                        company_registration_image: req.user.document[0].company_registration_image,
                        sk_kemenkumham_number: req.user.document[0].sk_kemenkumham_number,
                        sk_kemenkumham_image: req.user.document[0].sk_kemenkumham_image,
                        business_permit_image: req.user.document[0].business_permit_image,
                        // bank
                        bank_length: bank_length,
                        bank_name: null,
                        account_name: null,
                        account_number: null,
                        branch: null
                    };
                }
            }
            res.render('pages/profile/complete-profile', data);
        }
    });
});

router.get('/get-city', isLoggedIn, function (req, res) {
    request({
        url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/${req.query.province_id}/kabupaten`, //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){
        let city = JSON.parse(body).kabupatens;        
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
        let district = JSON.parse(body).kecamatans;
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
        let sub_district = JSON.parse(body).desas;
        if(error) {
            res.json({success: false, sub_district: null});
        } else {
        res.json({success: true, sub_district: sub_district});
        }
    });
});

router.post('/', isLoggedIn, isUncompleted, isInvestor, function (req, res) {   
    let error_message;
    let registration_type = req.body.registration_type;
    let name = req.body.name;
    let phone = req.body.phone;
    let birth_date = req.body.birth_date;
    let province = {
        province_id: req.body.province,
        province_name: req.body.province_name
    };
    let city = {
        city_id : req.body.city,
        city_name : req.body.city_name
    }
    let district = {
        district_id : req.body.district,
        district_name : req.body.district_name
    }
    let sub_district = {
        sub_district_id : req.body.sub_district,
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
                profile: [{
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
                }]
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
            let check_phone = phoneUtil.parseAndKeepRawInput(phone, 'ID');
            let check_company_phone = phoneUtil.parseAndKeepRawInput(company_phone, 'ID');
            if (phoneUtil.isPossibleNumber(check_phone)) {
                phone = req.body.phone;
            } else {
                error_message = "Nomor Handphone Penanggungjawab tidak valid";
                req.flash('error_message', error_message);
                res.redirect('/complete-profile');
                return ;
            }
            if (phoneUtil.isPossibleNumber(check_company_phone)) {
                company_phone = req.body.company_phone;
            } else {
                error_message = "Nomor Telepon Perusahaan tidak valid";
                req.flash('error_message', error_message);
                res.redirect('/complete-profile');
                return ;
            }

            updateUser(req.user, {
                profile: [{
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
                }],
                occupation: [],
                pic: [],
                document: [],
                bank: []
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

router.post('/occupation', isLoggedIn, isUncompleted, isInvestor, function (req, res) {
    let error_message;
    let occupation = req.body.occupation;
    let company_name = req.body.company_name;
    let company_address = req.body.company_address;
    let position = req.body.position;
    let income_source = req.body.income_source;
    let income = req.body.income;
    
    req.checkBody('income', 'Penghasilan per Bulan wajib dipilih').notEmpty();
    req.checkBody('income_source', 'Sumber Dana wajib dipilih').notEmpty();
    req.checkBody('company_address', 'Alamat Perusahaan tidak boleh lebih dari 250 karakter').isLength({ max: 250 });
    req.checkBody('company_name', 'Nama Perusahaan tidak boleh lebih dari 255 karakter').isLength({ max: 255 });
    req.checkBody('occupation', 'Pekerjaan wajib dipilih').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/complete-profile');
        return ;
    }
    else {
        updateUser(req.user, {
            occupation: [{
                occupation: occupation,
                company_name: company_name,
                company_address: company_address,
                position: position,
                income_source: income_source,
                income: income,
            }],
            pic: [],
            document: [],
            bank: []
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
});

router.post('/pic', isLoggedIn, isUncompleted, isInvestor, upload.fields([{name: 'pic_identity_image', maxCount: 1}, { name: 'pic_identity_selfie_image', maxCount: 1 }]), async function (req, res) {
    let error_message;
    let pic_name = req.body.pic_name;
    let pic_birth_date = req.body.pic_birth_date;
    let pic_identity_number = req.body.pic_identity_number;

    const imagePath = path.join(__dirname, '../storage/images');
    const fileUpload = new Resize(imagePath);

    req.checkBody('pic_identity_number', 'Nomor KTP/ Paspor Penanggungjawab wajib diisi.').notEmpty();
    req.checkBody('pic_birth_date', 'Tanggal Lahir Penanggungjawab wajib diisi.').notEmpty();
    req.checkBody('pic_name', 'Nama Penanggungjawab tidak boleh lebih dari 255 karakter.').isLength({ max: 255 });
    req.checkBody('pic_name', 'Nama Penanggungjawab minimal mengandung 3 karakter.').isLength({ min: 3 });
    req.checkBody('pic_name', 'Nama Penanggungjawab wajib diisi').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/complete-profile');
        return ;
    }
    else {
        let pic_identity_image_filename = req.body.pic_identity_image_input;
        let pic_identity_selfie_image_filename = req.body.pic_identity_selfie_image_input;

        if (req.user.pic.length == 0) {
            getUserByPICIdentityNumber(pic_identity_number, function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan"; 
                    req.flash('error_message', error_message);
                    res.redirect('/complete-profile');
                    return ;
                }
                if (user) {
                    error_message = "Nomor KTP/ Paspor sudah terdaftar"; 
                    req.flash('error_message', error_message);
                    res.redirect('/complete-profile');
                    return ;
                }
            });

            if (!req.files['pic_identity_image']) {
                req.flash('error_message', 'Unggah Foto KTP/ Paspor wajib diisi.');
                res.redirect('/complete-profile');
                return ;
            }
    
            if (!req.files['pic_identity_selfie_image']) {
                req.flash('error_message', 'Unggah Foto KTP/ Paspor + Selfie wajib diisi.');
                res.redirect('/complete-profile');
                return ;
            }

            pic_identity_image_filename = await fileUpload.save(req.files['pic_identity_image'][0].buffer);
            pic_identity_selfie_image_filename = await fileUpload.save(req.files['pic_identity_selfie_image'][0].buffer);
        }
        if (req.user.pic.length != 0) {
            getUserByPICIdentityNumber(identity_number, function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan"; 
                    req.flash('error_message', error_message);
                    res.redirect('/complete-profile');
                    return ;
                }
                if (user) {
                    if (user._id != req.user._id) {
                        error_message = "Nomor KTP/ Paspor sudah terdaftar"; 
                        req.flash('error_message', error_message);
                        res.redirect('/complete-profile');
                        return ;
                    }
                }


            });

            if (req.files['pic_identity_image']) {
                pic_identity_image_filename = await fileUpload.save(req.files['pic_identity_image'][0].buffer);
            }
            if (req.files['pic_identity_selfie_image']) {
                pic_identity_selfie_image_filename = await fileUpload.save(req.files['pic_identity_selfie_image'][0].buffer);
            }
        }

        updateUser(req.user, {
            pic: [{
                pic_name: pic_name,
                pic_birth_date: pic_birth_date,
                pic_identity_number: pic_identity_number,
                pic_identity_image: pic_identity_image_filename,
                pic_identity_selfie_image: pic_identity_selfie_image_filename
            }],
            occupation: [],
            document: [],
            bank: []
        }, function (error, user) {
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
});

router.post('/document', isLoggedIn, isUncompleted, isInvestor, upload.fields([
    { name: 'identity_image', maxCount: 1 }, 
    { name: 'identity_selfie_image', maxCount: 1 }, 
    { name: 'npwp_image', maxCount: 1 }, 
    { name: 'company_registration_image', maxCount: 1},
    { name: 'sk_kemenkumham_image', maxCount: 1},
    { name: 'business_permit_image', maxCount: 1}
]), 
async function (req, res) {   
    let error_message;
    let identity_number = req.body.identity_number;
    let npwp_number = req.body.npwp_number;
    let company_registration_number = req.body.company_registration_number;
    let sk_kemenkumham_number = req.body.sk_kemenkumham_number;

    const imagePath = path.join(__dirname, '../storage/images');
    const fileUpload = new Resize(imagePath);

    if (req.user.profile[0].registration_type == 'individual') {
        if (npwp_number != '') {
            req.checkBody('npwp_number', 'Nomor NPWP harus mengandung 15 karakter.').isLength({ min: 15, max: 15});
        }
        req.checkBody('identity_number', 'Nomor KTP/ Paspor wajib diisi.').notEmpty();
    }
    if (req.user.profile[0].registration_type == 'company') {
        req.checkBody('sk_kemenkumham_number', 'Nomor SK KEMENKUMHAM wajib diisi').notEmpty();
        req.checkBody('npwp_number', 'Nomor NPWP Perusahaan harus mengandung 15 karakter.').isLength({ min: 15, max: 15});
        req.checkBody('npwp_number', 'Nomor NPWP Perusahaan wajib diisi').notEmpty();
        req.checkBody('company_registration_number', 'Nomor Tanda Daftar Perusahaan wajib diisi').notEmpty();
    }

    let errors = req.validationErrors();
    
    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/complete-profile');
        return ;
    }
    else {
        let npwp_image_filename = req.body.npwp_image_input;
        let identity_image_filename = req.body.identity_image_input;
        let identity_selfie_image_filename = req.body.identity_selfie_image_input;
        let company_registration_image_filename = req.body.company_registration_image_input;
        let sk_kemenkumham_image_filename = req.body.sk_kemenkumham_image_input;
        let business_permit_image_filename = req.body.business_permit_image_input;

        if (req.user.document.length == 0 ) {
            if (req.user.profile[0].registration_type == 'individual') {
                identity_number = req.body.identity_number;

                getUserByIdentityNumber(identity_number, function (error, user) {
                    if (error) {
                        error_message = "Terjadi kesalahan"; 
                        req.flash('error_message', error_message);
                        res.redirect('/complete-profile');
                        return ;
                    }
                    if (user) {
                        error_message = "Nomor KTP/ Paspor sudah terdaftar"; 
                        req.flash('error_message', error_message);
                        res.redirect('/complete-profile');
                        return ;
                    }
                });

                if (!req.files['identity_image']) {
                    req.flash('error_message', 'Foto KTP/ Paspor wajib diunggah.');
                    res.redirect('/complete-profile');
                    return ;
                }
        
                if (!req.files['identity_selfie_image']) {
                    req.flash('error_message', 'Foto KTP/ Paspor + Selfie wajib diunggah.');
                    res.redirect('/complete-profile');
                    return ;
                }
    
                identity_image_filename = await fileUpload.save(req.files['identity_image'][0].buffer);
                identity_selfie_image_filename = await fileUpload.save(req.files['identity_selfie_image'][0].buffer);
                
                if (req.files['npwp_image']) {
                    npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                }
            }
            if (req.user.profile[0].registration_type == 'company') {
                if (!req.files['company_registration_image']) {
                    req.flash('error_message', 'Tanda Daftar Perusahaan wajib diunggah.');
                    res.redirect('/complete-profile');
                    return ;
                }
                if (!req.files['npwp_image']) {
                    req.flash('error_message', 'NPWP Perusahaan wajib diunggah.');
                    res.redirect('/complete-profile');
                    return ;
                }
                if (!req.files['sk_kemenkumham_image']) {
                    req.flash('error_message', 'SK KEMENKUMHAM wajib diunggah.');
                    res.redirect('/complete-profile');
                    return ;
                }

                company_registration_image_filename = await fileUpload.save(req.files['company_registration_image'][0].buffer);
                npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                sk_kemenkumham_image_filename = await fileUpload.save(req.files['sk_kemenkumham_image'][0].buffer);
                
                if (req.files['business_permit_image']) {
                    business_permit_image_filename = await fileUpload.save(req.files['business_permit_image'][0].buffer);
                }
            }
        }
        if (req.user.document.length != 0) {                        
            if (req.user.profile[0].registration_type == 'individual') {               
                getUserByIdentityNumber(identity_number, function (error, user) {
                    if (error) {
                        error_message = "Terjadi kesalahan"; 
                        req.flash('error_message', error_message);
                        res.redirect('/complete-profile');
                        return ;
                    }
                    if (user) {
                        if (!user._id.equals(req.user._id)) {
                            error_message = "Nomor KTP/ Paspor sudah terdaftar"; 
                            req.flash('error_message', error_message);
                            res.redirect('/complete-profile');
                            return ;
                        }
                    }
                });                
                if (req.files['identity_image']) {                    
                    identity_image_filename = await fileUpload.save(req.files['identity_image'][0].buffer);
                }
                if (req.files['identity_selfie_image']) {
                    identity_selfie_image_filename = await fileUpload.save(req.files['identity_selfie_image'][0].buffer);
                }
                if (req.files['npwp_image']) {
                    npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                }
            }
            if (req.user.profile[0].registration_type == 'company') {
                if (req.files['company_registration_image']) {
                    company_registration_image_filename = await fileUpload.save(req.files['company_registration_image'][0].buffer);
                }
                if (req.files['npwp_image']) {
                    npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                }
                if (req.files['sk_kemenkumham_image']) {
                    sk_kemenkumham_image_filename = await fileUpload.save(req.files['sk_kemenkumham_image'][0].buffer);
                }
                if (req.files['business_permit_image']) {
                    business_permit_image_filename = await fileUpload.save(req.files['business_permit_image'][0].buffer);
                }
            }
        }
        console.log('update');
        
        updateUser(req.user, {
            document: [{
                identity_number: identity_number,
                identity_image: identity_image_filename,
                identity_selfie_image: identity_selfie_image_filename,
                company_registration_number: company_registration_number,
                company_registration_image: company_registration_image_filename,
                sk_kemenkumham_number: sk_kemenkumham_number,
                sk_kemenkumham_image: sk_kemenkumham_image_filename,
                npwp_number: npwp_number,
                npwp_image: npwp_image_filename,
                business_permit_image: business_permit_image_filename
            }],
            bank: []
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
});

router.post('/bank', isLoggedIn, isUncompleted, isInvestor, function (req, res) {
    let error_message;
    let bank_name = req.body.bank_name;
    let account_name = req.body.account_name;
    let account_number = req.body.account_number;
    let branch = req.body.branch;
    
    req.checkBody('branch', 'Cabang tidak boleh lebih dari 50 karakter.').isLength({ max: 50 });
    req.checkBody('branch', 'Cabang minimal mengandung 3 karakter.').isLength({ min: 3 });
    req.checkBody('branch', 'Cabang wajib diisi.').notEmpty();
    req.checkBody('account_name', 'Nomor Rekening tidak boleh lebih dari 50 karakter.').isLength({ max: 50 });
    req.checkBody('account_number', 'Nomor Rekening minimal mengandung 3 karakter.').isLength({ min: 3 });
    req.checkBody('account_number', 'Nomor Rekening wajib diisi.').notEmpty();
    req.checkBody('account_name', 'Nama Pemilik Rekening tidak boleh lebih dari 50 karakter.').isLength({ max: 50 });
    req.checkBody('account_name', 'Nama Pemilik Rekening minimal mengandung 3 karakter.').isLength({ min: 3 });
    req.checkBody('account_name', 'Nama Pemilik Rekening wajib diisi.').notEmpty();
    req.checkBody('bank_name', 'Nama Bank wajib dipilih.').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/complete-profile');
        return ;
    }
    else {
        updateUser(req.user, {
            bank: [{
                bank_name: bank_name,
                account_name: account_name,
                account_number: account_number,
                branch: branch
            }]
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
                res.redirect('/contract');
                return ;
            }
        });
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

function isUncompleted(req,res, next) {
    if (req.user.profile.length == 0 || req.user.occupation.length == 0 || req.user.pic.length == 0 || req.user.document.length == 0 || req.user.bank.length == 0) {
        next();
    }
    else {
        if (req.user.profile[0].registration_type == 'individual') {
            if (req.user.profile.length == 0 || req.user.occupation.length == 0 || req.user.document.length == 0 || req.user.bank.length == 0) {
                next();
            }
            else {
                res.redirect('/');
            }
        }
        else {
            if (req.user.profile.length == 0 || req.user.pic.length == 0 || req.user.document.length == 0 || req.user.bank.length == 0) {
                next();
            }
            else {
                res.redirect('/');
            }
        }
    }
}

function isInvestor(req, res, next) {
    if (req.user.user_type[0].name = 'investor') {
        next();
    }
    else {
        res.redirect('/');
    }
}

export default router;