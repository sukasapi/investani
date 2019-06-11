import express from 'express';
import request from 'request';
import multer from 'multer';
import {
    Project,
    createProject,
    updateProject,
    getProjectByID,
    getProjectByInisiator,
    getProjectByInisiatorAndStatus
} from '../models/Project';
import {
    Category
} from '../models/Category';
import { getTransactionByProject } from '../models/Transaction';
import { Notification, createNotification, getNotificationByReceiverAndStatus, updateNotificationByEntity } from '../models/Notification';
import path from 'path';
import uuidv4 from 'uuid/v4';
import Resize from '../Resize';
import upload from '../uploadMiddleware';
import fs from 'fs';
import moment from 'moment';

const router = express.Router();
const prospectusFilePath = path.join(__dirname, '../storage/prospectus');

const prospectusStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, prospectusFilePath)
    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}-prospectus.pdf`)
    }
})

const prospectusUpload = multer({
    storage: prospectusStorage,
    limits: {
        fileSize: 4 * 1024 * 1024,
    }
});

router.get('/dashboard', isLoggedIn, isInisiator, isVerified, function (req, res) {
    getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');   
        }
        else {
            let data = {
                user_id: req.user._id,
                notifications: notification,
                url: "dashboard"
            }
            res.render('pages/inisiator/dashboard', data);
        }
    });
});
router.get('/start-project', isLoggedIn, isInisiator, isVerified, function (req, res) {
    getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');   
        }
        else {
            let data = {
                user_id: req.user._id,
                notifications: notification,
                url: "start-project"
            }
            res.render('pages/inisiator/start-project', data);
        }
    });
});
router.get('/:user_id/started-project', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let durations = [];
    let inisiated_project = [];
    let error_message;
    
    getProjectByInisiator(req.params.user_id, function (error, projects) {
        projects.forEach((project, index) => {
            if (req.user._id == req.params.user_id) {
                inisiated_project[index] = project;
                if (project.status == 'draft' || project.status == 'waiting') {
                    durations[index] = null;
                }
                else {
                    durations[index] = moment(project.project[0].duration[0].due_campaign).diff(moment(), 'days')
                }
            }
        });
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/started-project');
        } else {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        user_id: req.user._id,
                        inisiator: req.user.profile[0].name,
                        projects: inisiated_project,
                        durations: durations,
                        notifications: notification,
                        url: "started-project"
                    }
                    res.render('pages/inisiator/started-project', data);
                }
            });
        }
    });
});
router.get('/project/:project_id/edit', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
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
            getProjectByID(req.params.project_id, function (error, project) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('/inisiator/start-project');
                }
                if (!project) {
                    error_message = "Proyek tidak tersedia";
                    req.flash('error_message', error_message);
                    return res.redirect('/inisiator/start-project');
                } else {
                    if (req.user._id.equals(project.inisiator._id)) {
                        let province_id, province_name, city_id, city_name, category, sub_category, unit_value, goal, start_campaign, due_campaign, campaign, start_date, roi, duration, stock_price, total_stock = null;
                        let budget = [];
                        let budget_not_null = 0;
                        let abstract, prospectus = null;
                        let activity_date = [];
                        let image = [];
                        let new_data = {};
                        let max_invest = 0;

                        if (project.basic[0].province.length != 0) {
                            province_id = project.basic[0].province[0].province_id;
                            province_name = project.basic[0].province[0].province_name;
                            city_id = project.basic[0].city[0].city_id;
                            city_name = project.basic[0].city[0].city_name;
                            category = project.category;
                            sub_category = project.sub_category;
                            stock_price = project.basic[0].stock[0].price;
                            total_stock = project.basic[0].stock[0].total;
                            max_invest = project.basic[0].stock[0].max_invest;
                        }

                        for (let i = 0; i < project.budget.length; i++) {
                            if (project.budget[i].activity_date === undefined) {
                                activity_date[i] = null;
                            } else {
                                activity_date[i] = project.budget[i].activity_date.toLocaleDateString();
                            }
                            budget[i] = {
                                description: project.budget[i].description,
                                activity_date: activity_date[i],
                                amount: project.budget[i].amount
                            };
                            if (budget[i].description != "") {
                                budget_not_null++
                            }
                        }
                        if (project.project.length != 0) {
                            unit_value = project.project[0].unit_value;
                            goal = project.project[0].goal;
                            campaign = project.project[0].duration[0].campaign;
                            start_date = project.project[0].duration[0].start_date.toLocaleDateString();
                            roi = project.project[0].roi;
                            duration = project.project[0].duration[0].duration;
                            abstract = project.project[0].abstract.replace('&', '&amp;');
                            prospectus = project.project[0].prospectus;
                        }
                        for (let i = 0; i < project.image.length; i++) {
                            if (project.image[i].filename !== undefined) {
                                image[i] = project.image[i].filename;
                            }
                        }

                        if (project.status == "draft") {
                            if (project.basic.length != 0 && project.budget.length != 0 && project.project.length != 0 && project.image.length != 0) {
                                new_data.status = "waiting";
                            }
                        }

                        updateProject(project._id, new_data, function (error, project) {
                            if (error) {
                                error_message = "Terjadi kesalahan";
                                req.flash('error_message', error_message);
                                return res.redirect(`/inisiator/project/${project._id}/edit`);
                            }
                            if (!project) {
                                error_message = "Proyek tidak tersedia";
                                req.flash('error_message', error_message);
                                return res.redirect(`/inisiator/project/${project._id}/edit`);
                            } else {
                                Category.find(function (error, all_category) {
                                    if (error) {
                                        error_message = "Terjadi kesalahan";
                                        req.flash('error_message', error_message);
                                        return res.redirect(`/inisiator/project/${project._id}/edit`);
                                    } else {
                                        getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                                            if (error) {
                                                error_message = "Terjadi kesalahan";
                                                req.flash('error_message', error_message);
                                                return res.redirect('back');   
                                            }
                                            else {
                                                let data = {
                                                    user_id: req.user._id,
                                                    project_id: project._id,
                                                    title: project.basic[0].title,
                                                    province: JSON.parse(body).semuaprovinsi,
                                                    province_id: province_id,
                                                    province_name: province_name,
                                                    city_id: city_id,
                                                    city_name: city_name,
                                                    category: category,
                                                    sub_category: sub_category,
                                                    unit_value: unit_value,
                                                    goal: goal,
                                                    start_campaign: start_campaign,
                                                    due_campaign: due_campaign,
                                                    campaign: campaign,
                                                    start_date: start_date,
                                                    roi: roi,
                                                    duration: duration,
                                                    stock_price: stock_price,
                                                    total_stock: total_stock,
                                                    max_invest: max_invest,
                                                    budget: budget,
                                                    budget_not_null: budget_not_null,
                                                    abstract: abstract,
                                                    prospectus: prospectus,
                                                    image: image,
                                                    status: project.status,
                                                    url: "edit-project",
                                                    all_category: all_category,
                                                    notifications: notification,
                                                }
                                                res.render('pages/inisiator/edit-project', data);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        error_message = "Proyek tidak tersedia";
                        req.flash('error_message', error_message);
                        return res.redirect('/inisiator/start-project');
                    }
                }
            });
        }
    });
});
router.get('/project/:project_id/transactions', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let verified_transaction = [];
    let createdAt = [];
    let due_date = [];
    let payment_date = [];
    getTransactionByProject(req.params.project_id, function (error, transactions) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/inisiator/${req.user._id}/started-project`);
        }
        if (transactions.length == 0) {
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        url: 'started-project-transaction',
                        transactions: verified_transaction,
                        createdAt: createdAt,
                        due_date: due_date,
                        payment_date: payment_date,
                        user_id: req.user._id,
                        notifications: notification,
                    }
                    return res.render('pages/inisiator/started-project-transaction', data);
                }
            });
        }
        else {
            if (req.user._id.equals(transactions[0].project.inisiator)) {
                transactions.forEach((transaction, index) => {
                    if (transaction.status == 'verified') {
                        verified_transaction[index] = transaction;
                        createdAt[index] = moment(transaction.createdAt).format('LL');
                        due_date[index] = moment(transaction.due_date).format('lll');
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
                            url: 'started-project-transaction',
                            transactions: verified_transaction,
                            createdAt: createdAt,
                            due_date: due_date,
                            payment_date: payment_date,
                            user_id: req.user._id,
                            notifications: notification,
                        }
                        return res.render('pages/inisiator/started-project-transaction', data);
                    }
                });
            }
            else {
                res.redirect('/inisiator/dashboard');
            }
            
        }
    });
});
router.get('/withdraw/waiting-approval', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let waiting_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (moment.duration(moment(budget.activity_date).diff(moment(), 'days')) <= 3 && budget.status == 'waiting') {
                        budget_object = budget.toObject();
                        budget_object.activity_date = moment(budget.activity_date).format('LL');
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
                        user_id: req.user._id,
                        url: "waiting-withdraw-approval",
                        waiting_withdraws: waiting_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/inisiator/withdraw/waiting-approval', data);
                }
            });
        }
    });
});
router.get('/withdraw/waiting-payment', isLoggedIn, isInisiator, isVerified, function(req, res) {
    let error_message;
    let waiting_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.status == 'approved') {
                        budget_object = budget.toObject();
                        budget_object.activity_date = moment(budget.activity_date).format('LL');
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
                        user_id: req.user._id,
                        url: "waiting-withdraw-payment",
                        waiting_withdraws: waiting_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/inisiator/withdraw/waiting-payment', data);
                }
            });
        }
    });
});
router.get('/withdraw/rejected', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let rejected_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.status == 'rejected') {
                        budget_object = budget.toObject();
                        budget_object.activity_date = moment(budget.activity_date).format('LL');
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
                        user_id: req.user._id,
                        url: "rejected-withdraw",
                        rejected_withdraws: rejected_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/inisiator/withdraw/rejected', data);
                }
            });
        }
    });
});
router.get('/withdraw/paid', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let paid_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.status == 'paid') {
                        budget_object = budget.toObject();
                        budget_object.activity_date = moment(budget.activity_date).format('LL');
                        budget_object.project_id = project._id;
                        budget_object.project_title = project.basic[0].title;
                        paid_withdraws.push(budget_object);
                    }
                });
            });

            updateNotificationByEntity({entity: 'paid_withdraw'}, {status: 'read'}, function (error) {
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
                                user_id: req.user._id,
                                url: "paid-withdraw",
                                paid_withdraws: paid_withdraws,
                                notifications: notification
                            }
                            
                            return res.render('pages/inisiator/withdraw/paid', data);
                        }
                    });
                }
            });
            
        }
    });
})
router.get('/withdraw/alternative', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let project_object = null;
    let waiting_budget = [];
    let project_data = []

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.status == 'waiting') {
                        waiting_budget.push(budget);
                    }
                });
                project_object = project.toObject();
                project_object.budget = waiting_budget;
                project_data.push(project_object);
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
                        url: "alternative-withdraw",
                        projects: project_data,
                        notifications: notification
                    }
                    
                    res.render('pages/inisiator/withdraw/alternative', data);
                }
            });
        }
    });
    

})
router.get('/withdraw/alternative/waiting-approval', isLoggedIn, isInisiator, isVerified, function (req, res) {
    // alternative_activity_date
    let error_message;
    let waiting_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
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
            
            getNotificationByReceiverAndStatus(req.user._id, "unread", function (error, notification) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect('back');   
                }
                else {
                    let data = {
                        user_id: req.user._id,
                        url: "waiting-withdraw-approval-alternative",
                        waiting_withdraws: waiting_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/inisiator/withdraw/waiting-approval-alternative', data);
                }
            });
        }
    });
});
router.get('/withdraw/alternative/waiting-payment', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let waiting_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
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
                        user_id: req.user._id,
                        url: "waiting-withdraw-payment-alternative",
                        waiting_withdraws: waiting_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/inisiator/withdraw/waiting-payment-alternative', data);
                }
            });
        }
    });
});
router.get('/withdraw/alternative/rejected', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let rejected_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
        }
        else {
            projects.forEach((project) => {
                project.budget.forEach((budget) => {
                    if (budget.alternative_activity_date && budget.status == 'rejected') {
                        budget_object = budget.toObject();
                        budget_object.alternative_activity_date = moment(budget.alternative_activity_date).format('LL');
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
                        user_id: req.user._id,
                        url: "rejected-withdraw-alternative",
                        rejected_withdraws: rejected_withdraws,
                        notifications: notification
                    }
                    
                    return res.render('pages/inisiator/withdraw/rejected-alternative', data);
                }
            });
        }
    });
});
router.get('/withdraw/alternative/paid', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let paid_withdraws = [];
    let budget_object = null;

    getProjectByInisiatorAndStatus(req.user._id, "done", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/dashboard');
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
            updateNotificationByEntity({entity: 'paid_alternative_withdraw'}, {status: 'read'}, function (error) {
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
                                user_id: req.user._id,
                                url: "paid-withdraw-alternative",
                                paid_withdraws: paid_withdraws,
                                notifications: notification
                            }
                            
                            return res.render('pages/inisiator/withdraw/paid-alternative', data);
                        }
                    });
                }
            });

        }
    });
})
router.get('/get-activity', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let waiting_budget = [];
    getProjectByID(req.query.project_id, function (error, project) {
        if (error) {
            return res.json({
                success: false,
                activity: null
            });
        }
        else {
            project.budget.forEach((budget) => {
                if (budget.status == 'waiting') {
                    waiting_budget.push(budget);
                }
            });

            return res.json({
                success: true,
                activity: waiting_budget
            })
        }
    });
});
router.get('/get-activity-detail', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let waiting_budget = null;
    getProjectByID(req.query.project_id, function (error, project) {
        if (error) {
            return res.json({
                success: false,
                activity: null
            });
        }
        else {
            project.budget.forEach((budget) => {
                if (budget._id == req.query.activity_id) {
                    waiting_budget = budget
                }
            });
            return res.json({
                success: true,
                activity: waiting_budget,
                activity_date: waiting_budget.activity_date.toLocaleDateString()
            })
        }
    });
});
router.get('/withdraw/get-receipt/:project_id/:filename', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let budget_object = null;

    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            return res.sendStatus(500);
        }
        if (!project) {
            return res.sendStatus(404);
        }
        else {
            if (project.inisiator.equals(req.user._id) && project.status == 'done') {
                project.budget.forEach(budget => {
                    if (budget.status == 'paid' && budget.receipt == req.params.filename) {
                        return res.download(__dirname+'/../storage/projects/'+req.params.project_id+'/budget/'+req.params.filename);
                    }
                });
            }
            else {
                return res.sendStatus(404);
            }
        }
    });

});

