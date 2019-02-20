import express from 'express';
import request from 'request';
import { updateUser, getUserByIdentityNumber, getUserAndUpdateByIdentityNumber } from '../models/User';
import upload from '../uploadMiddleware';
import Resize from '../Resize';
import path from 'path';

let router = express.Router();
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();


router.get('/', isLoggedIn, function (req, res) {
    request({
        url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
        method: 'GET', // specify the request type
    },
    function(error, response, body){      
        let province = JSON.parse(body).semuaprovinsi;
        let data = {};
        if(error) {
            res.json({success: false, province: null});
        } 
        else {
            
            let profile_length = req.user.profile.length
            let occupation_length = req.user.occupation.length;
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
                    // document
                    document_length: document_length,
                    identity_number: null,
                    identity_image: null,
                    identity_image_selfie: null,
                    npwp_number: null,
                    npwp_image: null,
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
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_image_selfie: null,
                        npwp_number: null,
                        npwp_image: null,
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
                        // document
                        document_length: document_length,
                        identity_number: null,
                        identity_image: null,
                        identity_image_selfie: null,
                        npwp_number: null,
                        npwp_image: null,
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
                        // document
                        document_length: document_length,
                        identity_number: req.user.document[0].identity_number,
                        identity_image: req.user.document[0].identity_image,
                        identity_image_selfie: req.user.document[0].identity_image_selfie,
                        npwp_number: req.user.document[0].npwp_number,
                        npwp_image: req.user.document[0].npwp_image,
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
                // data = {
                //     profile_length: profile_length,
                //     province: province,
                //     registration_type: req.user.profile[0].registration_type,
                //     name: req.user.profile[0].name,
                //     phone: req.user.profile[0].phone,
                //     gender: null,
                //     established_place: req.user.profile[0].established_place,
                //     company_phone: req.user.profile[0].company_phone,
                //     birth_date: req.user.profile[0].birth_date.toLocaleDateString(),
                //     province_id: req.user.profile[0].province[0].province_id,
                //     city_id: req.user.profile[0].city[0].city_id,
                //     district_id: req.user.profile[0].district[0].district_id,
                //     sub_district_id: req.user.profile[0].sub_district[0].sub_district_id,
                //     address: req.user.profile[0].address
                // };
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
            let check_phone = phoneUtil.parseAndKeepRawInput(phone, 'ID');
            let check_company_phone = phoneUtil.parseAndKeepRawInput(company_phone, 'ID');
            if (phoneUtil.isPossibleNumber(check_phone)) {
                phone = req.body.phone;
            } else {
                error_message = "Nomor Handphone Penanggung Jawab tidak valid";
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

router.post('/occupation', isLoggedIn, function (req, res) {
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
            occupation: {
                occupation: occupation,
                company_name: company_name,
                company_address: company_address,
                position: position,
                income_source: income_source,
                income: income,
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
});

router.post('/document', isLoggedIn, upload.fields([{ name: 'identity_image', maxCount: 1 }, { name: 'identity_image_selfie', maxCount: 1 }, { name: 'npwp_image', maxCount: 1 }]), async function (req, res) {
    let error_message;
    let identity_number = req.body.identity_number;
    let npwp_number = req.body.npwp_number;

    const imagePath = path.join(__dirname, '../storage/images');
    const fileUpload = new Resize(imagePath);
    
    if (npwp_number != '') {
        req.checkBody('npwp_number', 'Nomor NPWP harus mengandung 15 karakter.').isLength({ min: 15, max: 15});
    }
    req.checkBody('identity_number', 'Nomor KTP/ Paspor wajib diisi.').notEmpty();
    
    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length-1].msg;
        req.flash('error_message', error_message);
        res.redirect('/complete-profile');
        return ;
    }
    else {
        let npwp_image_filename;
        let identity_image_filename;
        let identity_image_selfie_filename;
        if (req.user.document.length == 0) {
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
                req.flash('error_message', 'Unggah Foto KTP/ Paspor wajib diisi.');
                res.redirect('/complete-profile');
                return ;
            }
    
            if (!req.files['identity_image_selfie']) {
                req.flash('error_message', 'Unggah Foto KTP/ Paspor + Selfie wajib diisi.');
                res.redirect('/complete-profile');
                return ;
            }

            identity_image_filename = await fileUpload.save(req.files['identity_image'][0].buffer);
            identity_image_selfie_filename = await fileUpload.save(req.files['identity_image_selfie'][0].buffer);
        }
        if (req.user.document.length != 0) {
            getUserAndUpdateByIdentityNumber(identity_number, function (error, user) {
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
        }
        if (req.files['identity_image']) {
            identity_image_filename = await fileUpload.save(req.files['identity_image'][0].buffer);
        }
        if (req.files['identity_image_selfie']) {
            identity_image_selfie_filename = await fileUpload.save(req.files['identity_image_selfie'][0].buffer);
        }
        if (req.files['npwp_image']) {
            npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
        }

        updateUser(req.user, {
            document: {
                identity_number: identity_number,
                identity_image: identity_image_filename,
                identity_image_selfie: identity_image_selfie_filename,
                npwp_number: npwp_number,
                npwp_image: npwp_image_filename,
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
    
    
});

router.post('/bank', isLoggedIn, function (req, res) {
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
            bank: {
                bank_name: bank_name,
                account_name: account_name,
                account_number: account_number,
                branch: branch
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
                res.redirect('/');
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

export default router;