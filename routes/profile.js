import express from 'express';
import request from 'request';
import {
    updateUser,
    getUserByIdentityNumber,
    getUserByPICIdentityNumber
} from '../models/User';
import upload from '../uploadMiddleware';
import Resize from '../Resize';
import path from 'path';
import fs from 'fs';
import expressValidator from 'express-validator';

const router = express.Router();
router.use(expressValidator({
    customValidators: {
        isImage: function (value, filename) {
            if (filename) {
                var extension = (path.extname(filename)).toLowerCase();
                switch (extension) {
                    case '.jpg':
                        return '.jpg';
                    case '.jpeg':
                        return '.jpeg';
                    case '.png':
                        return '.png';
                    default:
                        return false;
                }
            }
            else {
                return true;
            }
            
        }
    }
}));

const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

router.get('/', isLoggedIn, isNoContract, isUser, function (req, res) {
    request({
            url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
            method: 'GET', // specify the request type
        },
        function (error, response, body) {
            if (error) {
                res.json({
                    success: false,
                    province: null
                });
            } else {
                let profile_length = req.user.profile.length
                let occupation_length = req.user.occupation.length;
                let pic_length = req.user.pic.length;
                let document_length = req.user.document.length;
                let bank_length = req.user.bank.length;
                let province = JSON.parse(body).semuaprovinsi;
                let registration_type = null;
                let name = null;
                let phone = null;
                let gender = null;
                let established_place = null;
                let company_phone = null;
                let birth_date = null;
                let province_id = 0;
                let province_name = null;
                let city_id = 0;
                let city_name = null;
                let district_id = 0;
                let district_name = null;
                let sub_district_id = 0;
                let sub_district_name = null;
                let address = null;
                // occupation
                let occupation = null;
                let company_name = null;
                let company_address = null;
                let position = null;
                let income = null;
                let income_source = null;
                // pic
                let pic_name = null;
                let pic_birth_date = null;
                let pic_identity_number = null;
                let pic_identity_image = null;
                let pic_identity_selfie_image = null;
                // document
                let identity_number = null;
                let identity_image = null;
                let identity_selfie_image = null;
                let npwp_number = null;
                let npwp_image = null;
                let company_registration_number = null;
                let company_registration_image = null;
                let sk_kemenkumham_number = null;
                let sk_kemenkumham_image = null;
                let business_permit_image = null;
                // bank
                let bank_name = null;
                let account_name = null;
                let account_number = null;
                let branch = null;

                // sudah isi profil perseorangan
                if (profile_length != 0) {
                    registration_type = req.user.profile[0].registration_type;
                    name = req.user.profile[0].name;
                    phone = req.user.profile[0].phone;
                    birth_date = req.user.profile[0].birth_date.toLocaleDateString();
                    province_id = req.user.profile[0].province[0].province_id;
                    province_name = req.user.profile[0].province[0].province_name;
                    city_id = req.user.profile[0].city[0].city_id;
                    city_name = req.user.profile[0].city[0].city_name;
                    district_id = req.user.profile[0].district[0].district_id;
                    district_name = req.user.profile[0].district[0].district_name;
                    sub_district_id = req.user.profile[0].sub_district[0].sub_district_id;
                    sub_district_name = req.user.profile[0].sub_district[0].sub_district_name;
                    address = req.user.profile[0].address;
                    if (req.user.profile[0].registration_type == 'individual') {
                        gender = req.user.profile[0].gender;
                        // sudah isi pekerjaan dan belum isi dokumen
                        if (occupation_length != 0) {
                            occupation = req.user.occupation[0].occupation;
                            company_name = req.user.occupation[0].company_name;
                            company_address = req.user.occupation[0].company_address;
                            position = req.user.occupation[0].position;
                            income = req.user.occupation[0].income;
                            income_source = req.user.occupation[0].income_source;
                            if (document_length != 0) {
                                document_length = document_length;
                                identity_number = req.user.document[0].identity_number;
                                identity_image = req.user.document[0].identity_image;
                                identity_selfie_image = req.user.document[0].identity_selfie_image;
                                npwp_number = req.user.document[0].npwp_number;
                                npwp_image = req.user.document[0].npwp_image;
                            }
                        }
                    }
                    if (req.user.profile[0].registration_type == 'company') {
                        established_place = req.user.profile[0].established_place;
                        company_phone = req.user.profile[0].company_phone;
                        if (pic_length != 0) {
                            pic_name = req.user.pic[0].pic_name;
                            pic_birth_date = req.user.pic[0].pic_birth_date.toLocaleDateString();
                            pic_identity_number = req.user.pic[0].pic_identity_number;
                            pic_identity_image = req.user.pic[0].pic_identity_image;
                            pic_identity_selfie_image = req.user.pic[0].pic_identity_selfie_image;
                            if (document_length != 0) {
                                npwp_number = req.user.document[0].npwp_number;
                                npwp_image = req.user.document[0].npwp_image;
                                company_registration_number = req.user.document[0].company_registration_number;
                                company_registration_image = req.user.document[0].company_registration_image;
                                sk_kemenkumham_number = req.user.document[0].sk_kemenkumham_number;
                                sk_kemenkumham_image = req.user.document[0].sk_kemenkumham_image;
                                business_permit_image = req.user.document[0].business_permit_image;
                            }
                        }
                    }
                    if (bank_length != 0) {
                        bank_name = req.user.bank[0].bank_name;
                        account_name = req.user.bank[0].account_name;
                        account_number = req.user.bank[0].account_number;
                        branch = req.user.bank[0].branch;
                    }

                }
                let data = {
                    user_type: req.user.user_type[0].name,
                    profile_length: profile_length,
                    province: province,
                    province_name: province_name,
                    city_name: city_name,
                    district_name: district_name,
                    sub_district_name: sub_district_name,
                    registration_type: registration_type,
                    name: name,
                    phone: phone,
                    gender: gender,
                    established_place: established_place,
                    company_phone: company_phone,
                    birth_date: birth_date,
                    province_id: province_id,
                    city_id: city_id,
                    district_id: district_id,
                    sub_district_id: sub_district_id,
                    address: address,
                    // occupation
                    occupation_length: occupation_length,
                    occupation: occupation,
                    company_name: company_name,
                    company_address: company_address,
                    position: position,
                    income: income,
                    income_source: income_source,
                    // pic
                    pic_length: pic_length,
                    pic_name: pic_name,
                    pic_birth_date: pic_birth_date,
                    pic_identity_number: pic_identity_number,
                    pic_identity_image: pic_identity_image,
                    pic_identity_selfie_image: pic_identity_selfie_image,
                    // document
                    document_length: document_length,
                    identity_number: identity_number,
                    identity_image: identity_image,
                    identity_selfie_image: identity_selfie_image,
                    npwp_number: npwp_number,
                    npwp_image: npwp_image,
                    company_registration_number: company_registration_number,
                    company_registration_image: company_registration_image,
                    sk_kemenkumham_number: sk_kemenkumham_number,
                    sk_kemenkumham_image: sk_kemenkumham_image,
                    business_permit_image: business_permit_image,
                    // bank
                    bank_length: bank_length,
                    bank_name: bank_name,
                    account_name: account_name,
                    account_number: account_number,
                    branch: branch
                };
                res.render('pages/profile/complete-profile', data);
            }
        });
});

