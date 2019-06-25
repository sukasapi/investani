import express from 'express';
import { User, getUserByID } from '../models/User';
import { getProjectByStatus, getProjectByID, updateProject, Project } from '../models/Project';
import { Category, createCategory } from '../models/Category';
import { getTransactionByStatus, getTransactionById } from '../models/Transaction';
import { Signature, createSignature, getSignatureByID } from '../models/Signature';
import { Notification, createNotification, getNotificationByReceiverAndStatus, updateNotificationByEntity } from '../models/Notification';

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

const compile_email = async function (templateName, data) {
    const filePath = path.join(__dirname, '../storage/email/', `${templateName}.ejs`);
    const html = await fsExtra.readFile(filePath, 'utf-8');
    return ejs.render(html, data);
};

router.get('/', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/dashboard');
});
router.get('/dashboard', isLoggedIn, isAdmin, function (req, res) {
    getProjectByStatus("done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (moment.duration(moment(budget.activity_date).diff(moment(), 'days')) <= 3 && budget.status == 'waiting') {
                        let notification_data = {
                            status: 'unread',
                            entity: 'waiting_approval_withdraw',
                            description: 'Pencairan Menunggu Persetujuan',
                            url: '/admin/withdraw/waiting-approval',
                            budget_id: budget._id,
                            sender: req.user._id,
                            receiver: req.user._id
                        }
                        Notification.find({'budget_id': budget._id}, function(error, notifications) {
                            if (error) {
                                error_message = "Terjadi kesalahan";
                                req.flash('error_message', error_message);
                                return res.redirect('back');
                            }
                            if (!notifications) {
                                let notification = new Notification(notification_data)
                                createNotification(notification, function (error) {
                                    if (error) {
                                        error_message = "Terjadi kesalahan";
                                        req.flash('error_message', error_message);
                                        return res.redirect('back');   
                                    }
                                });
                            }
                        });
                        
                    }
                });
            });
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "dashboard",
                        notifications: notification
                    }
                    return res.render('pages/admin/dashboard', data);
                }
            });
        }
    });
    
});
router.get('/user', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/user/investor', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/user/investor/individual', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "individual-investor",
                        notifications: notification,
                        investors: users
                    }
                    return res.render('pages/admin/user/investor/individual', data);
                }
            });
        }
    });
});
router.get('/user/investor/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    getUserByID(req.params.id, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "individual-investor-detail",
                        notifications: notification,
                        user: user
                    }
                    return res.render('pages/admin/user/investor/detail', data);
                }
            });
        }
    });
});
router.get('/user/investor/company', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "company"}, function (error, users) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "company-investor",
                        notifications: notification,
                        investors: users
                    }
                    return res.render('pages/admin/user/investor/company', data);
                }
            });
        }
    });
});
router.get('/user/investor/company/:id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;

    getUserByID(req.params.id, function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "company-investor-detail",
                        notifications: notification,
                        user: user
                    }
                    return res.render('pages/admin/user/investor/detail', data);
                }
            });
        } 
    });
});
router.get('/user/inisiator', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/inisiator/individual');
});
router.get('/user/inisiator/individual', isLoggedIn, isAdmin, function (req, res) {

    User.find({'active': true, 'user_type.name': 'inisiator'}, function (error, users) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "inisiator",
                        notifications: notification,
                        inisiators: users
                    }
                    return res.render('pages/admin/user/inisiator/individual', data);
                }
            });
        }
    });
});
router.get('/user/inisiator/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    getUserByID(req.params.id, function (error, user) {   
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');   
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "inisiator-detail",
                        notifications: notification,
                        user: user
                    }
                    return res.render('pages/admin/user/inisiator/detail', data);
                }
            });
        }     
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
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        projects: projects,
                        durations: durations,
                        notifications: notification,
                        url: "waiting-project",
                    }
                    return res.render('pages/admin/project/waiting', data);
                }
            });
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
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        projects: projects,
                        durations: durations,
                        notifications: notification,
                        url: "rejected-project",
                    }
                    return res.render('pages/admin/project/rejected', data);
                }
            });
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
                if (moment.duration(moment(project.project[0].duration[0].due_campaign).diff(moment()))._milliseconds > 0 && project.basic[0].stock[0].remain > 0) {
                    open_projects[index] = project
                    durations[index] = moment(project.project[0].duration[0].due_campaign).diff(moment(), 'days');
                }
            });

            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        projects: open_projects,
                        durations: durations,
                        notifications: notification,
                        url: "open-project",
                    }
                    
                    return res.render('pages/admin/project/open', data);
                }
            });
        }
    });
});
router.get('/project/done', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let durations = [];
    let done_projects = [];

    getProjectByStatus("done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            projects.forEach((project, index) => {
                if (moment.duration(moment(project.project[0].duration[0].due_campaign).diff(moment()))._milliseconds < 0 || project.basic[0].stock[0].remain == 0) {
                    done_projects[index] = project
                    durations[index] = moment(project.project[0].duration[0].due_campaign).diff(moment(), 'days');
                }
            });

            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        projects: done_projects,
                        durations: durations,
                        notifications: notification,
                        url: "done-project",
                    }
                    return res.render('pages/admin/project/done', data);
                }
            });
        }
    });
});
router.get('/project/waiting/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let budget = [];
    let activity_date = [];
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    for (let i = 0; i < project.budget.length; i++) {
                        if (project.budget[i].activity_date === undefined) {
                            activity_date[i] = null;
                        } else {
                            activity_date[i] = moment(project.budget[i].activity_date).format('DD/MM/YYYY');
                        }
                        budget[i] = {
                            description: project.budget[i].description,
                            activity_date: activity_date[i],
                            amount: project.budget[i].amount
                        };
                    }
                    let data = {
                        url: 'waiting-detail-project',
                        project: project,
                        budget: budget,
                        start_date: moment(project.project[0].duration[0].start_date).format('DD/MM/YYYY'),
                        notifications: notification,
                    }
                    return res.render('pages/admin/project/detail', data);
                }
            });
        }
    });
});
router.get('/project/waiting/:project_id/edit', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let province_id = null;
    let budget = [];
    let activity_date = [];
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
                        getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                            if (error) {
                                error_message = "Terjadi kesalahan";
                                req.flash('error_message', error_message);
                                return res.redirect('back');   
                            }
                            else {
                                for (let i = 0; i < project.budget.length; i++) {
                                    if (project.budget[i].activity_date === undefined) {
                                        activity_date[i] = null;
                                    } else {
                                        activity_date[i] = moment(project.budget[i].activity_date).format('DD/MM/YYYY');
                                    }
                                    budget[i] = {
                                        description: project.budget[i].description,
                                        activity_date: activity_date[i],
                                        amount: project.budget[i].amount
                                    };
                                }
                                let data = {
                                    url: 'edit-project',
                                    project: project,
                                    budget: budget,
                                    start_date: moment(project.project[0].duration[0].start_date).format('DD/MM/YYYY'),
                                    all_category: all_category,
                                    province: JSON.parse(body).semuaprovinsi,
                                    province_id: province_id,
                                    notifications: notification
                                }
                                return res.render('pages/admin/project/edit', data);
                            }
                        });
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
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: 'rejected-detail-project',
                        project: project,
                        notifications: notification
                    }
                    return res.render('pages/admin/project/detail', data);
                }
            });
        }
    });
});
router.get('/project/open/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let budget_data = [];
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
            project.budget.forEach((budget, index) => {
                budget_data[index] = {
                    description: budget.description,
                    activity_date: moment(budget.activity_date).format('DD/MM/YYYY'),
                    amount: budget.amount
                };
            });
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: 'open-detail-project',
                        project: project,
                        budget: budget_data,
                        start_date: moment(project.project[0].duration[0].start_date).format('DD/MM/YYYY'),
                        notifications: notification
                    }
                    return res.render('pages/admin/project/detail', data);
                }
            });
        }
    });
});
router.get('/project/done/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let budget_data = [];
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/project/waiting');
        }
        else {
            project.budget.forEach((budget, index) => {
                budget_data[index] = {
                    description: budget.description,
                    activity_date: moment(budget.activity_date).format('DD/MM/YYYY'),
                    amount: budget.amount
                };
            });
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: 'done-detail-project',
                        project: project,
                        budget: budget_data,
                        start_date: moment(project.project[0].duration[0].start_date).format('DD/MM/YYYY'),
                        notifications: notification
                    }
                    return res.render('pages/admin/project/detail', data);
                }
            });
        }
    });
});
router.get('/project/category', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    Category.find(function(error, categories) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "category",
                        categories: categories,
                        notifications: notification
                    }
                    return res.render('pages/admin/project/category', data);
                }
            });
        }
    });
});
router.get('/project/add-category', isLoggedIn, isAdmin, function (req, res) {
    getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');   
        }
        else {
            let data = {
                url: "add-category",
                notifications: notification
            }
            return res.render('pages/admin/project/add-category', data);
        }
    });
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
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        user_id: req.user._id,
                        transactions: transactions,
                        createdAt: createdAt,
                        due_date: due_date,
                        expired: expired,
                        notifications: notification,
                        url: "waiting-payment-transaction"
                    }
                    return res.render('pages/admin/transaction/waiting-payment', data);
                }
            });
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

                    getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect('back');   
                        }
                        else {
                            let data = {
                                user_id: req.user._id,
                                transactions: transactions,
                                createdAt: createdAt,
                                due_date: due_date,
                                payment_date: payment_date,
                                signatures: signatures,
                                notifications: notification,
                                url: "waiting-verification-transaction"
                            }
                            return res.render('pages/admin/transaction/waiting-verification', data);
                        }
                    });
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
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        user_id: req.user._id,
                        transactions: transactions,
                        createdAt: createdAt,
                        due_date: due_date,
                        payment_date: payment_date,
                        notifications: notification,
                        url: "rejected-transaction"
                    }
                    return res.render('pages/admin/transaction/rejected', data);
                }
            });
        } 
    });
});
router.get('/transaction/waiting/:transaction_id/verify', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    if (req.query.position) {
        getSignatureByID(req.query.position, function (error, signature) {
            if (error) {
                error_message = "Terjadi kesalahan.";
                req.flash('error_message', error_message);
                return res.redirect('/admin/transaction/waiting-verification');
            }
            if (!signature) {
                error_message = "Transaksi tidak tersedia.";
                req.flash('error_message', error_message);
                return res.redirect('/admin/transaction/waiting-verification');
            }
            else {
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
                        getProjectByID(transaction.project._id, async function (error, project) {
                            if (error) {
                                error_message = "Terjadi kesalahan.";
                                req.flash('error_message', error_message);
                                return res.redirect('/admin/transaction/waiting-verification');
                            }
                            else {
                                try {
                                    const browser = await puppeteer.launch();
                                    const page = await browser.newPage();
                                    
                                    let data = {
                                        project_title: project.basic[0].title,
                                        investor: transaction.investor.profile[0].name,
                                        stock_quantity: transaction.stock_quantity,
                                        payment_total: transaction.stock_quantity*project.basic[0].stock[0].price,
                                        signature_name: signature.full_name,
                                        signature_position: signature.position,
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
                                            transaction.status = 'verified';
                                            transaction.save().then(transaction => {
                                                project.basic[0].stock[0].remain = project.basic[0].stock[0].remain-transaction.stock_quantity;
                                                if (project.basic[0].stock[0].remain == 0) {
                                                    project.status = 'done'
                                                }
                                                project.save().then(() => {
                                                    success_message = "Berhasil melakukan verifikasi transaksi."
                                                    req.flash('success_message', success_message);
                                                    return res.redirect('/admin/transaction/waiting-verification'); 
                                                }).catch(project => {
                                                    error_message = "Terjadi kesalahan.";
                                                    req.flash('error_message', error_message);
                                                    return res.redirect('/admin/transaction/waiting-verification');
                                                }); 
                                            }).catch(transaction => {
                                                error_message = "Terjadi kesalahan.";
                                                req.flash('error_message', error_message);
                                                return res.redirect('/admin/transaction/waiting-verification');
                                            });  
                                        }
                                    });  
                                } catch (e) {
                                    error_message = "Terjadi kesalahan.";
                                    req.flash('error_message', error_message);
                                    return res.redirect('/admin/transaction/waiting-verification');
                                }
                            }
                        });
                        
            
                    }
                });
            }
        });
    }
    else {
        error_message = "Pengesahan wajib dipilih.";
        req.flash('error_message', error_message);
        return res.redirect('/admin/transaction/waiting-verification');
    }
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
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: 'signature-list',
                        signatures: signatures,
                        notifications: notification,
                    }
                    return res.render('pages/admin/signature/signature', data);
                }
            });
        }
    });
});
router.get('/signature/add', isLoggedIn, isAdmin, function (req, res) {
    getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');   
        }
        else {
            let data = {
                url: 'add-signature',
                notifications: notification,
            }
            return res.render('pages/admin/signature/add-signature', data);
        }
    });
});
router.get('/signature/get-signature/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/signatures/'+req.params.filename);
});
// router.get('/withdraw/waiting-approval', isLoggedIn, isAdmin, function(req, res) {
//     let error_message;
//     let waiting_withdraws = [];
//     let budget_object = null;

