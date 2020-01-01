const express = require('express');
const path = require('path');
const Entrie = require('../webapp/model/Entrie');
const Setup = require('../webapp/model/Setup');
const User = require('../webapp/model/User');

const router = express.Router();

module.exports = function (passport) {

    /*
    * Internal funciton used for checking
    * if the request is already authenticated
    */
    const isLoggedIn = (req, res, next) => {
        console.log(req.session);

        if (req.isAuthenticated()) {
            console.log('Request is authenticated...');
            return next();
        } else {
            console.log('Unauthorized access...');
            res.redirect('/login');
        }
    };

    router.get('/', isLoggedIn, (req, res, next) => {
        res.redirect('/autoapp');
    });

    router.get('/autoapp/index.html', isLoggedIn, (req, res, next) => {
        res.redirect('/autoapp');
    });

    router.get('/autoapp', isLoggedIn, (req, res, next) => {
        next();
    });

    router.get('/login', (req, res, next) => {
        res.render('login');
    });

    router.get('/register', (req, res, next) => {
        res.render('register');
    });

    router.get('/logout', (req, res, next) => {
        req.logout();
        req.session.destroy(function (err) {
            if (err) throw err;
        });
        res.redirect('/');
    });

    /*
    * =================LOGIN USER=======================
    * on routes that end in /autoapp/login
    * ==================================================
    */
    router.post('/login', (req, res, next) => {
        console.log('Logging in...');

        // try to authenticate the user with local strategy
        passport.authenticate('local-login', function (err, user, info) {
            if (err) {
                console.log('Error occured while authenticating: ', err);
                res.send({
                    message: 'Error occured while authentication. Please contact administrator.'
                });
            } else if (!!info) {
                // authentication was no successfull
                console.log('Wrong username or password: ', info);
                res.render('login', {
                    errors: [{
                        param: '',
                        msg: info.message,
                        value: ''
                    }]
                });
            } else if (user) {
                // authentication was successfull
                console.log('User: ', user);

                // creating login session
                req.login(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return next();
                });

                // redirecting to application
                res.redirect('/');
                next();
            } else {
                console.log('Unknown problem!');
                res.send({
                    message: 'Unknown problem occured!'
                });
            }
        })(req, res, next);
    });

    /*
    * =================REGISTER USER=======================
    * on routes that end in /autoapp/register
    * =====================================================
    */
    router.post('/register', (req, res) => {
        // if user is already authenticated we do not want to register anything
        if (req.isAuthenticated()) {
            res.redirect('/');
        }

        // before we proceed with registration
        // there should always be some sort of
        // server side validation
        req.checkBody('uname', 'Username is required field.').notEmpty();
        req.checkBody('email', 'Email is required field.').notEmpty();
        req.checkBody('password', 'Password is required field.').notEmpty();
        req.checkBody('password2', 'Password is required field.').notEmpty();
        req.checkBody('password', 'Passwords should match.').equals(req.body.password2);

        const err = req.validationErrors();

        if (err) {
            // if there are any validation errors
            // show them to the user
            console.log(err);
            res.render('register', {
                errors: err
            });
        } else {
            // if no errors - proceed with registration
            const {
                body: {
                    uname: uname,
                    email: email,
                    password: password,
                    car: car
                }
            } = req;

            let emailFree = false,
                userNameFree = false;

            // we should check first that both the username
            // and the email do not exist in the database.
            // Promise.all() makes sure that both async checks are
            // finished before we proceed with further actions
            Promise.all([
                User.findOne({ 'local.email': email }, function (err, user) {
                    // try finding already existing user with the provided email
                    if (err) {
                        console.log(err);
                    } else {
                        if (!!user) {
                            // user with the same email already exists!
                            // Further actions are taken after the promise
                            // is resolved.
                        } else {
                            // this email is not used by other users
                            emailFree = true;
                        }
                    }
                }),

                User.findOne({ 'local.uname': uname }, function (err, user) {
                    // try finding already existing user with the provided username
                    if (err) {
                        console.log(err);
                    } else {
                        if (!!user) {
                            // user with the same username already exists!
                            // Further actions are taken after the promise
                            // is resolved.
                        } else {
                            // there is no user with this username
                            userNameFree = true;
                        }
                    }
                })
            ])
                // when both checks regarding username and email are done
                // we can proceed accordingly:
                .then(() => {
                    // both are free and we should register the new user
                    if (emailFree && userNameFree) {
                        let user = new User();

                        user.local.email = email;
                        user.local.uname = uname;
                        user.local.car = car;
                        user.type = 'user';
                        user.local.password = user.generateHash(password);

                        user.save(function (err, user) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(user);
                            }
                        });

                        // once done - proceed to login page
                        res.render('login');
                    } else {
                        // either the username or the email are already used
                        // by other user
                        let err = [];

                        if (!emailFree) {
                            err.push({
                                param: 'email',
                                msg: 'Email already registered!',
                                value: email
                            });
                        }

                        if (!userNameFree) {
                            err.push({
                                param: 'uname',
                                msg: 'User already exists!',
                                value: uname
                            });
                        }

                        // show feedback with the collected errors to the user
                        res.render('register', {
                            errors: err
                        });
                    }
                });
        }
    });
}