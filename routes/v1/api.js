const express = require('express');
const debug = require('debug')('app:apiV1Routes');

const apiRouter = express.Router();

function router() {
    apiRouter.use((req, res, next) => {
        if (req.user) {
            next();
        } else {
            res.redirect('/auth/login');
        }
    });

    apiRouter.route('/user')
        .get(async (req, res) => {
            debug(req.user);
            res.json(req.user);
        });

    apiRouter.route('/config')
        .get(async (req, res) => {
            const oData = {
                data: true
            };

            if (req.user.admin) {
                oData.admin = true;
            }

            debug(oData);

            res.json(oData);
        });

    return apiRouter;
}

module.exports = router;