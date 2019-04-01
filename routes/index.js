import express from 'express';
import {
    getUserBySecretToken,
    updateUser
} from '../models/User';
import { getProjectIndex } from '../models/Project';
import upload from '../uploadMiddleware';
import Resize from '../Resize';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import ejs from 'ejs';

const router = express.Router();
const compile = async function (templateName, data) {
    const filePath = path.join(__dirname, '../storage/contracts/template/', `${templateName}.ejs`);
    const html = await fs.readFile(filePath, 'utf-8');
    return ejs.render(html, data);
};

router.get('/', function (req, res) {
    let auth = false;
    let user_type = null;
    let target = []
    if (req.isAuthenticated()) {
        auth = true;
        user_type = req.user.user_type[0].name;
    }
    getProjectIndex('verified', function (error, projects) {
        
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/inisiator/started-project');
        } else {
            let data = {
                auth: auth,
                user_type: user_type,
                projects: projects
            };
            console.log(data)
            res.render('pages/index', data);
        }
    });
});
router.get('/activation/:secretToken', function (req, res) {

    let secretToken = req.params.secretToken;
    let error_message;
    getUserBySecretToken(secretToken, function (err, user) {
        if (err) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
        }
        if (!user) {
            error_message = "Token tidak valid";
            req.flash('error_message', error_message);
        } else {
            let updateValue = {
                active: true,
                secretToken: ""
            }
            updateUser(user, updateValue, function (err, user) {
                if (err) {
                    error_message = "Terjadi kesalahan";
                    req.flash('error_message', error_message);
                    res.redirect('/auth/login');
                }
                if (!user) {
                    error_message = "User tidak ada";
                    req.flash('error_message', error_message);
                    res.redirect('/auth/login');
                } else {
                    res.redirect('/auth/login');
                }
            });
        }
    });
});
router.get('/image/project/:project_id/:filename', function (req, res) {
    res.download(__dirname + '/../storage/projects/' + req.params.project_id + '/images/' + req.params.filename);
});

router.get('/contract', isLoggedIn, isInvestor, isCompleteProfile, isNoContract, function (req, res) {
    res.render('pages/contract/contract', req.user);
});

router.post('/contract', isLoggedIn, isInvestor, isCompleteProfile, isNoContract, upload.single('signature'), async function (req, res) {

    const imagePath = path.join(__dirname, `../storage/documents/${req.user._id}`);
    const fileUpload = new Resize(imagePath);

    let success_message;
    let error_message;

    if (!req.file) {
        error_message = "Tanda tangan wajib diunggah.";
        return res.json({
            success: false,
            message: error_message
        });
    }

    let contract = await fileUpload.save(req.file.buffer);

    let data = {
        contract: contract.slice(0, -4) + ".pdf"
    };
    updateUser(req.user, data, async function (error, user) {
        if (error) {
            error_message = "Terjadi kesalahan";
            return res.json({
                success: false,
                message: error_message
            });
        }
        if (!user) {
            error_message = "User tidak tersedia";
            return res.json({
                success: false,
                message: error_message
            });
        } else {
            let data_pdf = {
                email: req.user.email,
                profile: [req.user.profile[0]],
                occupation: [req.user.occupation[0]],
                document: [req.user.document[0]],
                bank: [req.user.bank[0]],
                contract: req.user.contract
            };
            try {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                const content = await compile('contract-template', data_pdf);
                await page.setContent(content);
                await page.emulateMedia('screen');
                await page.pdf({
                    path: `storage/documents/${req.user._id}/${data.contract}`,
                    format: 'A4',
                    printBackground: true
                });
                await browser.close();
                success_message = "Berhasil menandatangani kontrak"
                return res.json({
                    success: true,
                    message: success_message
                });
            } catch (e) {
                error_message = "Terjadi kesalahan";
                return res.json({
                    success: false,
                    message: success_message
                });
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

function isInvestor(req, res, next) {
    if (req.user.user_type[0].name == 'investor') {
        next();
    } else {
        res.redirect('/');
    }
}

function isCompleteProfile(req, res, next) {
    if (req.user.bank.length != 0) {
        next();
    } else {
        res.redirect('/');
    }
}

function isNoContract(req, res, next) {
    if (req.user.contract == '') {
        next();
    } else {
        res.redirect('/');
    }
}

export default router;