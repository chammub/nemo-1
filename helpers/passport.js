const passport = require('passport');

function passportConfig(app, localStrategy) {
    const local = localStrategy;

    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions

    // Stores user in session
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    // Retrieves user from session
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}

module.exports = passportConfig;