router.get('/get-city', isLoggedIn, function (req, res) {
    request({
            url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/${req.query.province_id}/kabupaten`, //URL to hit
            method: 'GET', // specify the request type
        },
        function (error, response, body) {
            let city = JSON.parse(body).kabupatens;
            if (error) {
                res.json({
                    success: false,
                    city: null
                });
            } else {
                res.json({
                    success: true,
                    city: city
                });
            }
        });
});

router.get('/get-district', isLoggedIn, function (req, res) {
    request({
            url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/kabupaten/${req.query.city_id}/kecamatan`, //URL to hit
            method: 'GET', // specify the request type
        },
        function (error, response, body) {
            let district = JSON.parse(body).kecamatans;
            if (error) {
                res.json({
                    success: false,
                    district: null
                });
            } else {
                res.json({
                    success: true,
                    district: district
                });
            }
        });
});

router.get('/get-sub_district', isLoggedIn, function (req, res) {
    request({
            url: `http://dev.farizdotid.com/api/daerahindonesia/provinsi/kabupaten/kecamatan/${req.query.district_id}/desa`, //URL to hit
            method: 'GET', // specify the request type
        },
        function (error, response, body) {
            let sub_district = JSON.parse(body).desas;
            if (error) {
                res.json({
                    success: false,
                    sub_district: null
                });
            } else {
                res.json({
                    success: true,
                    sub_district: sub_district
                });
            }
        });
});

