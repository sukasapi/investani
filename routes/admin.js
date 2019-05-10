import express from 'express';
import { User, getUserByID } from '../models/User';
import { getProjectByStatus, getProjectByID, updateProject } from '../models/Project';
import { Category, createCategory } from '../models/Category';
import { getTransactionByStatus, getTransactionById } from '../models/Transaction';
import { createSignature, Signature } from '../models/Signature';
import moment from 'moment';
import request from 'request';
import upload from '../uploadMiddleware';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import Resize from '../Resize';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import puppeteer from 'puppeteer';

const router = express.Router();

const compile = async function (templateName, data) {
    const filePath = path.join(__dirname, '../storage/certificates/template/', `${templateName}.ejs`);
    const html = await fsExtra.readFile(filePath, 'utf-8');
    return ejs.render(html, data);
};

router.get('/', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/dashboard');
});
router.get('/dashboard', isLoggedIn, isAdmin, function (req, res) {
    let data = {
        url: "dashboard"
    }
    res.render('pages/admin/dashboard', data);
});
router.get('/user', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/user/investor', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/user/investor/individual', isLoggedIn, isAdmin, function (req, res) {
    let url = "individual-investor";
    let error_message;
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            res.render('pages/admin/user/investor/individual', {investors: users, url: url});
        }
    });
});
router.get('/user/investor/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let url = "individual-investor-detail";
    getUserByID(req.params.id, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            res.render('pages/admin/user/investor/detail', {user: user, url: url});
        }
    });
});
router.get('/user/investor/company', isLoggedIn, isAdmin, function (req, res) {
    let url = "company-investor";
    let error_message;
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "company"}, function (error, users) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            res.render('pages/admin/user/investor/company', {investors: users, url: url});
        }
    });
});
router.get('/user/investor/company/:id', isLoggedIn, isAdmin, function (req, res) {
    let url = "company-investor-detail";

    getUserByID(req.params.id, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            res.render('pages/admin/user/investor/detail', {user: user, url: url});
        } 
    });
});
router.get('/user/inisiator', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/inisiator/individual');
});
router.get('/user/inisiator/individual', isLoggedIn, isAdmin, function (req, res) {
    let url = "inisiator";

    User.find({'active': true, 'user_type.name': 'inisiator', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            res.render('pages/admin/user/inisiator/individual', {inisiators: users, url: url});
        }
    });
});
router.get('/user/inisiator/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    let url = "inisiator-detail";
    getUserByID(req.params.id, function (error, user) {        
        res.render('pages/admin/user/inisiator/detail', {user: user, url: url});
    });
});
router.get('/user/get-image/:user_id/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/documents/'+req.params.user_id+'/'+req.params.filename);
});
router.get('/project/waiting', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let durations = [];

    getProjectByStatus("waiting", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                projects: projects,
                durations: durations,
                url: "waiting-project",
            }
            return res.render('pages/admin/project/waiting', data);
        }
    });
});
router.get('/project/rejected', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let durations = [];
    
    getProjectByStatus("rejected", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                projects: projects,
                durations: durations,
                url: "rejected-project",
            }
            return res.render('pages/admin/project/rejected', data);
        }
    });
});
router.get('/project/open', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let durations = [];
    let open_projects = [];
    
    getProjectByStatus("verified", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            projects.forEach((project, index) => {
                if (moment.duration(moment(project.project[0].duration[0].due_campaign).diff(moment()))._milliseconds > 0) {
                    open_projects[index] = project
                    durations[index] = moment(project.project[0].duration[0].due_campaign).diff(moment(), 'days');
                }
            });

            let data = {
                projects: open_projects,
                durations: durations,
                url: "open-project",
            }
            
            return res.render('pages/admin/project/open', data);
        }
    });
});
router.get('/project/done', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let durations = [];
    let open_projects = [];

    getProjectByStatus("verified", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            projects.forEach((project, index) => {
                if (moment.duration(moment(project.project[0].duration[0].due_campaign).diff(moment()))._milliseconds < 0) {
                    open_projects[index] = project
                    durations[index] = moment(project.project[0].duration[0].due_campaign).diff(moment(), 'days');
                }
            });

            let data = {
                projects: open_projects,
                durations: durations,
                url: "done-project",
            }
            
            return res.render('pages/admin/project/done', data);
        }
    });
});
router.get('/project/waiting/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        else {

            let data = {
                url: 'waiting-detail-project',
                project: project
            }
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/waiting/:project_id/edit', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let province_id = null;
    request({
        url: 'http://dev.farizdotid.com/api/daerahindonesia/provinsi', //URL to hit
        method: 'GET', // specify the request type
    }, function (error, response, body) {
        if (error) {
            res.json({
                success: false,
                province: null
            });
        } else {
            getProjectByID(req.params.project_id, function (error, project) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                }
                if (!project) {
                    error_message = "Proyek tidak tersedia";
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                }
                else {
                    if (project.basic[0].province.length != 0) {
                        province_id = project.basic[0].province[0].province_id;
                    }
                    Category.find(function (error, all_category) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                        
                        let data = {
                            url: 'edit-project',
                            project: project, 
                            all_category: all_category,
                            province: JSON.parse(body).semuaprovinsi,
                            province_id: province_id
                        }
                        return res.render('pages/admin/project/edit', data);
                    })
                    
                }
            });
        }
    });
    
});
router.get('/project/waiting/:project_id/reject', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let data = {
        status: "rejected"
    }
    updateProject(req.params.project_id, data, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        }
        else {
            success_message = "Proyek berhasil ditolak";
            req.flash('success_message', success_message);
            return res.redirect(`/admin/project/rejected/`);
        }
    });
});
router.get('/project/rejected/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        else {

            let data = {
                url: 'rejected-detail-project',
                project: project
            }
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/open/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/open');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/open');
        }
        else {
            let data = {
                url: 'open-detail-project',
                project: project
            }
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/done/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        else {

            let data = {
                url: 'done-detail-project',
                project: project
            }
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/category', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    Category.find(function(error, categories) {
        let data = {
            url: "category",
            categories: categories
        }
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            res.render('pages/admin/project/category', data);
        }
    });
});
router.get('/project/add-category', isLoggedIn, isAdmin, function (req, res) {
    let data = {
        url: "add-category",
    }
    res.render('pages/admin/project/add-category', data);
});
router.get('/transaction/waiting-payment', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let createdAt = [];
    let due_date = [];
    let expired = [];
    getTransactionByStatus('waiting_payment', function (error, transactions) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            transactions.forEach((transaction, index) => {
                createdAt[index] = moment(transaction.createdAt).format('LL');
                due_date[index] = moment(transaction.due_date).format('lll');
                if (moment.duration(moment(transaction.due_date).diff(moment()))._milliseconds > 0) {
                    expired[index] = false;
                }
                else {
                    expired[index] = true;
                }
            });
    
            let data = {
                user_id: req.user._id,
                transactions: transactions,
                createdAt: createdAt,
                due_date: due_date,
                expired: expired,
                url: "waiting-payment-transaction"
            }
            return res.render('pages/admin/transaction/waiting-payment', data);
        } 
    });
});
router.get('/transaction/waiting-verification', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let createdAt = [];
    let due_date = [];
    let payment_date = [];
    getTransactionByStatus('waiting_verification', function (error, transactions) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            Signature.find({}, function (error, signatures) {
                if (error) {
                    error_message = "Terjadi kesalahan.";
                    req.flash('error_message', error_message);
                    return res.redirect('/admin/dashboard');
                }
                else {
                    transactions.forEach((transaction, index) => {
                        createdAt[index] = moment(transaction.createdAt).format('LL');
                        due_date[index] = moment(transaction.due_date).format('lll');
                        payment_date[index] = moment(transaction.payment_date).format('lll');
                    });
            
                    let data = {
                        user_id: req.user._id,
                        transactions: transactions,
                        createdAt: createdAt,
                        due_date: due_date,
                        payment_date: payment_date,
                        signatures: signatures,
                        url: "waiting-verification-transaction"
                    }
                    return res.render('pages/admin/transaction/waiting-verification', data);
                }
            });
        } 
    });
});
router.get('/transaction/rejected', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let createdAt = [];
    let due_date = [];
    let payment_date = [];
    getTransactionByStatus('rejected', function (error, transactions) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            transactions.forEach((transaction, index) => {
                createdAt[index] = moment(transaction.createdAt).format('LL');
                due_date[index] = moment(transaction.due_date).format('lll');
                if (transaction.payment_date == null) {
                    payment_date[index] = null;
                }
                else {
                    payment_date[index] = moment(transaction.payment_date).format('lll');
                }
            });
    
            let data = {
                user_id: req.user._id,
                transactions: transactions,
                createdAt: createdAt,
                due_date: due_date,
                payment_date: payment_date,
                url: "rejected-transaction"
            }
            return res.render('pages/admin/transaction/rejected', data);
        } 
    });
});
router.get('/transaction/waiting/:transaction_id/verify', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;

    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/transaction/waiting-verification');
        }
        if (!transaction) {
            error_message = "Transaksi tidak tersedia.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/transaction/waiting-verification');
        }
        else {
            transaction.status = 'verified';
            transaction.save().then(transaction => {
                getProjectByID(transaction.project._id, async function (error, project) {
                    if (error) {
                        error_message = "Terjadi kesalahan.";
                        req.flash('error_message', error_message);
                        return res.redirect('/admin/transaction/waiting-verification');
                    }
                    else {
                        project.basic[0].stock[0].remain = project.basic[0].stock[0].remain-transaction.stock_quantity;
                        project.save().then( async () => {
                            try {
                                const browser = await puppeteer.launch();
                                const page = await browser.newPage();

                                let data = {
                                    project_title: project.basic[0].title,
                                    investor: transaction.investor.profile[0].name,
                                    stock_quantity: transaction.stock_quantity,
                                    payment_total: transaction.stock_quantity*project.basic[0].stock[0].price,
                                    verification_date: moment().format('LL')
                                }
    
                                const certificate = await compile('certificate', data);
                                const content = await compile('certificate-email', data);

                                await page.setContent(certificate);
                                await page.emulateMedia('screen');
                                await page.pdf({
                                    path: `storage/projects/${project._id}/transactions/${ transaction.receipt.slice(0, -4) + ".pdf" }`,
                                    width: '725px',
                                    height: '541px',
                                    printBackground: true
                                });
                                await browser.close();

                                let transporter = nodemailer.createTransport({
                                    host: 'smtp.gmail.com',
                                    port: 465,
                                    secure: true,
                                    auth: {
                                        user: 'investaninx@gmail.com',
                                        pass: 'investani2019'
                                    }
                                });
                                let mailOptions = {
                                    from: '"Investani" <investaninx@gmail.com>',
                                    to: transaction.investor.email,
                                    subject: "Sertifikat Investasi",
                                    html: content,
                                    attachments: [
                                        {
                                            filename: 'sertifikat investani.pdf',
                                            path: `storage/projects/${project._id}/transactions/${ transaction.receipt.slice(0, -4) + ".pdf" }`
                                        }
                                    ]
                                };
                        
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        error_message = "Email gagal terkirim"; 
                                        req.flash('error_message', error_message);
                                        return res.redirect('/admin/transaction/waiting-verification');
                                    }
                                    else {
                                        success_message = "Berhasil melakukan verifikasi transaksi."
                                        req.flash('success_message', success_message);
                                        return res.redirect('/admin/transaction/waiting-verification');    
                                    }
                                });  
                            } catch (e) {
                                error_message = "Terjadi kesalahan3.";
                                req.flash('error_message', error_message);
                                return res.redirect('/admin/transaction/waiting-verification');
                            }

                        }).catch(project => {
                            error_message = "Terjadi kesalahan4.";
                            req.flash('error_message', error_message);
                            return res.redirect('/admin/transaction/waiting-verification');
                        }); 
                    }
                });
            }).catch(transaction => {
                error_message = "Terjadi kesalahan4.";
                req.flash('error_message', error_message);
                return res.redirect('/admin/transaction/waiting-verification');
            });

        }
    });
});
router.get('/transaction/waiting/:transaction_id/reject', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/transaction/waiting-payment');
        }
        if (!transaction) {
            error_message = "Transaksi tidak tersedia.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/transaction/waiting-payment');
        }
        else {
            transaction.status = 'rejected';
            transaction.save().then(transaction => {
                getProjectByID(transaction.project._id, function (error, project) {
                    if (error) {
                        error_message = "Terjadi kesalahan.";
                        req.flash('error_message', error_message);
                        return res.redirect('/admin/transaction/waiting-payment');
                    }
                    else {
                        project.basic[0].stock[0].temp = project.basic[0].stock[0].temp+transaction.stock_quantity;
                        project.save().then(project => {
                            success_message = "Berhasil menolak transaksi."
                            req.flash('success_message', success_message);
                            return res.redirect('/admin/transaction/waiting-payment');
                        }).catch(project => {
                            error_message = "Terjadi kesalahan.";
                            req.flash('error_message', error_message);
                            return res.redirect('/admin/transaction/waiting-payment');
                        }); 
                    }
                });
            }).catch(transaction => {
                error_message = "Terjadi kesalahan.";
                req.flash('error_message', error_message);
                return res.redirect('/admin/transaction/waiting-payment');
            });

        }
    });
})
router.get('/transaction/get-receipt/:project_id/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/projects/'+req.params.project_id+'/transactions/'+req.params.filename);
});
router.get('/signature', isLoggedIn, isAdmin, function (req, res) {
    Signature.find({}, function (error, signatures) {
        if (error) {
            let error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                url: 'signature-list',
                signatures: signatures
            }
            return res.render('pages/admin/signature/signature', data);
        }
    });
});
router.get('/signature/add', isLoggedIn, isAdmin, function (req, res) {
    let data = {
        url: 'add-signature'
    }
    res.render('pages/admin/signature/add-signature', data);
});
router.get('/signature/get-signature/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/signatures/'+req.params.filename);
});

