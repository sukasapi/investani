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
import moment from 'moment';
import multer from 'multer';
import path from 'path';
import Resize from '../Resize';
import upload from '../uploadMiddleware';
import fs from 'fs';

const router = express.Router();

moment.locale('id');

router.get('/dashboard', isLoggedIn, isInvestor, function (req, res) {
    let data = {
        user_id: req.user._id,
        url: "dashboard"
    }
    res.render('pages/investor/dashboard', data);
});
router.get('/transaction/waiting-payment', isLoggedIn, isInvestor, function (req, res) {
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
router.get('/transaction/waiting-verification', isLoggedIn, isInvestor, function (req, res) {
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
router.get('/transaction/waiting-payment/:transaction_id', isLoggedIn, isInvestor, function (req, res) {
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
router.get('/:user_id/backed-project', isLoggedIn, isInvestor, function (req, res) {
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
router.get('/:project_id/backed-project/transaction', isLoggedIn, isInvestor, function (req, res) {
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
router.get('/transaction/get-receipt/:transaction_id/:filename', isLoggedIn, isInvestor, function (req, res) {
    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (transaction.investor._id.equals(req.user._id)) {
            res.download(__dirname + '/../storage/projects/' + transaction.project._id + '/transactions/' + req.params.filename);
        }
    });
});
router.get('/transaction/get-certificate/:transaction_id/:filename', isLoggedIn, isInvestor, function (req, res) {
    getTransactionById(req.params.transaction_id, function (error, transaction) {
        if (transaction.investor._id.equals(req.user._id)) {
            res.download(__dirname + '/../storage/projects/' + transaction.project._id + '/transactions/' + req.params.filename.slice(0, -4) + ".pdf");
        }
    });
});

router.post('/project/:project_id', isLoggedIn, isInvestor, function (req, res) {
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
        } else {
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
let receiptUpload = upload.fields([{
    name: 'receipt',
    maxCount: 1
}]);
router.post('/transaction/waiting-payment/:transaction_id/:project_id', isLoggedIn, isInvestor, function (req, res) {
    receiptUpload(req, res, function (err) {
        let error_message;
        let success_message;
        const dir = path.join(__dirname, `../storage/projects/${req.params.project_id}/transactions`);
        const imageUpload = new Resize(dir);
        let receipt;
        if (err instanceof multer.MulterError) {
            error_message = "Ukuran gambar terlalu besar";
            req.flash('error_message', error_message);
            return res.redirect(`/transaction/waiting-payment/${req.params.transaction_id}`);
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
                        if (req.files['receipt']) {
                            receipt = await imageUpload.save(req.files['receipt'][0].buffer);
                            let data = {
                                status: 'waiting_verification',
                                receipt: receipt,
                                payment_date: moment().format()
                            }
                            updateTransaction(req.params.transaction_id, data, function (error, transaction) {
                                if (error) {
                                    error_message = "Terjadi kesalahan";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
                                }
                                if (!transaction) {
                                    error_message = "Proyek tidak tersedia";
                                    req.flash('error_message', error_message);
                                    return res.redirect(`/investor/transaction/waiting-payment/${req.params.transaction_id}`);
                                } else {
                                    success_message = "Berhasil mengunggah bukti transaksi.";
                                    req.flash('success_message', success_message);
                                    return res.redirect('/investor/transaction/waiting-verification/');
                                }
                            });
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
export default router;