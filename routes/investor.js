import express from 'express';
import {
    getProjectByID
} from '../models/Project';
import {
    Transaction,
    createTransaction,
    getTransactionById,
    getTransactionByStatus,
    getBackedProjectTransaction,
    getTransactionByInvestorandProject,
    updateTransaction
} from '../models/Transaction';
import { updateUser } from "../models/User";
import moment from 'moment';
import multer from 'multer';
import path from 'path';
import Resize from '../Resize';
import upload from '../uploadMiddleware';
import fs from 'fs';
import request from 'request';
import expressValidator from 'express-validator';

const router = express.Router();
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

moment.locale('id');
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

router.get('/dashboard', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let data = {
        user_id: req.user._id,
        url: "dashboard"
    }
    res.render('pages/investor/dashboard', data);
});
router.get('/profile/:user_id', isLoggedIn, isInvestor, isVerified, function (req, res) {
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
            let pic_birth_date;
            if (req.user.pic.length != 0) {
                pic_birth_date = moment(req.user.pic[0].pic_birth_date).format('DD/MM/YYYY');
            }
            let data = {
                user_id: req.user._id,
                birth_date: moment(req.user.profile[0].birth_date).format('DD/MM/YYYY'),
                pic_birth_date: pic_birth_date,
                province: JSON.parse(body).semuaprovinsi,
                max_date: moment().subtract(17, 'years').format('DD/MM/YYYY'),
                url: "investor-my-profile"
            }
            res.render('pages/investor/profile/my-profile', data);
        }
    });
});
router.get('/profile/get-image/:user_id/:filename', isLoggedIn, isInvestor, isVerified, function (req, res) {
    res.download(__dirname+'/../storage/documents/'+req.params.user_id+'/'+req.params.filename);
});
router.get('/transaction/waiting-payment', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let waiting_transactions = [];
    let createdAt = [];
    let due_date = [];
    getTransactionByStatus('waiting_payment', function (error, transactions) {
        transactions.forEach((transaction, index) => {
            if (transaction.investor._id.equals(req.user._id) && moment.duration(moment(transaction.due_date).diff(moment()))._milliseconds > 0) {
                waiting_transactions[index] = transaction;
                createdAt[index] = moment(transaction.createdAt).format('LL');
                due_date[index] = moment(transaction.due_date).format('lll');
            }
        });

        let data = {
            user_id: req.user._id,
            transactions: waiting_transactions,
            createdAt: createdAt,
            due_date: due_date,
            url: "waiting-payment"
        }
        return res.render('pages/investor/transaction/waiting-payment', data);
    });
});
router.get('/transaction/waiting-verification', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let waiting_transactions = [];
    let createdAt = [];
    let due_date = [];
    let payment_date = [];
    getTransactionByStatus('waiting_verification', function (error, transactions) {
        transactions.forEach((transaction, index) => {
            if (transaction.investor._id.equals(req.user._id)) {
                waiting_transactions[index] = transaction
                createdAt[index] = moment(transaction.createdAt).format('LL');
                due_date[index] = moment(transaction.due_date).format('lll');
                payment_date[index] = moment(transaction.payment_date).format('lll');
            }
        });

        let data = {
            user_id: req.user._id,
            transactions: waiting_transactions,
            createdAt: createdAt,
            due_date: due_date,
            payment_date: payment_date,
            url: "waiting-verification"
        }
        return res.render('pages/investor/transaction/waiting-verification', data);
    });
});
router.get('/transaction/waiting-payment/:transaction_id', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/investor/transaction/waiting-payment');
        }
        if (!transaction) {
            error_message = "Transaksi tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/investor/transaction/waiting-payment');
        } else {
            if (transaction.investor._id.equals(req.user._id) && transaction.status != 'verified') {
                let data = {
                    user_id: req.user._id,
                    transaction: transaction,
                    url: "detail-transaction"
                }
                return res.render('pages/investor/transaction/detail', data);
            } else {
                error_message = "Transaksi tidak teredia";
                req.flash('error_message', error_message);
                return res.redirect('/investor/transaction/waiting-payment');
            }
        }
    });
});
router.get('/:user_id/backed-project', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let durations = [];

    getBackedProjectTransaction(req.user._id, function (error, projects) {
        if (error) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/investor/${req.params.user_id}/backed-project`);
        } else {
            projects.forEach((project, index) => {
                durations[index] = moment(project.project[0].duration[0].due_campaign).diff(moment(), 'days');
            });
            let data = {
                user_id: req.user._id,
                url: "backed-project",
                projects: projects,
                durations: durations,
            }
            res.render('pages/investor/backed-project', data);
        }
    });

});
router.get('/:project_id/backed-project/transaction', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let verified_transaction = [];
    let createdAt = [];
    let due_date = [];
    let payment_date = [];
    getTransactionByInvestorandProject(req.user._id, req.params.project_id, function (error, transactions) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/investor/${req.params.user_id}/backed-project/transaction`);
        }
        else {
            transactions.forEach((transaction, index) => {
                if (transaction.status == 'verified') {
                    verified_transaction[index] = transaction;
                    createdAt[index] = moment(transaction.createdAt).format('LL');
                    due_date[index] = moment(transaction.due_date).format('lll');
                    payment_date[index] = moment(transaction.payment_date).format('lll');
                }
            });
            let data = {
                url: 'backed-project-transaction',
                transactions: verified_transaction,
                createdAt: createdAt,
                due_date: due_date,
                payment_date: payment_date,
                user_id: req.user._id
            }
            return res.render('pages/investor/backed-project-transaction', data);
        }
    });

});
router.get('/transaction/get-receipt/:transaction_id/:filename', isLoggedIn, isInvestor, isVerified, function (req, res) {
    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (transaction.investor._id.equals(req.user._id)) {
            res.download(__dirname + '/../storage/projects/' + transaction.project._id + '/transactions/' + req.params.filename);
        }
    });
});
router.get('/transaction/get-certificate/:transaction_id', isLoggedIn, isInvestor, isVerified, function (req, res) {
    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (transaction && transaction.investor._id.equals(req.user._id)) {
            res.download(__dirname + '/../storage/projects/' + transaction.project._id + '/transactions/' + req.params.transaction_id + ".pdf");
        }
    });
});
let profilePhoto = upload.single('profile_photo');
router.post('/profile/:user_id', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let success_message;
    let profile_photo_filename;
    profilePhoto(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar maksimal 4 MB.";
            req.flash('error_message', error_message);
            return res.redirect('back');
        } else if (err) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
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
        if (req.user.profile[0].registration_type == 'individual') {
            req.checkBody('birth_date', 'Tanggal Lahir wajib diisi.').notEmpty();
            req.checkBody('gender', 'Jenis Kelamin wajib dipilih.').notEmpty();
        } else if (req.user.profile[0].registration_type == 'company') {
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
        let profilePhotoImage = typeof req.file !== "undefined" ? req.file.originalname : '';
        req.checkBody('profile_photo', 'Format Foto Profil harus berupa gambar').isImage(profilePhotoImage);

        let errors = req.validationErrors();
    
        if (errors) {
            error_message = errors[errors.length - 1].msg;
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        else {
            let check_phone = phoneUtil.parseAndKeepRawInput(req.body.phone, 'ID');
            if (phoneUtil.isPossibleNumber(check_phone)) {
                if (req.file) {
                    const imagePath = path.join(__dirname, `../storage/documents/${req.user._id}`);
                    const fileUpload = new Resize(imagePath);
                    profile_photo_filename = await fileUpload.save(req.file.buffer);
                }
                else if (req.user.profile[0].photo) {
                    profile_photo_filename = req.user.profile[0].photo;
                }
                if (req.user.profile[0].registration_type == 'company') {
                    let check_company_phone = phoneUtil.parseAndKeepRawInput(req.body.company_phone, 'ID');
                    if (!phoneUtil.isPossibleNumber(check_company_phone)) {
                        error_message = "Nomor Telepon Perusahaan tidak valid";
                        req.flash('error_message', error_message);
                        return res.redirect('back');
                    }
                }
                let birth_date = moment(req.body.birth_date, "DD-MM-YYYY").format();
                if (req.user.profile[0].registration_type == 'individual' && moment.duration(moment().diff(birth_date))._data.years < 17) {
                    error_message = "Usia investor harus lebih dari 17 tahun.";
                    req.flash('error_message', error_message);
                    return res.redirect('back');
                }
                let data = {
                    email: req.body.email,
                    profile: [{
                        photo: profile_photo_filename,
                        registration_type: req.user.profile[0].registration_type,
                        name: req.body.name,
                        phone: req.body.phone,
                        established_place: req.body.established_place,
                        company_phone: req.body.company_phone,
                        gender: req.body.gender,
                        birth_date: birth_date,
                        province: {
                            province_id: req.body.province,
                            province_name: req.body.province_name
                        },
                        city: {
                            city_id: req.body.city,
                            city_name: req.body.city_name
                        },
                        district: {
                            district_id: req.body.district,
                            district_name: req.body.district_name
                        },
                        sub_district: {
                            sub_district_id: req.body.sub_district,
                            sub_district_name: req.body.sub_district_name
                        },
                        address: req.body.address
                    }]
                };
    
                updateUser(req.user, data, function (error, user) {
                    if (error) {
                        error_message = "Terjadi kesalahan";
                        req.flash('error_message', error_message);
                        return res.redirect('back');
                    }
                    if (!user) {
                        error_message = "User tidak tersedia";
                        req.flash('error_message', error_message);
                        return res.redirect('back');
                    } else {
                        success_message = "Berhasil memperbarui data";
                        req.flash('success_message', success_message);
                        return res.redirect('back');
                    }
                });
            } else {
                if (registration_type == 'individual') {
                    error_message = "Nomor Handphone tidak valid";
                } else if ( registration_type == 'company') {
                    error_message = "Nomor Handphone Penanggungjawab tidak valid";
                }
                req.flash('error_message', error_message);
                return res.redirect('back');
            }
        }
    })
});
router.post('/profile/:user_id/occupation', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let success_message;

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
        return res.redirect('back');
    } else {
        updateUser(req.user, {
                occupation: [{
                    occupation: req.body.occupation,
                    company_name: req.body.company_name,
                    company_address: req.body.company_address,
                    position: req.body.position,
                    income_source: req.body.income_source,
                    income: req.body.income,
                }]
            },
            function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('back');
                }
                if (!user) {
                    error_message = "User tidak tersedia";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('back');
                } else {
                    success_message = "Berhasil memperbarui data."
                    req.flash('success_message', success_message);
                    return res.redirect('back');
                }
            });
    }
});
router.post('/profile/:user_id/pic', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let success_message;

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
        return res.redirect('back');
    } else {
        let pic_birth_date = moment(req.body.pic_birth_date, "DD-MM-YYYY").format();
        if (moment.duration(moment(moment()).diff(pic_birth_date))._data.years < 17) {
            error_message = "Usia penanggung jawab harus lebih dari 17 tahun.";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        updateUser(req.user, {
            pic: [{
                pic_name: req.body.pic_name,
                pic_birth_date: pic_birth_date,
                pic_identity_number: req.user.pic[0].pic_identity_number,
                pic_identity_image: req.user.pic[0].pic_identity_image,
                pic_identity_selfie_image: req.user.pic[0].pic_identity_selfie_image
            }]
        }, function (error, user) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                req.flash('request', request);
                return res.redirect('back');
            }
            if (!user) {
                error_message = "User tidak tersedia";
                req.flash('error_message', error_message);
                req.flash('request', request);
                return res.redirect('back');
            } else {
                success_message = "Berhasil memperbarui data";
                req.flash('success_message', success_message);
                return res.redirect('back');
            }
        });
    }
});
let documentUpload = upload.fields([
    {
        name: 'npwp_image',
        maxCount: 1
    },
    {
        name: 'business_permit_image',
        maxCount: 1
    }
]);
router.post('/profile/:user_id/document', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let success_message;
    let business_permit_image_filename = req.user.document[0].business_permit_image;
    let npwp_image_filename = req.user.document[0].npwp_image;

    documentUpload(req, res, async function(err){
        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar maksimal 4 MB.";
            req.flash('error_message', error_message);
            return res.redirect('back');
        } else if (err) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        if (req.user.profile[0].registration_type == 'individual') {
            if (req.body.npwp_number != '') {
                let npwpImage = typeof req.files['npwp_image'] !== "undefined" ? req.files['npwp_image'][0].originalname : '';
                req.checkBody('npwp_image', 'Format NPWP Perusahaan harus berupa gambar').isImage(npwpImage);
                req.checkBody('npwp_number', 'Nomor NPWP harus memiliki 15 karakter.').isLength({
                    min: 15,
                    max: 15
                });
            }
        }
        if (req.user.profile[0].registration_type == 'company') {
            let businessPermitImage = typeof req.files['business_permit_image'] !== "undefined" ? req.files['business_permit_image'][0].originalname : '';
            req.checkBody('business_permit_image', 'Format Surat Izin Usaha Perdagangan harus berupa gambar').isImage(businessPermitImage);            
        }

        let errors = req.validationErrors();

        if (errors) {
            error_message = errors[errors.length - 1].msg;
            req.flash('error_message', error_message);
            return res.redirect('back');
        } else {

            const imagePath = path.join(__dirname, `../storage/documents/${req.user._id}`);
            const fileUpload = new Resize(imagePath);

            if (req.user.profile[0].registration_type == 'individual') {
                if (req.files['npwp_image']) {
                    npwp_image_filename = await fileUpload.save(req.files['npwp_image'][0].buffer);
                }
            }
            if (req.user.profile[0].registration_type == 'company') {
                if (req.files['business_permit_image']) {
                    business_permit_image_filename = await fileUpload.save(req.files['business_permit_image'][0].buffer);
                }
            }
            let data = {
                document: [{
                    identity_number: req.user.document[0].identity_number,
                    identity_image: req.user.document[0].identity_image,
                    identity_selfie_image: req.user.document[0].identity_selfie_image,
                    company_registration_number: req.user.document[0].company_registration_number,
                    company_registration_image: req.user.document[0].company_registration_image,
                    sk_kemenkumham_number: req.user.document[0].k_kemenkumham_number,
                    sk_kemenkumham_image: req.user.document[0].sk_kemenkumham_image,
                    npwp_number: req.body.npwp_number,
                    npwp_image: npwp_image_filename,
                    business_permit_image: business_permit_image_filename
                }]
            };

            updateUser(req.user, data, function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');
                }
                if (!user) {
                    error_message = "User tidak tersedia";
                    req.flash('error_message', error_message);
                    return res.redirect('back');
                } else {
                    success_message = "Berhasil memperbarui data.";
                    req.flash('success_message', success_message);
                    return res.redirect('back');
                }
            });
        }
    });
});
router.post('/profile/:user_id/bank', isLoggedIn, isInvestor, isVerified, function (req, res) {
    let error_message;
    let success_message;

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
        return res.redirect('back');
    } else {
        updateUser(req.user, {
                bank: [{
                    bank_name: req.body.bank_name,
                    account_name: req.body.account_name,
                    account_number: req.body.account_number,
                    branch: req.body.branch
                }]
            },
            function (error, user) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('back');
                }
                if (!user) {
                    error_message = "User tidak tersedia";
                    req.flash('error_message', error_message);
                    req.flash('request', request);
                    return res.redirect('back');
                } else {
                    success_message = "Berhasil memperbarui data."
                    req.flash('success_message', success_message);
                    return res.redirect('back');
                }
            });
    }
});
router.post('/project/:project_id', isLoggedIn, isInvestor, isVerified, function (req, res) {
    const dir = path.join(__dirname, `../storage/projects/${req.params.project_id}/transactions`);

    let error_message;
    let success_message;

    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/project/' + req.params.project_id);
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/project/' + req.params.project_id);
        }
        else {
            fs.access(dir, (err) => {
                if (err) {
                    fs.mkdir(dir, async (err) => {
                        if (err) {
                            error_message = "Terjadi Kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect('/project/' + req.params.project_id);
                        } else {
                            if (moment.duration(moment(project.project[0].duration[0].due_campaign).diff(moment()))._milliseconds > 0 && project.status == 'verified') {
                                req.checkBody('stock', 'Jumlah saham tidak boleh lebih dari ' + project.basic[0].stock[0].temp).isInt({
                                    max: project.basic[0].stock[0].temp
                                });
                                req.checkBody('stock', 'Jumlah saham tidak boleh lebih dari ' + project.basic[0].stock[0].max_invest).isInt({
                                    max: project.basic[0].stock[0].max_invest
                                });
                                req.checkBody('stock', 'Jumlah saham tidak boleh kurang dari 1').isInt({
                                    min: 1
                                });
                                req.checkBody('stock', 'Jumlah saham wajib diisi').notEmpty();

                                let errors = req.validationErrors();

                                if (errors) {
                                    error_message = errors[errors.length - 1].msg;
                                    req.flash('error_message', error_message);
                                    return res.redirect('/project/' + req.params.project_id);
                                } else {
                                    let data = {
                                        stock_quantity: req.body.stock,
                                        status: 'waiting_payment',
                                        receipt: null,
                                        due_date: moment().add(2, 'days'),
                                        payment_date: null,
                                        project: req.params.project_id,
                                        investor: req.user._id,
                                        inisiator: project.inisiator._id
                                    }
                                    let transaction = new Transaction(data);
                                    createTransaction(transaction, function (error) {
                                        if (error) {
                                            error_message = "Terjadi kesalahan.";
                                            req.flash('error_message', error_message);
                                            return res.redirect('/project/' + req.params.project_id);
                                        } else {
                                            project.basic[0].stock[0].temp = project.basic[0].stock[0].temp - req.body.stock;
                                            project.save().then(project => {
                                                success_message = "Berhasil melakukan transaksi";
                                                req.flash('success_message', success_message);
                                                return res.redirect('/investor/transaction/waiting-payment');
                                            }).catch(error => {
                                                error_message = "Terjadi kesalahan";
                                                req.flash('error_message', error_message);
                                                return res.redirect('/investor/transaction/waiting-payment');
                                            });

                                        }
                                    });
                                }
                            } else {
                                error_message = "Durasi kampanye proyek berakhir";
                                req.flash('error_message', error_message);
                                return res.redirect('/investor/transaction/waiting-payment');
                            }
                        }
                    });
                } else {
                    if (moment.duration(moment(project.project[0].duration[0].due_campaign).diff(moment()))._milliseconds > 0 && project.status == 'verified') {
                        req.checkBody('stock', 'Jumlah saham tidak boleh lebih dari ' + project.basic[0].stock[0].temp).isInt({
                            max: project.basic[0].stock[0].temp
                        });
                        req.checkBody('stock', 'Jumlah saham tidak boleh lebih dari ' + project.basic[0].stock[0].max_invest).isInt({
                            max: project.basic[0].stock[0].max_invest
                        });
                        req.checkBody('stock', 'Jumlah saham tidak boleh kurang dari 1').isInt({
                            min: 1
                        });
                        req.checkBody('stock', 'Jumlah saham wajib diisi').notEmpty();

                        let errors = req.validationErrors();

                        if (errors) {
                            error_message = errors[errors.length - 1].msg;
                            req.flash('error_message', error_message);
                            return res.redirect('/project/' + req.params.project_id);
                        } else {
                            let data = {
                                stock_quantity: req.body.stock,
                                status: 'waiting_payment',
                                receipt: null,
                                due_date: moment().add(2, 'days'),
                                payment_date: null,
                                project: req.params.project_id,
                                investor: req.user._id,
                                inisiator: project.inisiator._id
                            }
                            let transaction = new Transaction(data);
                            createTransaction(transaction, function (error) {
                                if (error) {
                                    error_message = "Terjadi kesalahan.";
                                    req.flash('error_message', error_message);
                                    return res.redirect('/project/' + req.params.project_id);
                                } else {
                                    project.basic[0].stock[0].temp = project.basic[0].stock[0].temp - req.body.stock;
                                    project.save().then(project => {
                                        success_message = "Berhasil melakukan transaksi";
                                        req.flash('success_message', success_message);
                                        return res.redirect('/investor/transaction/waiting-payment');
                                    }).catch(error => {
                                        error_message = "Terjadi kesalahan";
                                        req.flash('error_message', error_message);
                                        return res.redirect('/investor/transaction/waiting-payment');
                                    });

                                }
                            });
                        }
                    } else {
                        error_message = "Durasi kampanye proyek berakhir";
                        req.flash('error_message', error_message);
                        return res.redirect('/investor/transaction/waiting-payment');
                    }
                }
            });
        }
    });
});
let receiptUpload = upload.any();
router.post('/transaction/waiting-payment/:transaction_id/:project_id', isLoggedIn, isInvestor, isVerified, function (req, res) {
    receiptUpload(req, res, function (err) {
        const dir = path.join(__dirname, `../storage/projects/${req.params.project_id}/transactions`);
        const imageUpload = new Resize(dir);
        let success_message;
        let error_message;

        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar terlalu besar";
            req.flash('error_message', error_message);
            return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
        } else if (err) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
        }
        getTransactionById(req.params.transaction_id, async function (error, transaction) {
            if (error) {
                error_message = "Terjadi Kesalahan";
                req.flash('error_message', error_message);
                return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
            }
            if (!transaction) {
                error_message = "Transaksi tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
            } else {
                if (transaction.investor._id.equals(req.user._id)) {
                    if (moment.duration(moment(transaction.due_date).diff(moment()))._milliseconds > 0) {
                        if (req.files) {
                            for (let i = 0; i < req.files.length; i++) {
                                let receipt_file = await imageUpload.save(req.files[i].buffer);
                                transaction.receipt.forEach((receipt, index) => {
                                    if (req.files[i].fieldname == receipt.filename) {
                                        transaction.receipt[index].filename = receipt_file;
                                        transaction.receipt[index].payment_date = moment().format()
                                    }
                                });
                                if (req.files[i].fieldname == 'receipt') {
                                    transaction.receipt.push({
                                        filename: receipt_file,
                                        payment_date: moment().format()
                                    })
                                }
                            }
                            transaction.status = 'waiting_verification';
                            
                            transaction.save().then(transaction => {
                                success_message = "Berhasil mengunggah bukti transaksi.";
                                req.flash('success_message', success_message);
                                return res.redirect('/investor/transaction/waiting-verification/');
                            }).catch(error => {
                                error_message = "Terjadi kesalahan";
                                req.flash('error_message', error_message);
                                return res.redirect('back');
                            })
                        } else {
                            error_message = "Bukti transaksi wajib diunggah.";
                            req.flash('error_message', error_message);
                            return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
                        }
                    } else {
                        error_message = "Transaksi sudah kadaluarsa.";
                        req.flash('error_message', error_message);
                        return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
                    }
                } else {
                    error_message = "Transaksi tidak tersedia";
                    req.flash('error_message', error_message);
                    return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
                }

            }
        });
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

function isInvestor(req, res, next) {
    if (req.user.user_type[0].name == 'investor') {
        next();
    } else {
        res.redirect('/');
    }
}

function isVerified(req, res, next) {
    if (req.user.user_type[0].status == 'verified') {
        next();
    } else {
        let error_message = "Anda belum terverifikasi";
        req.flash('error_message', error_message);
        return res.redirect('/complete-profile');
    }
}
export default router;