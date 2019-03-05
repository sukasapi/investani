import express from 'express';
import { User, getUserByID, updateUser } from '../models/User';
import fs from 'fs-extra';
import puppeteer from 'puppeteer';
import ejs from 'ejs';

const router = express.Router();

router.get('/', isLoggedIn, isAdmin, function (req, res) {
    res.redirect('/admin/user/investor/individual');
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
            console.log(user);
            
            const compile = async function(templateName, data) {
                const html = await fs.readFile(`storage/contracts/template/${templateName}.ejs`, 'utf-8');
                return ejs.compile(html)(data);
            }; 
            (async function() {
                try {            
                    const browser = await puppeteer.launch();
                    const page = await browser.newPage()
        
                    const content = await compile('contract-template', user);
                    console.log(user.contract);
                    
                    console.log(content);
                    
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
                    console.log(e)
                    return res.json({success: false, message: "Terjadi kesalahan"});
                }
            })();
        }
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

router.get('/user/get-image/:filename', isLoggedIn, isAdmin, function (req, res) {
    res.download(__dirname+'/../storage/documents/'+req.params.filename);
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