import express from 'express';
import { User, getUserByID, updateUser } from '../models/User';
import { getProjectByStatus, getProjectByID, updateProject } from '../models/Project';
import fs from 'fs-extra';
import puppeteer from 'puppeteer';
import ejs from 'ejs';

const router = express.Router();

router.get('/', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/dashboard', isLoggedIn, isAdmin, function (req, res) {
    res.send('dashboard');
});
router.get('/user', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/user/investor', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
});
router.get('/user/investor/individual', isLoggedIn, isAdmin, function (req, res) {
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/investor/individual', {users: users});
        }
    });
});
router.get('/user/investor/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    getUserByID(req.params.id, function (error, user) {        
        res.render('pages/admin/user/investor/detail', {user: user});
    });
});
router.get('/user/investor/company', isLoggedIn, isAdmin, function (req, res) {
    User.find({'active': true, 'user_type.name': 'investor', 'profile.registration_type': "company"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/investor/company', {users: users});
        }
    });
});
router.get('/user/inisiator', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/inisiator/individual');
});
router.get('/user/inisiator/individual', isLoggedIn, isAdmin, function (req, res) {
    User.find({'active': true, 'user_type.name': 'inisiator', 'profile.registration_type': "individual"}, function (error, users) {
        if (error) {
            console.log(error);
        }
        else {
            res.render('pages/admin/user/inisiator/individual', {users: users});
        }
    });
});
router.get('/user/inisiator/individual/:id', isLoggedIn, isAdmin, function (req, res) {
    getUserByID(req.params.id, function (error, user) {        
        res.render('pages/admin/user/inisiator/detail', {user: user});
    });
});
router.get('/user/get-image/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/documents/'+req.params.filename);
});
router.get('/project/waiting', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
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
                url: "started-project"
            }
            success_message = "Silahakan verifikasi proyek yang tersedia";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/waiting', data);
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
            let province_id = project.basic[0].province[0].province_id;
            let city_id = project.basic[0].city[0].city_id;
            let category = project.basic[0].category;
            let area = project.basic[0].area;
            let goal = project.basic[0].goal;
            let campaign = project.basic[0].duration[0].campaign;
            let start_date = project.basic[0].duration[0].start_date.toLocaleDateString();
            let roi = project.basic[0].roi;
            let duration = project.basic[0].duration[0].duration;
            let stock_price = project.basic[0].stock[0].price;
            let total_stock = project.basic[0].stock[0].total;
            let budget = [];
            let budget_not_null = 0;
            let image = [];
            let activity_date = [];
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
            let abstract = project.project[0].abstract.replace('&', '&amp;');
            let prospectus = project.project[0].prospectus;
            for (let i = 0; i < project.image.length; i++) {
                image[i] = project.image[i].filename;
            }
            let data = {
                project_id: project._id,
                title: project.basic[0].title,
                province: project.basic[0].province[0].province_name,
                city: project.basic[0].city[0].city_name,
                category: category,
                area: area,
                goal: goal,
                campaign: campaign,
                start_date: start_date,
                roi: roi,
                duration: duration,
                stock_price: stock_price,
                total_stock: total_stock,
                budget: budget,
                abstract: abstract,
                prospectus: prospectus,
                image: image,
            }
            success_message = "Silahakan verifikasi proyek yang tersedia";
            req.flash('success_message', success_message);
            return res.render('pages/admin/project/detail', data);
        }
    });
});
router.get('/project/get-prospectus/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/prospectus/'+req.params.filename);
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
            const compile = async function(templateName, data) {
                const html = await fs.readFile(`storage/contracts/template/${templateName}.ejs`, 'utf-8');
                return ejs.compile(html)(data);
            }; 
            (async function() {
                try {            
                    const browser = await puppeteer.launch();
                    const page = await browser.newPage()
        
                    const content = await compile('contract-template', user);
                    
                    await page.setContent(content);
                    await page.emulateMedia('screen');
                    await page.pdf({
                        path: `storage/contracts/${user.contract}.pdf`,
                        format: 'A4',
                        printBackground: true,
                        timeout: 0
                    });
                    await browser.close();
                    return res.json({success: true, message: "Berhasil mengaktivasi investor"});
                }
                catch (e){
                    return res.json({success: false, message: "Terjadi kesalahan"});
                }
            })();
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
            res.json({success: true});
        }
    });
});
router.post('/project/waiting/verify/:project_id', isLoggedIn, isAdmin, function (req, res) {
    let error_message;
    let success_message;
    let data = {
        status: "verified"
    };
    updateProject(req.params.project_id, data, function(error, project) {
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
            success_message = "Berhasil memverifikasi proyek";
            req.flash('success_message', success_message);
            return res.redirect('/admin/project/waiting');
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