//     getProjectByStatus("done", function (error, projects) {
//         if (error) {
//             error_message = "Terjadi kesalahan";
//             req.flash('error_message', error_message);
//             return res.redirect('/admin/dashboard');
//         }
//         else {
//             projects.forEach((project) => {
//                 project.budget.forEach((budget) => {
//                     if (!budget.alternative_activity_date && moment.duration(moment(budget.activity_date).diff(moment(), 'days')) <= 3 && budget.status == 'waiting') {
//                         budget_object = budget.toObject();
//                         budget_object.activity_date = moment(budget.activity_date).format('LL');
//                         budget_object.project_id = project._id;
//                         budget_object.project_title = project.basic[0].title;
//                         waiting_withdraws.push(budget_object);
//                     }
//                 });
//             });
//             updateNotificationByEntity({entity: 'waiting_approval_withdraw'}, {status: 'read'}, function (error) {
//                 if (error) {
//                     error_message = "Terjadi kesalahan";
//                     req.flash('error_message', error_message);
//                     return res.redirect('back');
//                 }
//                 else {
//                     getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
//                         if (error) {
//                             error_message = "Terjadi kesalahan";
//                             req.flash('error_message', error_message);
//                             return res.redirect('back');   
//                         }
//                         else {
//                             let data = {
//                                 url: "waiting-withdraw-approval",
//                                 waiting_withdraws: waiting_withdraws,
//                                 notifications: notification
//                             }
//                             return res.render('pages/admin/withdraw/waiting-approval', data);
//                         }
//                     });
//                 }
//             });
//         }
//     });
// });
// router.get('/withdraw/waiting-payment', isLoggedIn, isAdmin, function(req, res) {
//     let error_message;
//     let waiting_withdraws = [];
//     let budget_object = null;

