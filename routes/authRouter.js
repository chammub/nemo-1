const express = require('express');
const debug = require('debug')('app:auth');
const chalk = require('chalk');
const passport = require('passport');
const encrypt = require('./../helpers/encrypt');

const AuthRouter = express.Router();

function validPasswords(password, password1) {
    if (!password || !password1) {
        return false;
    }

    if (!(typeof password === 'string' && typeof password1 === 'string')) {
        return false;
    }

    if (password !== password1) {
        return false;
    }

    return true;
}

function validEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function router(MongoInterface) {
    // Login views
    AuthRouter.route('/login')
        .get((req, res) => {
            res.render('authentication/login', {
                title: 'Login',
                message: ''
            });
        })
        .post(passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/auth/login'
        }));


    // Sign up views
    AuthRouter.route('/register')
        .get((req, res) => {
            res.render('authentication/register', {
                title: 'Register',
                message: ''
            });
        })
        .post(async (req, res) => {
            debug('Register post request created');
            debug(req.body);
            // create user
            const {
                username,
                password,
                passwordRepeat,
                email
            } = req.body;
            const user = {
                username,
                password,
                email,
            };

            if (!validPasswords(password, passwordRepeat)) {
                res.render('authentication/register', {
                    title: 'Register',
                    message: 'Both passwords must match!'
                });
                return;
            }

            if (!validEmail(email)) {
                res.render('authentication/register', {
                    title: 'Register',
                    message: 'Please enter a valid email address!'
                });
                return;
            }

            const newEncriptedPass = encrypt.generateHash(password);
            user.password = newEncriptedPass.hash;
            user.salt = newEncriptedPass.salt;
            try {
                let result = await MongoInterface.findUser({ username });
                if (result) {
                    debug(chalk.red('Username aready taken!'));
                    res.render('authentication/register', {
                        title: 'Register',
                        message: 'Username already taken!'
                    });
                    return;
                }

                result = await MongoInterface.findUser({ email });
                if (result) {
                    debug(chalk.red('Email aready taken!'));
                    res.render('authentication/register', {
                        title: 'Register',
                        message: 'Email already taken!'
                    });
                    return;
                }

                debug(`Creating user ${chalk.yellow(username)}`);
                result = await MongoInterface.createUser(user);
                // log the user in
                req.login(result.ops[0], () => {
                    res.redirect('/');
                });
            } catch (err) {
                debug('Unable to create user!');
                debug(err.stack);
            }
        });

    AuthRouter.route('/profile')
        .get((req, res) => {
            if (!req.user) {
                res.redirect('/auth/login');
            }
            res.json(req.user);
        });

    AuthRouter.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/auth/login');
        });

    return AuthRouter;
}

module.exports = router;