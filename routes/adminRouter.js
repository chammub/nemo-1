const express = require('express');
const chalk = require('chalk');
const debug = require('debug')('app:adminRoutes');

const adminRouter = express.Router();

function router(MongoInterface) {
    adminRouter.use((req, res, next) => {
        if (req.user && req.user.admin) {
            next();
        } else {
            res.redirect('/auth/login');
        }
    });

    adminRouter.route('/users')
        .get(async (req, res) => {
            try {
                const users = await MongoInterface.getUsers();
                debug(users);

                res.json(users);
            } catch (err) {
                debug(err);
            }
        });

    adminRouter.route('/users/:id')
        .get(async (req, res) => {
            const { id } = req.params;
            try {
                const user = await MongoInterface.getUser(id);
                debug(user);

                res.json(user);
            } catch (err) {
                debug(err);
            }
        });

    adminRouter.route('/insertUser')
        .get(async (req, res) => {
            debug('Create a new user');
            const userName = `name${Math.ceil(Math.random() * 1000)}`;

            try {
                await MongoInterface.insertData({
                    collection: 'users',
                    data: [{ name: userName }]
                });

                debug(`New user created: ${chalk.blue(userName)}`);
                res.sendStatus(200);
            } catch (err) {
                debug(err);
            }
        });

    return adminRouter;
}

module.exports = router;