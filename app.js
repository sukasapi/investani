// Main server
var express = require('express');
// Set up MongoDB database
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
// Require ItemRoutes file
var itemRouter = require('./src/routes/itemRoutes');
var port = 3000;

// Set view engine
app.set('view engine', 'ejs');
// Serving static files from serve
app.use(express.static('public'));
// Parses data to json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Create routes
app.use('/', itemRouter);
app.listen(port, function(){
    console.log('Server is running on port:', port);
});

// Set up a routing
app.get('/', function(req, res){
    res.render('index');
});

// Connect with Mongo database
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://myUserAdmin:abc123@127.0.0.1:27017/aufinancex?authSource=admin', {useNewUrlParser: true})
.then(() => { // if all is ok we will be here
    console.log('Connected');
})
.catch(err => { // if error we will be here
    process.exit(1);
});
