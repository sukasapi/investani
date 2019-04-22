import express from 'express';
import {
    getProjectByID
} from '../models/Project';
import { Transaction, createTransaction, getTransactionByStatus } from '../models/Transaction';
import moment from 'moment';

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
    let success_message;
    let waiting_transactions = [];
    let createdAt = [];
    let due_date = [];
    getTransactionByStatus('waiting_payment', function (error, transactions) {
        transactions.forEach((transaction, index) => {
            if (moment.duration(moment(transaction.due_date).diff(moment()))._milliseconds > 0) {
                waiting_transactions[index] = transaction
                createdAt[index] = moment(transaction.createdAt).format('LL');
                due_date[index] = moment(transaction.due_date).format('lll');
            }
        });

        let data = {
            user_id: req.user._id,
            transactions: waiting_transactions,
            createdAt: createdAt,
            due_date: due_date,
            url: "waiting_transaction"
        }
        console.log(data.transactions)
        success_message = "Daftar transaksi yang menunggu pembayaran.";
        req.flash('success_message', success_message);
        return res.render('pages/investor/transaction/waiting-payment', data);
    });
});
router.get('/:user_id/backed-project', isLoggedIn, isInvestor, function (req, res) {
    let data = {
        user_id: req.user._id,
        url: "backed-project"
    }
    res.render('pages/investor/backed-project', data);
});

router.post('/project/:project_id', isLoggedIn, isInvestor, function (req, res) {
    let error_message;
    let success_message;
    let data = {
        stock_quantity: req.body.stock,
        status: 'waiting_payment',
        receipt: null,
        due_date: moment().add(2, 'days'),
        project: req.params.project_id,
        investor: req.user._id
    }
    
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/project/'+req.params.project_id);
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/project/'+req.params.project_id);
        }
        else {
            req.checkBody('stock', 'Jumlah saham tidak boleh lebih dari '+project.basic[0].stock[0].temp).isInt({ max: project.basic[0].stock[0].temp });
            req.checkBody('stock', 'Jumlah saham tidak boleh kurang dari 1').isInt({ min: 1 });
            req.checkBody('stock', 'Jumlah saham wajib diisi').notEmpty();

            let errors = req.validationErrors();

            if (errors) {
                error_message = errors[errors.length - 1].msg;
                req.flash('error_message', error_message);
                return res.redirect('/project/'+req.params.project_id);
            }
            else {
                let transaction = new Transaction(data);
                createTransaction(transaction, function (error) {
                    if (error) {
                        error_message = "Terjadi kesalahan.";
                        req.flash('error_message', error_message);
                        return res.redirect('/project/'+req.params.project_id);
                    }
                    else {
                        project.basic[0].stock[0].temp = project.basic[0].stock[0].temp-req.body.stock;
                        project.save().then(project => {
                            success_message = "Berhasil membuat proyek baru";
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

function isInvestor(req, res, next) {
    if (req.user.user_type[0].name == 'investor') {
        next();
    }
    else {
        res.redirect('/');
    }
}
export default router;