//     getProjectByStatus("done", function (error, projects) {
//         if (error) {
//             error_message = "Terjadi kesalahan";
//             req.flash('error_message', error_message);
//             return res.redirect('/admin/dashboard');
//         }
//         else {
//             projects.forEach((project) => {
//                 project.budget.forEach((budget) => {
//                     if (!budget.alternative_activity_date && budget.status == 'approved') {
//                         budget_object = budget.toObject();
//                         budget_object.activity_date = moment(budget.activity_date).format('LL');
//                         budget_object.project_id = project._id;
//                         budget_object.project_title = project.basic[0].title;
//                         waiting_withdraws.push(budget_object);
//                     }
//                 });
//             });
//             getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
//                 if (error) {
//                     error_message = "Terjadi kesalahan";
//                     req.flash('error_message', error_message);
//                     return res.redirect('back');   
//                 }
//                 else {
//                     let data = {
//                         url: "waiting-withdraw-payment",
//                         waiting_withdraws: waiting_withdraws,
//                         notifications: notification,
//                     }
//                     return res.render('pages/admin/withdraw/waiting-payment', data);
//                 }
//             });
//         }
//     });
// });
// router.get('/withdraw/waiting-payment/:project_id/:budget_id', isLoggedIn, isAdmin, function(req, res) {
//     let error_message;
//     let budget_id = req.params.budget_id;
//     let budget_object = null;