router.post('/start-project', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let success_message;
    let data = {
        basic: {
            title: req.body.title,
        },
        status: "draft",
        inisiator: req.user._id
    }
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
        return res.redirect('/inisiator/start-project');
    } else {
        let project = new Project(data);
        const dir = path.join(__dirname, `../storage/projects/${project._id}`);
        createProject(project, function (error) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            } else {
                fs.access(dir, (err) => {
                    if (err) {
                        fs.mkdir(dir, async (err) => {
                            if (err) {
                                error_message = "Terjadi Kesalahan";
                                req.flash('error_message', error_message);
                                return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                            } else {
                                success_message = "Berhasil membuat proyek baru";
                                req.flash('success_message', success_message);
                                return res.redirect(`/inisiator/project/${project._id}/edit`);
                            }
                        });
                    } else {
                        error_message = "Terjadi Kesalahan";
                        req.flash('error_message', error_message);
                        return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                    }
                });
            }
        });
    }

});
router.post('/project/:project_id/basic', isLoggedIn, isInisiator, isVerified, function (req, res) {
    let error_message;
    let success_message;
    req.body.stock_price = parseInt(req.body.stock_price.split('.').join(""));
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/start-project');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/start-project');
        } else {
            if (!project.status == 'draft') {
                error_message = "Proyek yang bukan draft tidak dapat diubah";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            }
            if (!project.inisiator._id.equals(req.user._id)) {
                error_message = "Proyek tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            }
            else {
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
                // req.checkBody('stock_price', 'Harga saham tidak boleh lebih dari 1 Juta Rupiah').isInt({
                //     max: 1000000
                // });
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
                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
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
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        }
                        if (!project) {
                            error_message = "Proyek tidak tersedia";
                            req.flash('error_message', error_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        } else {
                            success_message = "Berhasil memperbarui proyek";
                            req.flash('success_message', success_message);
                            return res.redirect(`/inisiator/project/${project._id}/edit`);
                        }
                    });
                }
            }
        }
    });
});
router.post('/project/:project_id/budget', isLoggedIn, isInisiator, isVerified, function (req, res) {
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
            return res.redirect('/inisiator/start-project');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/start-project');
        } else {
            if (project.status == 'verified') {
                error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            }
            if (!project.inisiator._id.equals(req.user._id)) {
                error_message = "Proyek tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            }
            else {
                req.body.budget_items.budget_items.forEach((budget_item, index) => {
                    budget[index] = {
                        description: budget_item.description,
                        activity_date: budget_item.activity_date,
                        amount: budget_item.amount,
                        status: "waiting",
                        receipt: ""
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
                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                }
                if (total_budget != project.basic[0].stock[0].price*project.basic[0].stock[0].total) {
                    error_message = "Anggaran proyek tidak sesuai dengan perhitungan saham";
                    req.flash('error_message', error_message);
                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                }
                else {
                    let data = {
                        budget: budget
                    };

                    updateProject(req.params.project_id, data, function (error, project) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        }
                        if (!project) {
                            error_message = "Proyek tidak tersedia";
                            req.flash('error_message', error_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        } else {
                            success_message = "Berhasil memperbarui proyek";
                            req.flash('success_message', success_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        }
                    });
                }
            }
        }
    });

});
router.post('/project/:project_id/project', isLoggedIn, isInisiator, isVerified, prospectusUpload.single('prospectus'), function (req, res) {
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
            return res.redirect('/inisiator/start-project');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/start-project');
        }
        else {
            if (!project.inisiator._id.equals(req.user._id)) {
                error_message = "Proyek tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            }
            if (project.status == 'verified') {
                error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            } else {
                req.checkBody('abstract', 'Abstrak proyek wajib diisi.').notEmpty();
                let errors = req.validationErrors();
                if (errors) {
                    error_message = errors[errors.length - 1].msg;
                    req.flash('error_message', error_message);
                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                } else {
                    let prospectus = "";
                    if (req.body.prospectus_input === undefined) {
                        if (!req.file) {
                            error_message = "Prospektus proyek wajib diunggah.";
                            req.flash('error_message', error_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        } else {
                            prospectus = req.file.filename;
                        }
                    } else {
                        prospectus = req.body.prospectus_input;
                    }
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
                            abstract: req.body.abstract.replace('&', '&amp;'),
                            prospectus: prospectus
                        }]
                    };
                    updateProject(req.params.project_id, data, function (error, project) {
                        if (error) {
                            error_message = "Terjadi kesalahan";
                            req.flash('error_message', error_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        }
                        if (!project) {
                            error_message = "Proyek tidak tersedia";
                            req.flash('error_message', error_message);
                            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                        } else {
                            success_message = "Berhasil memperbarui proyek";
                            req.flash('success_message', success_message);
                            return res.redirect(`/inisiator/project/${project._id}/edit`);
                        }
                    });

                }
            }
        }
    });


});
let cpUpload = upload.fields([
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
router.post('/project/:project_id/image', isLoggedIn, isInisiator, isVerified, function (req, res) {
    cpUpload(req, res, function (err) {
        let error_message;
        let success_message;
        let project_image = [];
        const dir = path.join(__dirname, `../storage/projects/${req.params.project_id}/images`);
        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar terlalu besar";
            req.flash('error_message', error_message);
            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
        } else if (err) {
            error_message = "Terjadi Kesalahan";
            req.flash('error_message', error_message);
            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
        }
        
        getProjectByID(req.params.project_id, function (error, project) {
            if (error) {
                error_message = "Terjadi kesalahan";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            }
            if (!project) {
                error_message = "Proyek tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect('/inisiator/start-project');
            } else {
                if (!project.inisiator._id.equals(req.user._id)) {
                    error_message = "Proyek tidak tersedia";
                    req.flash('error_message', error_message);
                    return res.redirect('/inisiator/start-project');
                }
                if (project.status == 'verified') {
                    error_message = "Proyek yang sudah terverifikasi tidak dapat diubah";
                    req.flash('error_message', error_message);
                    return res.redirect('/inisiator/start-project');
                } else {
                    fs.access(dir, async (err) => {
                        const imagePath = path.join(__dirname, `../storage/projects/${req.params.project_id}/images`);
                        const imageUpload = new Resize(imagePath);
                        if (err) {
                            fs.mkdir(dir, async (err) => {
                                if (err) {
                                    error_message = "Terjadi Kesalahan";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
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
                                                return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                                            }
                                            if (!project) {
                                                error_message = "Proyek tidak tersedia";
                                                req.flash('error_message', error_message);
                                                return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                                            } else {
                                                success_message = "Berhasil memperbarui proyek";
                                                req.flash('success_message', success_message);
                                                return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                                            }
                                        });
                                    } else {
                                        error_message = "Gambar proyek wajib diunggah";
                                        req.flash('error_message', error_message);
                                        return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
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
                                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                                }
                                if (!project) {
                                    error_message = "Proyek tidak tersedia";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
                                } else {
                                    success_message = "Berhasil memperbarui proyek";
                                    req.flash('success_message', success_message);
                                    return res.redirect(`/inisiator/project/${project._id}/edit`);
                                }
                            });
                        }
                    });
                }
            }
        });
    });
});

const officialRecordStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, `../storage/projects/${req.body.project}/budget`))
    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}-official_record.pdf`)
    }
})
const officialRecordUpload = multer({
    storage: officialRecordStorage,
    limits: {
        fileSize: 4 * 1024 * 1024,
    }
});

router.post('/withdraw/alternative', isLoggedIn, isInisiator, isVerified, officialRecordUpload.single('official_record'), function (req, res) {
    let error_message;
    let success_message;
    
    getProjectByID(req.body.project, async function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('back');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('back');
        } else {
            if (project.inisiator._id.equals(req.user._id)) {
                if (req.file) {                 
                    project.budget.forEach((budget, index) => {
                        if (budget._id.equals(req.body.activity)) {
                            project.budget[index].alternative_activity_date = req.body.activity_date;
                            project.budget[index].alternative_amount = req.body.amount;
                            project.budget[index].official_record = req.file.filename;
                            project.save().then(project => {
                                let notification_data = {
                                    status: 'unread',
                                    entity: 'waiting_approval_alternative_withdraw',
                                    description: 'Pencairan Alternatif Menunggu Persetujuan',
                                    url: '/admin/withdraw/alternative/waiting-approval',
                                    budget_id: budget._id,
                                    sender: req.user._id,
                                    receiver: '5cdb66e014c79f4bc8a01ee5'
                                }
                                let notification = new Notification(notification_data);
                                createNotification(notification, function(error) {
                                    if (error) {
                                        error_message = "Terjadi kesalahan";
                                        req.flash('error_message', error_message);
                                        return res.redirect('back');
                                    }
                                    else {
                                        success_message = "Pencairan alternatif berhasil dilakukan.";
                                        req.flash('success_message', success_message);
                                        return res.redirect('back');
                                    }
                                });
                            }).catch(error => {
                                error_message = "Pencairan alternatif gagal dilakukan.";
                                req.flash('error_message', error_message);
                                return res.redirect('back');
                            });
                        }
                    });
                } else {
                    error_message = "Berita acara wajib diunggah.";
                    req.flash('error_message', error_message);
                    return res.redirect('back');
                }
            }
            else {
                error_message = "Proyek tidak tersedia";
                req.flash('error_message', error_message);
                return res.redirect('back');
            }
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

function isInisiator(req, res, next) {
    if (req.user.user_type[0].name == 'inisiator') {
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
        return res.redirect('/inisiator/start-project');
    }
}

export default router;