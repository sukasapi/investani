import express from 'express';
import { User, getUserByID } from '../models/User';
import { getProjectByStatus, getProjectByID, updateProject } from '../models/Project';
import { Category, createCategory } from '../models/Category';
import { Transaction, getTransactionByStatus } from '../models/Transaction';
import moment from 'moment';

const router = express.Router();

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
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/investor/individual', {investors: users, url: url});
        }
    });
});
router.get('/user/investor/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    getUserByID(req.params.id, function (error, user) {        
        res.render('pages/admin/user/investor/detail', {user: user});
    });
});
router.get('/user/investor/company', isLoggedIn, isAdmin, function (req, res) {
    let url = "company-investor";
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "company"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/investor/company', {investors: users, url: url});
        }
    });
});
router.get('/user/investor/company/:id', isLoggedIn, isAdmin, function (req, res) {
    let url = "company-investor";

    getUserByID(req.params.id, function (error, user) {    
        res.render('pages/admin/user/investor/detail', {user: user, url: url});
    });
});
router.get('/user/inisiator', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/inisiator/individual');
});
router.get('/user/inisiator/individual', isLoggedIn, isAdmin, function (req, res) {
    let url = "individual-inisiator";

    User.find({'active': true, 'user_type.name': 'inisiator', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/inisiator/individual', {inisiators: users, url: url});
        }
    });
});
router.get('/user/inisiator/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    let url = "individual-inisiator";
    getUserByID(req.params.id, function (error, user) {        
        res.render('pages/admin/user/inisiator/detail', {user: user, url: url});
    });
});
router.get('/user/get-image/:user_id/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/documents/'+req.params.user_id+'/'+req.params.filename);
});
router.get('/project/waiting', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let durations = [];

    getProjectByStatus("waiting", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        if (!projects) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                projects: projects,
                durations: durations,
                url: "waiting-project",
            }
            success_message = "Silahakan verifikasi proyek yang tersedia";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/waiting', data);
        }
    });
});
router.get('/project/rejected', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let durations = [];
    
    getProjectByStatus("rejected", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        if (!projects) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                projects: projects,
                durations: durations,
                url: "rejected-project",
            }
            success_message = "Daftar proyek yang ditolak";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/rejected', data);
        }
    });
});
router.get('/project/open', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let durations = [];
    let open_projects = [];
    
    getProjectByStatus("verified", function (error, projects) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        if (!projects) {
            error_message = "Proyek tidak tersedia";
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
            
            success_message = "Daftar proyek yang ditolak";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/open', data);
        }
    });
});
router.get('/project/waiting/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                url: 'detail-project',
                project: project
            }
            success_message = "Silahakan verifikasi proyek yang tersedia";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/waiting/:project_id/edit', isLoggedIn, isAdmin, function (req, res) {
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
        }
        else {
            Category.find(function (error, all_category) {
                if (error) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
                }
                let data = {
                    url: 'edit-project',
                    project: project, 
                    all_category: all_category
                }
                success_message = "Silahakan verifikasi proyek yang tersedia";
                req.flash('success_message', success_message);
                return res.render('pages/admin/project/edit', data);
            })
            
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
router.get('/project/open/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia.";
            req.flash('error_message', error_message);
            return res.redirect('/admin/dashboard');
        }
        else {
            let data = {
                url: 'open-detail-project',
                project: project
            }
            success_message = "Menampilkan proyek yang tersedia.";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/category', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
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
            success_message = "Silahakan verifikasi proyek yang tersedia";
            req.flash('success_message', success_message);
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
router.get('/transaction/waiting', isLoggedIn, isAdmin, function (req, res) {
    let success_message;
    let createdAt = [];
    let due_date = [];
    let payment_date = [];
    getTransactionByStatus('waiting_verification', function (error, transactions) {
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
            url: "waiting_verification"
        }
        success_message = "Daftar transaksi yang menunggu verifikasi.";
        req.flash('success_message', success_message);
        return res.render('pages/admin/transaction/waiting-verification', data);
    });
});
router.get('/transaction/get-receipt/:project_id/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/projects/'+req.params.project_id+'/transactions/'+req.params.filename);
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
                    let prospectus = "";
                    if (req.body.prospectus_input === undefined) {
                        if (!req.file) {
                            error_message = "Prospektus proyek wajib diunggah.";
                            req.flash('error_message', error_message);
                            return res.redirect(`/admin/project/waiting/${req.params.project_id}`);
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
                            abstract: req.body.abstract,
                            prospectus: prospectus
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