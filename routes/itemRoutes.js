import express from 'express';

// Set up routes
let router = express.Router();

// Require model
import { Item, createItem } from '../models/Item';

// Register routes
router.get('/', isLoggedIn, function (req, res) {
    Item.find(function (err, itms){
        if(err){
          console.log(err);
        }
        else {
          res.render('pages/items', {itms: itms});
        }
      });
});
router.get('/single', isLoggedIn, function (req, res) {
    res.render('pages/singleItem');
})
router.get('/add', isLoggedIn, function (req, res) {
    res.render('pages/addItem');
});
// Post route
router.post('/add/post', isLoggedIn, function (req, res) {
    let item = new Item(req.body);
    item.save()
    .then(item => {
        res.redirect('/items');
    })
    .catch(err => {
        res.status(400).send("unable to save to database");
    });
});
// Edit route
router.get('/edit/:id', isLoggedIn, function (req, res) {
    let id = req.params.id;
    Item.findById(id, function (err, item) {
        res.render('pages/editItem', { item: item });
    })
});
// Register update route
router.post('/update/:id', isLoggedIn, function (req, res) {
    Item.findById(req.params.id, function (err, item) {
        if (!item) {
            return next(new Error('Could not load document'));
        }
        else {
            item.item = req.body.item;
            item.save()
            .then(item => {
                res.redirect('/items');
            })
            .catch(err => {
                res.status(400).send("unable to update the database");
            });
        }
    });
});
// Remove
router.get('/delete/:id', isLoggedIn, function (req, res) {
    Item.findByIdAndRemove({ _id: req.params.id },
        function (err, item) {
            if (err) {
                res.json(err);
            }
            else {
                res.redirect('/items');
            }
        }    
    );
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/users/login');
    }
}

// Export itemRouter module
module.exports = router;