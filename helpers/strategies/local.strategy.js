const passport = require('passport');
const { Strategy } = require('passport-local');
const chalk = require('chalk');
const debug = require('debug')('app:local.strategy');

const encrypt = require('./../encrypt');

module.exports = function localStrategy(MongoInterface) {
    passport.use(new Strategy({
        usernameField: 'username',
        passwordField: 'password'
    }, async (username, password, done) => {
        debug(`Checking new user ${chalk.yellow(username)}`);

        const user = await MongoInterface.findUser({ username });
        if (!user) {
            done(null, false);
            return;
        }

        if (!(user.salt && user.password)) {
            done(null, false);
            return;
        }


        if (encrypt.validateHash(password, user.salt, user.password)) {
            // Authentication passed
            // Remove sensitive data from the user object
            delete user.salt;
            delete user.password;
            debug(user);

            done(null, user);
        } else {
            done(null, false);
        }
    }));
};