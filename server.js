// Main server
import express from 'express';
import path from 'path';
import cookeParser from 'cookie-parser';
import bodyParser from 'body-parser';
import expressValidator from 'express-validator';
import flash from 'connect-flash';
import session from 'express-session';
import passport from 'passport';
// Set up MongoDB database
import mongoose from 'mongoose';
// Import route
import ItemRoutes from './routes/itemRoutes';
import index from './routes/index';
import auth from './routes/auth';
import email from './routes/email';
import captcha from './routes/captcha';
import welcome from './routes/welcome';
import profile from './routes/profile';

// Connect with Mongo database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://admin:admin@127.0.0.1:27017/investani?authSource=admin', {	
    useMongoClient: true
});

let db = mongoose.connect;

const app = express();
const PORT = 3000;

// Serving static files from serve
app.use(express.static(__dirname + '/public'));
// Parses data to json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookeParser());
// Set view engine and middleware
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set express session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
// Set express validator
app.use(expressValidator());
// Set express flash message
app.use(flash());
app.use(function(req, res, next){
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    res.locals.error_email = req.flash('error_email');
    res.locals.error_password = req.flash('error_password');
    res.locals.error_cfm_pwd = req.flash('error_cfm_pwd');
    next();
});

// Create routes
app.use('/', index);
app.use('/auth', auth);
app.use('/items', ItemRoutes);
app.use('/email', email);
app.use('/captcha', captcha);
app.use('/welcome', welcome);
app.use('/complete-profile', profile);

app.listen(PORT, function(){
    console.log('Server is running on port:', PORT);
});

