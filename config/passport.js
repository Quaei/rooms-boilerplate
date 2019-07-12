const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load user model
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({usernameField: 'name'}, function(name, password, done) {
            // Match user
            User.findOne({
                name: name.toLowerCase()
            })
                .then(user => {
                    if(!user) {
                        return done(null, false, {
                            message: 'Incorrect username or password'
                        });
                    }

                    // Match password
                    bcrypt.compare(password, user.password, function(err, isMatch) {
                        if (err) throw err;

                        if (isMatch) {
                            return done(null, user);
                        }
                        else {
                            return done(null, false, {message: 'Incorrect username or password'});
                        }
                    });
                })
                .catch(err => console.log(err));
        })
    );

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}