router.post('/', isLoggedIn, isNoContract, isUser, function (req, res) {
    let error_message;
    let success_message;
    let registration_type = req.body.registration_type;
    let name = req.body.name;
    let phone = req.body.phone;
    let birth_date = req.body.birth_date;
    let province = {
        province_id: req.body.province,
        province_name: req.body.province_name
    };
    let city = {
        city_id: req.body.city,
        city_name: req.body.city_name
    }
    let district = {
        district_id: req.body.district,
        district_name: req.body.district_name
    }
    let sub_district = {
        sub_district_id: req.body.sub_district,
        sub_district_name: req.body.sub_district_name
    }
    let address = req.body.address;
    let gender = req.body.gender;
    let established_place = req.body.established_place;
    let company_phone = req.body.company_phone;
    let request = {
        'registration_type': registration_type,
        'name': name,
        'phone': phone,
        'birth_date': birth_date,
        'province': province,
        'city': city,
        'district': district,
        'sub_district': sub_district,
        'address': address,
        'gender': gender,
        'established_place': established_place,
        'company_phone': company_phone,

        'occupation': "",
        'company_name': "",
        'company_address': "",
        'position': "",
        'income_source': "",
        'income': "",

        'pic_name': "",
        'pic_birth_date': "",
        'pic_identity_number': "",

        'company_registration_number': "",
        'npwp_number': "",
        'sk_kemenkumham_number': "",
        'identity_number': "",
        'npwp_number': "",

        'bank_name': "",
        'account_name': "",
        'account_number': "",
        'branch': ""
    }

    req.checkBody('address', 'Alamat Korespondensi tidak boleh lebih dari 250 karakter.').isLength({
        max: 250
    });
    req.checkBody('address', 'Alamat Korespondensi minimal mengandung 10 karakter.').isLength({
        min: 10
    });
    req.checkBody('address', 'Alamat Korespondensi wajib diisi.').notEmpty();
    req.checkBody('sub_district', 'Kelurahan wajib dipilih.').notEmpty();
    req.checkBody('district', 'Kecamatan wajib dipilih.').notEmpty();
    req.checkBody('city', 'Kota wajib dipilih.').notEmpty();
    req.checkBody('province', 'Provinsi wajib dipilih.').notEmpty();
    if (req.user.user_type[0].name == 'inisiator'|| registration_type == 'individual') {
        req.checkBody('birth_date', 'Tanggal Lahir wajib diisi.').notEmpty();
        req.checkBody('gender', 'Jenis Kelamin wajib dipilih.').notEmpty();
    } else if (req.user.user_type[0].name == 'investor' && registration_type == 'company') {
        registration_type = 'company';
        req.checkBody('company_phone', 'Nomor Telepon tidak boleh lebih dari 15 karakter.').isLength({
            max: 15
        });
        req.checkBody('company_phone', 'Nomor Telepon minimal mengandung 5 karakter.').isLength({
            min: 5
        });
        req.checkBody('company_phone', 'Nomor Telepon wajib diisi.').notEmpty();
        req.checkBody('birth_date', 'Tanggal Berdiri wajib diisi.').notEmpty();
        req.checkBody('established_place', 'Tempat Didirikan tidak boleh lebih dari 255 karakter.').isLength({
            max: 255
        });
        req.checkBody('established_place', 'Tempat Didirikan minimal mengandung 3 karakter.').isLength({
            min: 3
        });
        req.checkBody('established_place', 'Tempat Didirikan wajib diisi.').notEmpty();
    }
    req.checkBody('phone', 'Nomor Handphone tidak boleh lebih dari 15 karakter.').isLength({
        max: 15
    });
    req.checkBody('phone', 'Nomor Handphone minimal mengandung 5 karakter.').isLength({
        min: 5
    });
    req.checkBody('phone', 'Nomor Handphone wajib diisi.').notEmpty();
    req.checkBody('name', 'Nama Lengkap tidak boleh lebih dari 255 karakter.').isLength({
        max: 255
    });
    req.checkBody('name', 'Nama Lengkap minimal mengandung 3 karakter.').isLength({
        min: 3
    });
    req.checkBody('name', 'Nama Lengkap wajib diisi.').notEmpty();
    if (req.user.user_type[0].name == 'investor') {
        req.checkBody('registration_type', 'Tipe Pendaftaran wajib dipilih.').notEmpty();
    }

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length - 1].msg;
        req.flash('error_message', error_message);
        req.flash('request', request);
        return res.redirect('/complete-profile');
    } else {
        let check_phone = phoneUtil.parseAndKeepRawInput(phone, 'ID');
        if (phoneUtil.isPossibleNumber(check_phone)) {
            phone = req.body.phone;
            if (req.user.user_type[0].name == 'investor' && registration_type != 'individual') {
                let check_company_phone = phoneUtil.parseAndKeepRawInput(company_phone, 'ID');
                if (phoneUtil.isPossibleNumber(check_company_phone)) {
                    company_phone = req.body.company_phone;
                } else {
                    error_message = "Nomor Telepon Perusahaan tidak valid";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
            }
            let data = {
                profile: [{
                    registration_type: registration_type,
                    name: name,
                    phone: phone,
                    established_place: established_place,
                    company_phone: company_phone,
                    gender: gender,
                    birth_date: birth_date,
                    province: province,
                    city: city,
                    district: district,
                    sub_district: sub_district,
                    address: address
                }]
            };

            updateUser(req.user, data, function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
                if (!user) {
                    error_message = "User tidak tersedia";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                } else {
                    const dir = path.join(__dirname, `../storage/documents/${req.user._id}`);
                    fs.access(dir, (err) => {
                        if (err) {
                            fs.mkdir(dir, async (err) => {
                                if (err) {
                                    error_message = "Terjadi Kesalahan";
                                    req.flash('error_message', error_message);
                                    req.flash('request', request);
                                    return res.redirect('/complete-profile');
                                } else {
                                    success_message = "Berhasil memperbarui data";
                                    req.flash('success_message', success_message);
                                    return res.redirect('/complete-profile');
                                }
                            });
                        } else {
                            success_message = "Berhasil memperbarui data";
                            req.flash('success_message', success_message);
                            return res.redirect('/complete-profile');
                        }
                    });
                }
            });
        } else {
            if (req.user.user_type[0].name == 'investor' && registration_type == 'individual') {
                error_message = "Nomor Handphone tidak valid";
            } else if (req.user.user_type[0].name == 'investor' && registration_type == 'company') {
                error_message = "Nomor Handphone Penanggungjawab tidak valid";
            }
            req.flash('error_message', error_message);
            req.flash('request', request);
            return res.redirect('/complete-profile');
        }
    }
});