//     getProjectByID(req.params.project_id, function (error, project) {
//         if (error) {
//             error_message = "Terjadi kesalahan";
//             req.flash('error_message', error_message);
//             return res.redirect('/admin/withdraw/waiting-payment');
//         }
//         if (!project) {
//             error_message = "Proyek tidak tersedia.";
//             req.flash('error_message', error_message);
//             return res.redirect('/admin/withdraw/waiting-payment');
//         }
//         else {
//             if (project.status == 'done' || project.status == 'verified') {
//                 project.budget.forEach((budget) => {
//                     if (budget._id.equals(budget_id)) {
//                         if (!budget.alternative_activity_date && budget.status == 'approved') {
//                             budget_object = budget.toObject();
//                             budget_object.activity_date = moment(budget.activity_date).format('LL');
//                             getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
//                                 if (error) {
//                                     error_message = "Terjadi kesalahan";
//                                     req.flash('error_message', error_message);
//                                     return res.redirect('back');   
//                                 }
//                                 else {
//                                     let data = {
//                                         url: "waiting-withdraw-payment-detail",
//                                         project: project,
//                                         budget: budget_object,
//                                         notifications: notification,
//                                     }
//                                     return res.render('pages/admin/withdraw/detail', data);
//                                 }
//                             });
//                         }
//                     }
//                 });
//             }
//             else {
//                 error_message = "Proyek tidak tersedia.";
//                 req.flash('error_message', error_message);
//                 return res.redirect('/admin/withdraw/waiting-payment');
//             }
//         }
//     });
// });
// router.get('/withdraw/rejected', isLoggedIn, isAdmin, function(req, res) {
//     let error_message;
//     let rejected_withdraws = [];
//     let budget_object = null;

