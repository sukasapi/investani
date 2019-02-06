var express = require('express');
var app = express();
// Set up routes
var itemRouter = express.Router();
// Require model
var Item = require('../models/Item');

// Register routes
itemRouter.route('/auth/register').get(function (req, res) {
    res.render('register');
});
itemRouter.route('/single').get(function (req, res) {
    res.render('singleItem');
})
itemRouter.route('/add').get(function (req, res) {
    res.render('addItem');
});
// Post route
itemRouter.route('/add/post').post(function (req, res) {
    var item = new Item(req.body);
        item.save()
      .then(item => {
      res.redirect('/items');
      })
      .catch(err => {
      res.status(400).send("unable to save to database");
      });
  });

// Export itemRouter module
module.exports = itemRouter;