router.post('/occupation', isLoggedIn, isNoContract, isUser, function (req, res) {
    let error_message;
    let occupation = req.body.occupation;
    let company_name = req.body.company_name;
    let company_address = req.body.company_address;
    let position = req.body.position;
    let income_source = req.body.income_source;
    let income = req.body.income;
    
    if (position == undefined) {
        position = "";
    }

    let request = {
        'registration_type': "",
        'name': "",
        'phone': "",
        'birth_date': "",
        'province': "",
        'city': "",
        'district': "",
        'sub_district': "",
        'address': "",
        'gender': "",
        'established_place': "",
        'company_phone': "",

        'occupation': occupation,
        'company_name': company_name,
        'company_address': company_address,
        'position': position,
        'income_source': income_source,
        'income': income,

        'pic_name': "",
        'pic_birth_date': "",
        'pic_identity_number': "",

        'company_registration_number': "",
        'npwp_number': "",
        'sk_kemenkumham_number': "",
        'identity_number': "",
        'npwp_number': "",

        'bank_name': "",
        'account_name': "",
        'account_number': "",
        'branch': ""
    }

    req.checkBody('income', 'Penghasilan per Bulan wajib dipilih').notEmpty();
    req.checkBody('income_source', 'Sumber Dana wajib dipilih').notEmpty();
    req.checkBody('company_address', 'Alamat Perusahaan tidak boleh lebih dari 250 karakter').isLength({
        max: 250
    });
    req.checkBody('company_name', 'Nama Perusahaan tidak boleh lebih dari 255 karakter').isLength({
        max: 255
    });
    req.checkBody('occupation', 'Pekerjaan wajib dipilih').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length - 1].msg;
        req.flash('error_message', error_message);
        req.flash('request', request);
        return res.redirect('/complete-profile');
    } else {
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
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
                if (!user) {
                    error_message = "User tidak tersedia";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                } else {
                    return res.redirect('/complete-profile');
                }
            });
    }
});