//     getProjectByStatus("done", function (error, projects) {
//         if (error) {
//             error_message = "Terjadi kesalahan";
//             req.flash('error_message', error_message);
//             return res.redirect('/admin/dashboard');
//         }
//         else {
//             projects.forEach((project) => {
//                 project.budget.forEach((budget) => {
//                     if (!budget.alternative_activity_date && budget.status == 'rejected') {
//                         budget_object = budget.toObject();
//                         budget_object.activity_date = moment(budget.activity_date).format('LL');
//                         budget_object.project_id = project._id;
//                         budget_object.project_title = project.basic[0].title;
//                         rejected_withdraws.push(budget_object);
//                     }
//                 });
//             });

//             getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
//                 if (error) {
//                     error_message = "Terjadi kesalahan";
//                     req.flash('error_message', error_message);
//                     return res.redirect('back');   
//                 }
//                 else {
//                     let data = {
//                         url: "rejected-withdraw",
//                         rejected_withdraws: rejected_withdraws,
//                         notifications: notification
//                     }
                    
//                     return res.render('pages/admin/withdraw/rejected', data);
//                 }
//             });
//         }
//     });
// });
router.get('/withdraw/waiting/:project_id/:budget_id/approve', isLoggedIn, isAdmin, function(req, res) {
    let success_message;
    let error_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        else {
            project.budget.forEach((budget, index) => {
                if (budget._id.equals(req.params.budget_id)) {
                    project.budget[index].status = 'approved';
                    project.save().then(project => {
                        success_message = "Kegiatan dan anggaran berhasil disetujui";
                        req.flash('success_message', success_message);
                        if (!budget.alternative_amount) {
                            return res.redirect(`/admin/withdraw/waiting-payment/${project._id}/${budget._id}`);
                        }
                        else {
                            return res.redirect(`/admin/withdraw/alternative/waiting-payment/${project._id}/${budget._id}`);
                        }
                    }).catch(error => {
                        error_message = "Terjadi kesalahan";
                        req.flash('error_message', error_message);
                        return res.redirect('back');
                    });
                }
            });
        }
    });
});
router.get('/withdraw/waiting/:project_id/:budget_id/reject', isLoggedIn, isAdmin, function(req, res) {
    let success_message;
    let error_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/withdraw/waiting-approval');
        }
        else {
            project.budget.forEach((budget, index) => {
                if (budget._id.equals(req.params.budget_id)) {
                    project.budget[index].status = 'rejected';
                    project.save().then(project => {
                        success_message = "Kegiatan dan anggaran berhasil ditolak";
                        req.flash('success_message', success_message);
                        return res.redirect('/admin/withdraw/waiting-approval');
                    }).catch(error => {
                        error_message = "Terjadi kesalahan";
                        req.flash('error_message', error_message);
                        return res.redirect('/admin/withdraw/waiting-approval');
                    });
                }
            });
        }
    });
});
// router.get('/withdraw/paid', isLoggedIn, isAdmin, function(req, res) {
//     let error_message;
//     let paid_withdraws = [];
//     let budget_object = null;

//     getProjectByStatus("done", function (error, projects) {
//         if (error) {
//             error_message = "Terjadi kesalahan";
//             req.flash('error_message', error_message);
//             return res.redirect('/admin/dashboard');
//         }
//         else {
//             projects.forEach((project) => {
//                 project.budget.forEach((budget) => {
//                     if (!budget.alternative_activity_date && budget.status == 'paid') {
//                         budget_object = budget.toObject();
//                         budget_object.activity_date = moment(budget.activity_date).format('LL');
//                         budget_object.project_id = project._id;
//                         budget_object.project_title = project.basic[0].title;
//                         paid_withdraws.push(budget_object);
//                     }
//                 });
//             });

//             getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
//                 if (error) {
//                     error_message = "Terjadi kesalahan";
//                     req.flash('error_message', error_message);
//                     return res.redirect('back');   
//                 }
//                 else {
//                     let data = {
//                         url: "paid-withdraw-approval",
//                         paid_withdraws: paid_withdraws,
//                         notifications: notification
//                     }
                    
