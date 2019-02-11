import express from 'express';
// Import User model
import { User, createUser, getUserByEmail, comparePassword, getUserByID } from '../models/User';
import passport from 'passport';

let router = express.Router();

router.get('', isLoggedIn, function (req, res) {
    
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/auth/login');
    }
}

export default router;