router.post('/pic', isLoggedIn, isNoContract, isUser, upload.fields([{
    name: 'pic_identity_image',
    maxCount: 1
}, {
    name: 'pic_identity_selfie_image',
    maxCount: 1
}]), async function (req, res) {
    let error_message;
    let pic_name = req.body.pic_name;
    let pic_birth_date = req.body.pic_birth_date;
    let pic_identity_number = req.body.pic_identity_number;
    let picIdentityImage = typeof req.files['pic_identity_image'] !== "undefined" ? req.files['pic_identity_image'][0].originalname : '';
    let picIdentitySelfieImage = typeof req.files['pic_identity_selfie_image'] !== "undefined" ? req.files['pic_identity_selfie_image'][0].originalname : '';
    let request = {
        'registration_type': "",
        'name': "",
        'phone': "",
        'birth_date': "",
        'province': "",
        'city': "",
        'district': "",
        'sub_district': "",
        'address': "",
        'gender': "",
        'established_place': "",
        'company_phone': "",

        'occupation': "",
        'company_name': "",
        'company_address': "",
        'position': "",
        'income_source': "",
        'income': "",

        'pic_name': pic_name,
        'pic_birth_date': pic_birth_date,
        'pic_identity_number': pic_identity_number,

        'company_registration_number': "",
        'npwp_number': "",
        'sk_kemenkumham_number': "",
        'identity_number': "",
        'npwp_number': "",

        'bank_name': "",
        'account_name': "",
        'account_number': "",
        'branch': ""
    }

    const imagePath = path.join(__dirname, `../storage/documents/${req.user._id}`);
    const fileUpload = new Resize(imagePath);

    req.checkBody('pic_identity_selfie_image', 'Format foto KTP/ Paspor Penanggungjawab harus berupa gambar').isImage(picIdentitySelfieImage);
    req.checkBody('pic_identity_image', 'Format foto KTP/ Paspor Penanggungjawab harus berupa gambar').isImage(picIdentityImage);
    req.checkBody('pic_identity_number', 'Nomor KTP/ Paspor Penanggungjawab wajib diisi.').notEmpty();
    req.checkBody('pic_birth_date', 'Tanggal Lahir Penanggungjawab wajib diisi.').notEmpty();
    req.checkBody('pic_name', 'Nama Penanggungjawab tidak boleh lebih dari 255 karakter.').isLength({
        max: 255
    });
    req.checkBody('pic_name', 'Nama Penanggungjawab minimal mengandung 3 karakter.').isLength({
        min: 3
    });
    req.checkBody('pic_name', 'Nama Penanggungjawab wajib diisi').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length - 1].msg;
        req.flash('error_message', error_message);
        req.flash('request', request);
        return res.redirect('/complete-profile');
    } else {
        let pic_identity_image_filename = req.body.pic_identity_image_input;
        let pic_identity_selfie_image_filename = req.body.pic_identity_selfie_image_input;

        if (req.user.pic.length == 0) {
            getUserByPICIdentityNumber(pic_identity_number, function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
                if (user) {
                    error_message = "Nomor KTP/ Paspor sudah terdaftar";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
            });

            if (!req.files['pic_identity_image']) {
                req.flash('error_message', 'Unggah Foto KTP/ Paspor wajib diisi.');
                req.flash('request', request);
                return res.redirect('/complete-profile');
            }

            if (!req.files['pic_identity_selfie_image']) {
                req.flash('error_message', 'Unggah Foto KTP/ Paspor + Selfie wajib diisi.');
                req.flash('request', request);
                return res.redirect('/complete-profile');
            }

            pic_identity_image_filename = await fileUpload.save(req.files['pic_identity_image'][0].buffer);
            pic_identity_selfie_image_filename = await fileUpload.save(req.files['pic_identity_selfie_image'][0].buffer);
        }
        if (req.user.pic.length != 0) {
            getUserByPICIdentityNumber(pic_identity_number, function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
                if (user) {
                    if (user._id != req.user._id) {
                        error_message = "Nomor KTP/ Paspor sudah terdaftar";
                        req.flash('error_message', error_message);
                        req.flash('request', request);
                        return res.redirect('/complete-profile');
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
                req.flash('request', request);
                return res.redirect('/complete-profile');
            }
            if (!user) {
                error_message = "User tidak tersedia";
                req.flash('error_message', error_message);
                req.flash('request', request);
                return res.redirect('/complete-profile');
            } else {
                return res.redirect('/complete-profile');
            }
        });
    }
});