//                     return res.render('pages/admin/withdraw/paid', data);
//                 }
//             });
//         }
//     });
// });
router.get('/withdraw/alternative/waiting-approval', isLoggedIn, isAdmin, function(req, res) {
    let error_message;
    let waiting_withdraws = [];
    let budget_object = null;
    Project.find({ $or: [{status: "done"}, {status: "verified"}] }, function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.alternative_activity_date && budget.status == 'waiting') {
                        budget_object = budget.toObject();
                        budget_object.alternative_activity_date = moment(budget.alternative_activity_date).format('LL');
                        budget_object.project_id = project._id;
                        budget_object.project_title = project.basic[0].title;
                        waiting_withdraws.push(budget_object);
                    }
                });
            });
            updateNotificationByEntity({entity: 'waiting_approval_alternative_withdraw'}, {status: 'read'}, function (error) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');
                }
                else {
                    getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect('back');   
                        }
                        else {
                            let data = {
                                url: "waiting-withdraw-approval-alternative",
                                waiting_withdraws: waiting_withdraws,
                                notifications: notification
                            }
                            return res.render('pages/admin/withdraw/waiting-approval-alternative', data);
                        }
                    });
                }
            });
        }
    }).sort({ createdAt: -1 });
    // getProjectByStatus("done", function (error, projects) {
    //     if (error) {
    //         error_message = "Terjadi kesalahan";
    //         req.flash('error_message', error_message);
    //         return res.redirect('/admin/dashboard');
    //     }
    //     else {
    //         projects.forEach((project) => {
    //             project.budget.forEach((budget) => {
    //                 if (budget.alternative_activity_date && budget.status == 'waiting') {
    //                     budget_object = budget.toObject();
    //                     budget_object.alternative_activity_date = moment(budget.alternative_activity_date).format('LL');
    //                     budget_object.project_id = project._id;
    //                     budget_object.project_title = project.basic[0].title;
    //                     waiting_withdraws.push(budget_object);
    //                 }
    //             });
    //         });
    //         updateNotificationByEntity({entity: 'waiting_approval_alternative_withdraw'}, {status: 'read'}, function (error) {
    //             if (error) {
    //                 error_message = "Terjadi kesalahan";
    //                 req.flash('error_message', error_message);
    //                 return res.redirect('back');
    //             }
    //             else {
    //                 getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
    //                     if (error) {
    //                         error_message = "Terjadi kesalahan";
    //                         req.flash('error_message', error_message);
    //                         return res.redirect('back');   
    //                     }
    //                     else {
    //                         let data = {
    //                             url: "waiting-withdraw-approval-alternative",
    //                             waiting_withdraws: waiting_withdraws,
    //                             notifications: notification
    //                         }
                            
    //                         return res.render('pages/admin/withdraw/waiting-approval-alternative', data);
    //                     }
    //                 });
    //             }
    //         });

            
    //     }
    // });
});
router.get('/withdraw/alternative/waiting-payment', isLoggedIn, isAdmin, function(req, res) {
    let error_message;
    let waiting_withdraws = [];
    let budget_object = null;

    Project.find({ $or: [{status: "done"}, {status: "verified"}] }, function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.alternative_activity_date && budget.status == 'approved') {
                        budget_object = budget.toObject();
                        budget_object.alternative_activity_date = moment(budget.alternative_activity_date).format('LL');
                        budget_object.project_id = project._id;
                        budget_object.project_title = project.basic[0].title;
                        waiting_withdraws.push(budget_object);
                    }
                });
            });

            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "waiting-withdraw-payment-alternative",
                        waiting_withdraws: waiting_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/admin/withdraw/waiting-payment-alternative', data);
                }
            });
        }
    });
});
router.get('/withdraw/alternative/waiting-payment/:project_id/:budget_id', isLoggedIn, isAdmin, function(req, res) {
    let error_message;
    let budget_id = req.params.budget_id;
    let budget_object = null;

    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/withdraw/waiting-payment');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/withdraw/waiting-payment');
        }
        else {
            if (project.status == 'done' || project.status == 'verified') {
                project.budget.forEach((budget) => {
                    if (budget._id.equals(budget_id)) {
                        if (budget.alternative_activity_date && budget.status == 'approved') {
                            budget_object = budget.toObject();
                            budget_object.alternative_activity_date = moment(budget.alternative_activity_date).format('LL');
                            
                            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                                if (error) {
                                    error_message = "Terjadi kesalahan";
                                    req.flash('error_message', error_message);
                                    return res.redirect('back');   
                                }
                                else {
                                    let data = {
                                        url: "waiting-withdraw-payment-detail-alternative",
                                        project: project,
                                        budget: budget_object,
                                        notifications: notification
                                    }
                                    return res.render('pages/admin/withdraw/detail-alternative', data);
                                }
                            });
                        }
                    }
                });
            }
            else {
                error_message = "Proyek tidak tersedia.";
                req.flash('error_message', error_message);
                return res.redirect('/admin/withdraw/waiting-payment');
            }
        }
    });
});
router.get('/withdraw/alternative/rejected', isLoggedIn, isAdmin, function(req, res) {
    let error_message;
    let rejected_withdraws = [];
    let budget_object = null;

    getProjectByStatus("done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.alternative_activity_date && budget.status == 'rejected') {
                        budget_object = budget.toObject();
                        budget_object.alternativa_activity_date = moment(budget.alternativa_activity_date).format('LL');
                        budget_object.project_id = project._id;
                        budget_object.project_title = project.basic[0].title;
                        rejected_withdraws.push(budget_object);
                    }
                });
            });

            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "rejected-withdraw-alternative",
                        rejected_withdraws: rejected_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/admin/withdraw/rejected-alternative', data);
                }
            });
        }
    });
});
router.get('/withdraw/alternative/paid', isLoggedIn, isAdmin, function(req, res) {
    let error_message;
    let paid_withdraws = [];
    let budget_object = null;

    getProjectByStatus("done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.alternative_activity_date && budget.status == 'paid') {
                        budget_object = budget.toObject();
                        budget_object.alternative_activity_date = moment(budget.alternative_activity_date).format('LL');
                        budget_object.project_id = project._id;
                        budget_object.project_title = project.basic[0].title;
                        paid_withdraws.push(budget_object);
                    }
                });
            });

            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: "paid-withdraw-approval-alternative",
                        paid_withdraws: paid_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/admin/withdraw/paid-alternative', data);
                }
            });
        }
    });
});
router.get('/withdraw/get-receipt/:project_id/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/projects/'+req.params.project_id+'/budget/'+req.params.filename);
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
            return res.json({success: false, message: "Terjadi kesalahan."});
        }
        if (!user) {
            res.json({success: false, message: "User tidak tersedia."});

        }
        else {    
            res.json({success: true, message: "Berhasil melakukan verifikasi."});
        }
    });
});
router.post('/project/waiting/verify/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let user_email = [];
    
    getProjectByID(req.params.project_id, function(error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
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
                User.find({'user_type.name': 'investor', 'user_type.status': 'verified'}, async function (error, users) {
                    if (error) {
                        error_message = "Terjadi kesalahan";
                        req.flash('error_message', error_message);
                        return res.redirect('back');
                    }
                    else {
                        users.forEach(user => {
                            user_email.push(user.email);
                        });
                        let transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 465,
                            secure: true,
                            auth: {
                                user: 'investaninx@gmail.com',
                                pass: 'investani2019'
                            }
                        });
    
                        const content = await compile_email('project_promotion', {project: project});
                        let mailOptions = {
                            from: '"Investani" <investaninx@gmail.com>',
                            to: user_email,
                            subject: "Telah Dibuka! " + project.basic[0].title + " + ROI hingga" + project.project[0].roi + "%, " + project.project[0].duration[0].duration,
                            html: content
                        };
    
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                error_message = "Email gagal terkirim"; 
                                req.flash('error_message', error_message);
                                return res.redirect('back');
                            }
                            else {
                                success_message = "Berhasil memverifikasi proyek";
                                req.flash('success_message', success_message);
                                return res.redirect('/admin/project/waiting');    
                            }
                        });
                    }
                });
            }).catch(error => {
                error_message = "Verifikasi proyek gagall.";
                req.flash('error_message', error_message);
                return res.redirect('/admin/project/waiting');
            });
        }
    });
});
router.post('/project/waiting/:project_id/basic', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    req.body.stock_price = parseInt(req.body.stock_price.split('.').join(""));
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
                if (req.body.total_stock) {
                    req.checkBody('max_invest', `Saham maksimal per investor tidak boleh lebih dari ${req.body.total_stock} lembar`).isInt({
                        max: req.body.total_stock
                    });
                }
                req.checkBody('max_invest', 'Saham maksimal per investor tidak boleh kurang dari 1 lembar').isInt({
                    min: 1
                });
                req.checkBody('max_invest', 'Saham maksimal per investor wajib diisi').notEmpty();
                req.checkBody('total_stock', 'Jumlah saham tidak boleh lebih dari 1000').isInt({
                    max: 1000
                });
                req.checkBody('total_stock', 'Jumlah saham tidak boleh kurang dari 1').isInt({
                    min: 1
                });
                req.checkBody('stock_price', 'Harga saham tidak boleh lebih dari 1 Juta Rupiah').isInt({
                    max: 1000000
                });
                req.checkBody('stock_price', 'Harga saham tidak boleh kurang dari 1 Rupiah').isInt({
                    min: 1
                });
                req.checkBody('stock_price', 'Harga saham wajib diisi').notEmpty();
                req.checkBody('total_stock', 'Jumlah saham wajib diisi').notEmpty();
                req.checkBody('sub_category', 'Sub-kategori proyek wajib dipilih.').notEmpty();
                req.checkBody('category', 'Kategori proyek wajib dipilih.').notEmpty();
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
                                price: req.body.stock_price,
                                remain: req.body.total_stock,
                                temp: req.body.total_stock,
                                max_invest: req.body.max_invest
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

    req.body.budget_items.budget_items.forEach((budget_item, index) => {
        req.body.budget_items.budget_items[index].amount = parseInt(budget_item.amount.split('.').join(""));
    });
    
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
                        activity_date: moment(budget_item.activity_date, "DD-MM-YYYY").format('MM/DD/YYYY'),
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
    req.checkBody('campaign', 'Durasi Kampanye proyek tidak boleh kurang dari 10 hari.').isInt({
        min: 10
    });
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
                                start_date: moment(req.body.start_date, "DD-MM-YYYY").format('MM/DD/YYYY'),
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
let receiptUpload = upload.fields([{
    name: 'receipt',
    maxCount: 1
}]);
router.post('/withdraw/waiting-payment/:project_id/:budget_id', isLoggedIn, isAdmin, function (req, res) {
    receiptUpload(req, res, function (err) {
        let error_message;
        let success_message;
        const dir = path.join(__dirname, `../storage/projects/${req.params.project_id}/budget`);
        let receipt;
        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar terlalu besar";
            req.flash('error_message', error_message);
            return res.redirect('back');
        } else if (err) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        getProjectByID(req.params.project_id, async function (error, project) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect('back');
            }
            if (!project) {
                error_message = "Proyek tidak tersedia.";
                req.flash('error_message', error_message);
                return res.redirect('back');
            }
            else {
                if (project.status == 'done' || project.status == 'verified') {
                    const imageUpload = new Resize(dir);
                    if (req.files['receipt']) {
                        receipt = await imageUpload.save(req.files['receipt'][0].buffer)
                        project.budget.forEach((budget, index) => {
                            if (budget._id.equals(req.params.budget_id)) {
                                if (budget.status == 'approved') {
                                    project.budget[index].status = 'paid';
                                    project.budget[index].receipt = receipt;
                                    project.save().then(project => {
                                        let notification_url;
                                        let entity;
                                        let description;
                                        if (budget.alternative_activity_date) {
                                            entity = 'paid_alternative_withdraw';
                                            notification_url = '/inisiator/withdraw/alternative/paid';
                                            description = 'Pencairan Alternatif Masuk';
                                        }
                                        else {
                                            entity = 'paid_withdraw';
                                            notification_url = '/inisiator/withdraw/paid';
                                            description = 'Pencairan Masuk';
                                        }
                                        let notification_data = {
                                            status: 'unread',
                                            entity: entity,
                                            description: description,
                                            url: notification_url,
                                            budget_id: budget._id,
                                            sender: req.user._id,
                                            receiver: project.inisiator._id
                                        }
                                        let notification = new Notification(notification_data);
                                        createNotification(notification, function(error) {
                                            if (error) {
                                                error_message = "Terjadi kesalahan";
                                                req.flash('error_message', error_message);
                                                return res.redirect('back');
                                            }
                                            else {
                                                success_message = "Pencairan berhasil dilakukan.";
                                                req.flash('success_message', success_message);
                                                return res.redirect('/admin/withdraw/alternative/paid');
                                            }
                                        });
                                    }).catch(error => {
                                        error_message = "Terjadi kesalahan";
                                        req.flash('error_message', error_message);
                                        return res.redirect('back');
                                    });
                                }
                                else {
                                    if (!budget.alternative_activity_date) {
                                        error_message = "Kegiatan dan Anggaran tidak tersedia.";
                                        req.flash('error_message', error_message);
                                        return res.redirect('/admin/withdraw/alternative/waiting-payment');
                                    }
                                    else {
                                        error_message = "Kegiatan dan Anggaran tidak tersedia.";
                                        req.flash('error_message', error_message);
                                        return res.redirect('/admin/withdraw/alternative/alternative/waiting-payment');
                                    }
                                }
                            }
                        });
                    } else {
                        error_message = "Bukti transfer wajib diunggah.";
                        req.flash('error_message', error_message);
                        return res.redirect('back');
                    }
                }
                else {
                    error_message = "Proyek tidak tersedia.";
                    req.flash('error_message', error_message);
                    return res.redirect('back');
                }
            }
        });
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