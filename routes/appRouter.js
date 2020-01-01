const express = require('express');
// const chalk = require('chalk');
// const debug = require('debug')('app:appRoutes');

const appRouter = express.Router();

function router() {
    appRouter.use((req, res, next) => {
        if (req.user) {
            next();
        } else {
            res.redirect('/auth/login');
        }
    });

    return appRouter;
}

module.exports = router;