router.post('/document', isLoggedIn, isNoContract, isUser, upload.fields([{
            name: 'identity_image',
            maxCount: 1
        },
        {
            name: 'identity_selfie_image',
            maxCount: 1
        },
        {
            name: 'npwp_image',
            maxCount: 1
        },
        {
            name: 'company_registration_image',
            maxCount: 1
        },
        {
            name: 'sk_kemenkumham_image',
            maxCount: 1
        },
        {
            name: 'business_permit_image',
            maxCount: 1
        }
    ]),
    async function (req, res) {
        let error_message;
        let identity_number = req.body.identity_number;
        let npwp_number = req.body.npwp_number;
        let company_registration_number = req.body.company_registration_number;
        let sk_kemenkumham_number = req.body.sk_kemenkumham_number;
        let request = {
            'registration_type': "",
            'name': "",
            'phone': "",
            'birth_date': "",
            'province': "",
            'city': "",
            'district': "",
            'sub_district': "",
            'address': "",
            'gender': "",
            'established_place': "",
            'company_phone': "",
    
            'occupation': "",
            'company_name': "",
            'company_address': "",
            'position': "",
            'income_source': "",
            'income': "",

            'pic_name': "",
            'pic_birth_date': "",
            'pic_identity_number': "",

            'company_registration_number': company_registration_number,
            'npwp_number': npwp_number,
            'sk_kemenkumham_number': sk_kemenkumham_number,
            'identity_number': identity_number,
            'npwp_number': npwp_number,

            'bank_name': "",
            'account_name': "",
            'account_number': "",
            'branch': ""
        }
        if (req.user.profile[0].registration_type == 'individual' || req.user.user_type[0].name == "inisiator") {
            if (npwp_number != '') {
                req.checkBody('npwp_number', 'Nomor NPWP harus mengandung 15 karakter.').isLength({
                    min: 15,
                    max: 15
                });
            }
            req.checkBody('identity_number', 'Nomor KTP/ Paspor wajib diisi.').notEmpty();
        }
        if (req.user.profile[0].registration_type == 'company' && req.user.user_type[0].name == "investor") {
            let companyRegistrationImage = typeof req.files['company_registration_image'] !== "undefined" ? req.files['company_registration_image'][0].originalname : '';
            let npwpImage = typeof req.files['npwp_image'] !== "undefined" ? req.files['npwp_image'][0].originalname : '';
            let skKemenkumhamImage = typeof req.files['sk_kemenkumham_image'] !== "undefined" ? req.files['sk_kemenkumham_image'][0].originalname : '';
            let businessPermitImage = typeof req.files['business_permit_image'] !== "undefined" ? req.files['business_permit_image'][0].originalname : '';

            req.checkBody('business_permit_image', 'Format Surat Izin Usaha Perdagangan harus berupa gambar').isImage(businessPermitImage);
            req.checkBody('sk_kemenkumham_image', 'Format SK KEMENKUMHAM harus berupa gambar').isImage(skKemenkumhamImage);
            req.checkBody('npwp_image', 'Format NPWP Perusahaan harus berupa gambar').isImage(npwpImage);
            req.checkBody('company_registration_image', 'Format Tanda Daftar Perusahaan harus berupa gambar').isImage(companyRegistrationImage);
            req.checkBody('sk_kemenkumham_number', 'Nomor SK KEMENKUMHAM wajib diisi').notEmpty();
            req.checkBody('npwp_number', 'Nomor NPWP Perusahaan harus mengandung 15 karakter.').isLength({
                min: 15,
                max: 15
            });
            req.checkBody('npwp_number', 'Nomor NPWP Perusahaan wajib diisi').notEmpty();
            req.checkBody('company_registration_number', 'Nomor Tanda Daftar Perusahaan wajib diisi').notEmpty();
        }

        let errors = req.validationErrors();

        if (errors) {
            error_message = errors[errors.length - 1].msg;
            req.flash('error_message', error_message);
            req.flash('request', request);
            return res.redirect('/complete-profile');
        } else {
            let npwp_image_filename = req.body.npwp_image_input;
            let identity_image_filename = req.body.identity_image_input;
            let identity_selfie_image_filename = req.body.identity_selfie_image_input;
            let company_registration_image_filename = req.body.company_registration_image_input;
            let sk_kemenkumham_image_filename = req.body.sk_kemenkumham_image_input;
            let business_permit_image_filename = req.body.business_permit_image_input;

            const imagePath = path.join(__dirname, `../storage/documents/${req.user._id}`);
            const fileUpload = new Resize(imagePath);

            if (req.user.profile[0].registration_type == 'individual' || req.user.user_type[0].name == "inisiator") {
                getUserByIdentityNumber(identity_number, async function (error, user) {

                    if (error) {
                        error_message = "Terjadi kesalahan";
                        req.flash('error_message', error_message);
                        req.flash('request', request);
                        return res.redirect('/complete-profile');
                    }
                    if (user) {
                        error_message = "Nomor KTP/Paspor sudah terdaftar";
                        req.flash('error_message', error_message);
                        req.flash('request', request);
                        return res.redirect('/complete-profile');
                    } else {
                        if (req.user.document.length == 0) {
                            if (!req.files['identity_image']) {
                                req.flash('error_message', 'Foto KTP/ Paspor wajib diunggah.');
                                req.flash('request', request);
                                return res.redirect('/complete-profile');
                            }
                            if (!req.files['identity_selfie_image']) {
                                req.flash('error_message', 'Foto KTP/ Paspor + Selfie wajib diunggah.');
                                req.flash('request', request);
                                return res.redirect('/complete-profile');
                            } else {
                                identity_image_filename = await fileUpload.save(req.files['identity_image'][0].buffer);
                                identity_selfie_image_filename = await fileUpload.save(req.files['identity_selfie_image'][0].buffer);
                                if (req.files['npwp_image']) {
                                    npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                                }
                            }
                        }
                        if (req.user.document.length != 0) {
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
                        let data = {
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
                            }]
                        };

                        updateUser(req.user, data, function (error, user) {
                            if (error) {
                                error_message = "Terjadi kesalahan";
                                req.flash('error_message', error_message);
                                req.flash('request', request);
                                return res.redirect('/complete-profile');
                            }
                            if (!user) {
                                error_message = "User tidak tersedia";
                                req.flash('error_message', error_message);
                                req.flash('request', request);
                                return res.redirect('/complete-profile');
                            } else {
                                return res.redirect('/complete-profile');
                            }
                        });
                    }

                });
            }
            if (req.user.profile[0].registration_type == 'company' && req.user.user_type[0].name == "investor") {
                if (req.user.document.length == 0) {
                    if (!req.files['company_registration_image']) {
                        req.flash('error_message', 'Tanda Daftar Perusahaan wajib diunggah.');
                        req.flash('request', request);
                        return res.redirect('/complete-profile');
                    }
                    if (!req.files['npwp_image']) {
                        req.flash('error_message', 'NPWP Perusahaan wajib diunggah.');
                        req.flash('request', request);
                        return res.redirect('/complete-profile');
                    }
                    if (!req.files['sk_kemenkumham_image']) {
                        req.flash('error_message', 'SK KEMENKUMHAM wajib diunggah.');
                        req.flash('request', request);
                        return res.redirect('/complete-profile');
                    }

                    company_registration_image_filename = await fileUpload.save(req.files['company_registration_image'][0].buffer);
                    npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                    sk_kemenkumham_image_filename = await fileUpload.save(req.files['sk_kemenkumham_image'][0].buffer);

                    if (req.files['business_permit_image']) {
                        business_permit_image_filename = await fileUpload.save(req.files['business_permit_image'][0].buffer);
                    }
                }
                if (req.user.document.length != 0) {
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
                        }]
                    },
                    function (error, user) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            req.flash('request', request);
                            return res.redirect('/complete-profile');
                        }
                        if (!user) {
                            error_message = "User tidak tersedia";
                            req.flash('error_message', error_message);
                            req.flash('request', request);
                            return res.redirect('/complete-profile');
                        } else {
                            return res.redirect('/complete-profile');
                        }
                    });
            }
        }
    });

