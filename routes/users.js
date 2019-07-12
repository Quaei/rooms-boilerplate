const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const router = express.Router();

// User model
const User = require('../models/User');

// Login
router.get('/login', function (req, res) {
    res.render('login');
});

// Register
router.get('/register', function (req, res) {
    res.render('register');
})

// Register Handle
router.post('/register', function (req, res) {
    const {
        name,
        password,
        password2
    } = req.body;
    let errors = [];

    // Check required fiels
    if (!name || !password || !password2) {
        errors.push({
            msg: 'Please fill in all fields.'
        });
    }

    // Check passwords match
    if (password !== password2) {
        errors.push({
            msg: 'Passwords do not match'
        });
    }

    // Check pass length
    if (password.length < 6) {
        errors.push({
            msg: 'Password must be at least 6 characters'
        });
    }

    if (name.length > 20) {
        errors.push({
            msg: 'Username cannot be longer than 20 characters'
        })
    }

    let ft = true // first time
    let cs = false // contains space
    for (let i = 0; i < name.length; i++) {
        let ch = name[i]
        if (ch == ' ' && ft) {
            ft = false
            cs = true
        }
    }
    if (cs) {
        errors.push({
            msg: 'Username cannot contain spaces'
        })
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            password,
            password2
        });
    } else {
        // Validation passed
        User.findOne({
                name: name.toLowerCase()
            })
            .then(user => {
                if (user) {
                    // User exists
                    errors.push({
                        msg: 'Username is already taken.'
                    });
                    res.render('register', {
                        errors,
                        name,
                        password,
                        password2
                    });
                } else {
                    const newUser = new User({
                        username: name,
                        name: name.toLowerCase(),
                        password: password
                    });

                    // Hash Password
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(newUser.password, salt, function (err, hash) {
                            if (err) throw err;

                            // Set password to hashed
                            newUser.password = hash;

                            // Save user
                            newUser.save()
                                .then(user => {
                                    req.flash('successMsg', 'You are now registered. Please log in.');
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            })
    }
});

// Login handle
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout handle
router.get('/logout', function (req, res) {
    req.logout();
    req.flash('successMsg', 'You are logged out.');
    res.redirect('/users/login');
});

module.exports = router;