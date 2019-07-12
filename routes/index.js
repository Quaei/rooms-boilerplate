const express = require('express');
const {ensureAuthenticated} = require('../config/auth');

const router = express.Router();

// Welcome page
router.get('/', function(req, res) {
    res.render('welcome');
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, function(req, res) {
    res.render('dashboard', {
        name: req.user.username
    });
})

module.exports = router;