router.post('/bank', isLoggedIn, isNoContract, isUser, function (req, res) {
    let error_message;
    let bank_name = req.body.bank_name;
    let account_name = req.body.account_name;
    let account_number = req.body.account_number;
    let branch = req.body.branch;
    let request = {
        'registration_type': "",
        'name': "",
        'phone': "",
        'birth_date': "",
        'province': "",
        'city': "",
        'district': "",
        'sub_district': "",
        'address': "",
        'gender': "",
        'established_place': "",
        'company_phone': "",

        'occupation': "",
        'company_name': "",
        'company_address': "",
        'position': "",
        'income_source': "",
        'income': "",

        'pic_name': "",
        'pic_birth_date': "",
        'pic_identity_number': "",

        'company_registration_number': "",
        'npwp_number': "",
        'sk_kemenkumham_number': "",
        'identity_number': "",
        'npwp_number': "",

        'bank_name': bank_name,
        'account_name': account_name,
        'account_number': account_number,
        'branch': branch
    }

    req.checkBody('branch', 'Cabang tidak boleh lebih dari 50 karakter.').isLength({
        max: 50
    });
    req.checkBody('branch', 'Cabang minimal mengandung 3 karakter.').isLength({
        min: 3
    });
    req.checkBody('branch', 'Cabang wajib diisi.').notEmpty();
    req.checkBody('account_number', 'Nomor Rekening tidak boleh lebih dari 50 karakter.').isLength({
        max: 50
    });
    req.checkBody('account_number', 'Nomor Rekening minimal mengandung 3 karakter.').isLength({
        min: 3
    });
    req.checkBody('account_number', 'Nomor Rekening wajib diisi.').notEmpty();
    req.checkBody('account_name', 'Nama Pemilik Rekening tidak boleh lebih dari 50 karakter.').isLength({
        max: 50
    });
    req.checkBody('account_name', 'Nama Pemilik Rekening minimal mengandung 3 karakter.').isLength({
        min: 3
    });
    req.checkBody('account_name', 'Nama Pemilik Rekening wajib diisi.').notEmpty();
    req.checkBody('bank_name', 'Nama Bank wajib dipilih.').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length - 1].msg;
        req.flash('error_message', error_message);
        req.flash('request', request);
        return res.redirect('/complete-profile');
    } else {
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
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                }
                if (!user) {
                    error_message = "User tidak tersedia";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('/complete-profile');
                } else {
                    if (user.user_type[0].name == 'investor') {
                        return res.redirect('/contract');
                    } else {
                        return res.redirect('/');
                    }
                }
            });
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

function isNoContract(req, res, next) {
    if (req.user.contract == '') {
        next();
    } else {
        res.redirect('/');
    }
}

function isUser(req, res, next) {
    if (req.user.user_type[0].name == 'investor' || req.user.user_type[0].name == 'inisiator') {
        next();
    } else {
        res.redirect('/');
    }
}

export default router;