router.post('/user/investor/individual/verify/:id', isLoggedIn, isAdmin, function (req, res) {
    User.findByIdAndUpdate(req.params.id, {
        user_type: [{
            name: 'investor',
            status: 'verified',
        }]
    }, function (error, user) {
        if (error) {
            return res.json({success: false, message: "Terjadi kesalahan"});
        }
        if (!user) {
            res.json({success: false, message: "User tidak tersedia"});

        }
        else {
            return res.json({success: true, message: "Berhasil mengaktivasi investor"});
        }
    });
});
router.post('/user/investor/company/verify/:id', isLoggedIn, isAdmin, function (req, res) {
    User.findByIdAndUpdate(req.params.id, {
        user_type: [{
            name: 'investor',
            status: 'verified',
        }]
    }, function (error, user) {
        if (error) {
            return res.json({success: false, message: "Terjadi kesalahan"});
        }
        if (!user) {
            res.json({success: false, message: "User tidak tersedia"});

        }
        else {            
            return res.json({success: true, message: "Berhasil mengaktivasi investor"});
        }
    });
});
router.post('/user/inisiator/individual/verify/:id', isLoggedIn, isAdmin, function (req, res) {
    User.findByIdAndUpdate(req.params.id, {
        user_type: [{
            name: 'inisiator',
            status: 'verified',
            contract: ''
        }]
    }, function (error, user) {
        if (error) {
            return res.json({success: false, message: "Terjadi kesalahan"});
        }
        if (!user) {
            res.json({success: false, message: "User tidak tersedia"});

        }
        else {    
            res.json({success: true});
        }
    });
});
router.post('/project/waiting/verify/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    
    getProjectByID(req.params.project_id, function(error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        else {
            project.project[0].duration[0].start_campaign = moment().format();
            project.project[0].duration[0].due_campaign = moment().add(project.project[0].duration[0].campaign, 'days');
            project.project[0].duration[0].due_date = moment(project.project[0].duration[0].start_date).add(project.project[0].duration[0].duration, 'months');
            project.status = "verified";
            project.save().then(project => {
                success_message = "Berhasil memverifikasi proyek";
                req.flash('success_message', success_message);
                return res.redirect('/admin/project/waiting');
            }).catch(error => {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect('/admin/project/waiting');
            });
        }
    });
});
router.post('/project/waiting/:project_id/basic', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;

    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        } else {
            if (project.status == 'verified') {
                error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                req.flash('error_message', error_message);
                return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
            } else {
                req.checkBody('stock_price', 'Harga saham tidak boleh lebih dari 1 Juta Rupiah').isInt({
                    max: 1000000
                });
                req.checkBody('stock_price', 'Harga saham tidak boleh kurang dari 1 Rupiah').isInt({
                    min: 1
                });
                req.checkBody('stock_price', 'Harga saham wajib diisi').notEmpty();
                req.checkBody('total_stock', 'Jumlah saham tidak boleh lebih dari 1000').isInt({
                    max: 1000
                });
                req.checkBody('total_stock', 'Jumlah saham tidak boleh kurang dari 1').isInt({
                    min: 1
                });
                req.checkBody('total_stock', 'Jumlah saham wajib diisi').notEmpty();
                req.checkBody('category', 'Kategori tanaman wajib dipilih.').notEmpty();
                req.checkBody('city', 'Kota wajib dipilih.').notEmpty();
                req.checkBody('province', 'Provinsi wajib dipilih.').notEmpty();
                req.checkBody('title', 'Judul proyek tidak boleh lebih dari 250 karakter.').isLength({
                    max: 250
                });
                req.checkBody('title', 'Judul proyek tidak boleh kurang dari 10 karakter.').isLength({
                    min: 10
                });
                req.checkBody('title', 'Judul proyek wajib diisi.').notEmpty();

                let errors = req.validationErrors();

                if (errors) {
                    error_message = errors[errors.length - 1].msg;
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                } else {
                    let data = {
                        basic: {
                            title: req.body.title,
                            province: {
                                province_id: req.body.province,
                                province_name: req.body.province_name
                            },
                            city: {
                                city_id: req.body.city,
                                city_name: req.body.city_name
                            },
                            stock: {
                                total: req.body.total_stock,
                                price: req.body.stock_price
                            },
                        },
                        category: req.body.category,
                        sub_category: req.body.sub_category
                    }
                    updateProject(req.params.project_id, data, function (error, project) {
                        if (error) {
                            error_message = "Terjadi kesalahan update";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                        if (!project) {
                            error_message = "Proyek tidak tersedia";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        } else {
                            success_message = "Berhasil memperbarui proyek";
                            req.flash('success_message', success_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                    });
                }
            }
        }
    });
});
router.post('/project/waiting/:project_id/budget', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let budget = [];
    let total_budget = 0;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
        } else {
            if (project.status == 'verified') {
                error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                req.flash('error_message', error_message);
                return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
            } else {
                req.body.budget_items.budget_items.forEach((budget_item, index) => {
                    budget[index] = {
                        description: budget_item.description,
                        activity_date: budget_item.activity_date,
                        amount: budget_item.amount
                    }
                    total_budget = total_budget + parseInt(budget_item.amount);
                    req.checkBody(`budget_items[budget_items][${index}][amount]`, 'Anggaran tidak boleh kurang dari 1 Rupiah').isInt({
                        min: 1
                    });
                    req.checkBody(`budget_items[budget_items][${index}][amount]`, 'Anggaran wajib diisi').notEmpty();
                    req.checkBody(`budget_items[budget_items][${index}][activity_date]`, `Tanggal Kegiatan ${index+1} wajib diisi`).notEmpty();
                    req.checkBody(`budget_items[budget_items][${index}][description]`, `Nama Kegiatan ${index+1} tidak boleh lebih dari 250 karakter`).isLength({
                        max: 250
                    });
                    req.checkBody(`budget_items[budget_items][${index}][description]`, `Nama Kegiatan ${index+1} tidak boleh kurang dari 5 karakter`).isLength({
                        min: 5
                    });
                    req.checkBody(`budget_items[budget_items][${index}][description]`, `Nama Kegiatan ${index+1} wajib diisi`).notEmpty();
                });


                let errors = req.validationErrors();

                if (errors) {
                    error_message = errors[errors.length - 1].msg;
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                }
                if (total_budget != project.basic[0].stock[0].price*project.basic[0].stock[0].total) {
                    error_message = "Anggaran proyek tidak sesuai dengan perhitungan saham";
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                }
                else {
                    let data = {
                        budget: budget
                    };

                    updateProject(req.params.project_id, data, function (error, project) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                        if (!project) {
                            error_message = "Proyek tidak tersedia";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        } else {
                            success_message = "Berhasil memperbarui proyek";
                            req.flash('success_message', success_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                    });
                }
            }
        }
    });
});
router.post('/project/waiting/:project_id/project', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    req.checkBody('duration', 'Durasi proyek tidak boleh lebih dari 12 bulan').isInt({
        max: 12
    });
    req.checkBody('duration', 'Durasi proyek tidak boleh kurang dari 1 bulan').isInt({
        min: 1
    });
    req.checkBody('duration', 'Durasi proyek wajib diisi').notEmpty();
    req.checkBody('roi', 'Imbal hasil tidak boleh lebih dari 100%').isInt({
        max: 100
    });
    req.checkBody('roi', 'Imbal hasil tidak boleh kurang dari 0%').isInt({
        min: 0
    });
    req.checkBody('roi', 'Imbal hasil wajib diisi').notEmpty();
    req.checkBody('start_date', 'Tanggal proyek dimulai wajib diisi').notEmpty();
    req.checkBody('campaign', 'Durasi Kampanye proyek wajib dipilih').notEmpty();
    req.checkBody('unit_value', 'Nilai Satuan tidak boleh kurang dari 1.').isNumeric({
        min: 1
    });
    req.checkBody('unit_value', 'Nilai Satuan wajib diisi.').notEmpty();

    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
        } else {
            if (project.status == 'verified') {
                error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                req.flash('error_message', error_message);
                return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
            } else {
                req.checkBody('abstract', 'Abstrak proyek wajib diisi.').notEmpty();
                let errors = req.validationErrors();
                if (errors) {
                    error_message = errors[errors.length - 1].msg;
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                } else {
                    let data = {
                        project: [{
                            unit_value: req.body.unit_value,
                            duration: {
                                start_campaign: null,
                                due_campaign: null,
                                campaign: req.body.campaign,
                                start_date: req.body.start_date,
                                due_date: null,
                                duration: req.body.duration
                            },
                            roi: req.body.roi,
                            abstract: req.body.abstract,
                            prospectus: project.project[0].prospectus
                        }]
                    };
                    updateProject(req.params.project_id, data, function (error, project) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                        if (!project) {
                            error_message = "Proyek tidak tersedia";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        } else {
                            success_message = "Berhasil memperbarui proyek";
                            req.flash('success_message', success_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                        }
                    });

                }
            }
        }
    });
});
let ImageUpload = upload.fields([
    {
        name: 'project_image0',
        maxCount: 1
    },
    {
        name: 'project_image1',
        maxCount: 1
    },
    {
        name: 'project_image2',
        maxCount: 1
    }
]);
router.post('/project/waiting/:project_id/image', isLoggedIn, isAdmin, function (req, res) {
    ImageUpload(req, res, function (err) {
        let error_message;
        let success_message;
        let project_image = [];
        const dir = path.join(__dirname, `../storage/projects/${req.params.project_id}/images`);
        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar terlalu besar";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
        } else if (err) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
        }
        
        getProjectByID(req.params.project_id, function (error, project) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
            }
            if (!project) {
                error_message = "Proyek tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
            } else {
                if (project.status == 'verified') {
                    error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                } else {
                    fs.access(dir, async (err) => {
                        const imagePath = path.join(__dirname, `../storage/projects/${req.params.project_id}/images`);
                        const imageUpload = new Resize(imagePath);
                        if (err) {
                            fs.mkdir(dir, async (err) => {
                                if (err) {
                                    error_message = "Terjadi Kesalahan";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                } else {
                                    if (req.files['project_image0'] || req.files['project_image1'] || req.files['project_image2']) {
                                        if (req.files['project_image0']) {
                                            project_image.push(await imageUpload.save(req.files['project_image0'][0].buffer));
                                        }
                                        if (req.files['project_image1']) {
                                            project_image.push(await imageUpload.save(req.files['project_image1'][0].buffer));
                                        }
                                        if (req.files['project_image2']) {
                                            project_image.push(await imageUpload.save(req.files['project_image2'][0].buffer));
                                        }
                                        let image = [{
                                                filename: project_image[0]
                                            },
                                            {
                                                filename: project_image[1]
                                            },
                                            {
                                                filename: project_image[2]
                                            }
                                        ];
                                        let data = {
                                            image: image
                                        };
                                        updateProject(req.params.project_id, data, function (error, project) {
                                            if (error) {
                                                error_message = "Terjadi kesalahan";
                                                req.flash('error_message', error_message);
                                                return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                            }
                                            if (!project) {
                                                error_message = "Proyek tidak tersedia";
                                                req.flash('error_message', error_message);
                                                return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                            } else {
                                                success_message = "Berhasil memperbarui proyek";
                                                req.flash('success_message', success_message);
                                                return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                            }
                                        });
                                    } else {
                                        error_message = "Gambar proyek wajib diunggah";
                                        req.flash('error_message', error_message);
                                        return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                    }
                                }
                            });
                        } else {
                            if (req.files['project_image0']) {
                                project_image.push(await imageUpload.save(req.files['project_image0'][0].buffer));
                            } else {
                                project_image.push(req.body.project_image0_input);
                            }
                            if (req.files['project_image1']) {
                                project_image.push(await imageUpload.save(req.files['project_image1'][0].buffer));
                            } else {
                                project_image.push(req.body.project_image1_input);
                            }
                            if (req.files['project_image2']) {
                                project_image.push(await imageUpload.save(req.files['project_image2'][0].buffer));
                            } else {
                                project_image.push(req.body.project_image2_input);
                            }
                            let image = [{
                                    filename: project_image[0]
                                },
                                {
                                    filename: project_image[1]
                                },
                                {
                                    filename: project_image[2]
                                }
                            ];
                            let data = {
                                image: image
                            };
                            updateProject(req.params.project_id, data, function (error, project) {
                                if (error) {
                                    error_message = "Terjadi kesalahan";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                }
                                if (!project) {
                                    error_message = "Proyek tidak tersedia";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                } else {
                                    success_message = "Berhasil memperbarui proyek";
                                    req.flash('success_message', success_message);
                                    return res.redirect(`/admin/project/waiting/${req.params.project_id}/edit`);
                                }
                            });
                        }
                    });
                }
            }
        });
    });
});
router.post('/project/add-category', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;

    let sub_category = [
        {
            name: null
        },
        {
            name: null
        },
        {
            name: null
        },
        {
            name: null
        },
        {
            name: null
        }
    ];

    for (let i = 0; i < req.body.sub_category.sub_category.length; i++) {
        sub_category[i] = {
            name: req.body.sub_category.sub_category[i].name,
        }
    }

    req.checkBody('description', 'Deskripsi kategori wajib diisi.').notEmpty();
    req.checkBody('unit', 'Unit kategori wajib diisi.').notEmpty();
    req.checkBody('title', 'Judul kategori wajib diisi.').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        error_message = errors[errors.length - 1].msg;
        req.flash('error_message', error_message);
        return res.redirect('/admin/project/add-category');
    }
    else {
        let data = {
            title: req.body.title,
            unit: req.body.unit,
            description: req.body.description,
            sub_category: sub_category
        }
        let category = new Category(data);
        createCategory(category, function(error) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect('/admin/project/add-category');
            }
            else {
                success_message = "Berhasil menambah kategori proyek.";
                req.flash('success_message', success_message);
                return res.redirect('/admin/project/add-category');
            }
        });
    }
});
let signatureUpload = upload.fields([
    {
        name: 'signature',
        maxCount: 1
    }
]);
router.post('/signature/add', isLoggedIn, isAdmin, function (req, res) {
    signatureUpload(req, res, async function (err) {
        let success_message;
        let error_message;

        const dir = path.join(__dirname, '../storage/signatures');
        const imageUpload = new Resize(dir);
        
        req.checkBody('position', 'Jabatan wajib diisi.').notEmpty();
        req.checkBody('identity_number', 'NIK wajib diisi.').notEmpty();
        req.checkBody('full_name', 'Nama lengkap wajib diisi.').notEmpty();
        
        let errors = req.validationErrors();

        if (errors) {
            error_message = errors[errors.length - 1].msg;
            req.flash('error_message', error_message);
            return res.redirect('/admin/signature/add');
        }
        else {
            if (err instanceof multer.MulterError) {
                error_message = "Ukuran gambar terlalu besar";
                req.flash('error_message', error_message);
                return res.redirect(`/admin/signature/add`);
            } else if (err) {
                error_message = "Terjadi Kesalahan";
                req.flash('error_message', error_message);
                return res.redirect('/admin/signature/add');
            }
            else {
                if (req.files['signature']) {
                    let signature = await imageUpload.save(req.files['signature'][0].buffer);
                    let data = {
                        full_name: req.body.full_name,
                        identity_number: req.body.identity_number,
                        position: req.body.position,
                        signature: signature
                    }
                    let create_signature = new Signature(data);
                    createSignature(create_signature, function (error) {
                        if (error) {
                            error_message = "Terjadi Kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/signature/add`);
                        }
                        else {
                            success_message = "Berhasil menambah tanda tangan.";
                            req.flash('success_message', success_message);
                            return res.redirect(`/admin/signature/add`);
                        }
                    });
                }
                else {
                    error_message = "Tanda tangan wajib diunggah.";
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/signature/add`);
                }
            }
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

function isAdmin(req, res, next) {
    if (req.user.user_type[0].name == 'super_user' && req.user.user_type[0].status == 'verified') {
        next();
    }
    else {
        res.redirect('/');
    }
}

export default router;