// STATIC VARIABLES
// =============================================================================
const chalk = require('chalk');
const debug = require('debug')('app');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require("cors");
const CONFIG = require('./helpers/config');

// test odata service
const oDataServer = require('./helpers/odata/metadata')();

// get the address of the data base or use localhost
if (process.env.DATA_BASE) {
    CONFIG.DATA_BASE = process.env.DATA_BASE;
}
if (process.env.PORT) {
    CONFIG.PORT = process.env.PORT;
}
const MongoInterface = require('./helpers/mongoInterface')(CONFIG, oDataServer);

const app = express();
const dir = __dirname;

// BASE SETUP
// =============================================================================
app.use(morgan('tiny'));
app.use(cors()); // Enable Cross-origin resource sharing (CORS)  for app.
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'homeappSecretSecret',
    resave: true,
    saveUninitialized: true,
    secure: true,
})); // session secret

// Configure passport
const localStrategy = require('./helpers/strategies/local.strategy')(MongoInterface);
require('./helpers/passport')(app, localStrategy);

// APP SETTINGS
// =============================================================================
app.set('views', './views');
app.set('view engine', 'ejs');

// STATIC FOLDERS
// =============================================================================

// Static CSS and JS resources
app.use('/css', express.static(path.join(dir, '/node_modules/bootstrap/dist/css')));
app.use('/css', express.static(path.join(dir, '/public/css')));
app.use('/js', express.static(path.join(dir, '/node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(dir, '/node_modules/jquery/dist')));
app.use('/js', express.static(path.join(dir, '/public/js')));
app.use('/img', express.static(path.join(dir, '/public/images')));

// ROUTES FOR OUR API
// =============================================================================
const AuthRouter = require('./routes/authRouter')(MongoInterface);
const AdminRouter = require('./routes/adminRouter')(MongoInterface);
const AppRouter = require('./routes/appRouter')();
const DataApiRouter = require('./routes/v1/api')(MongoInterface);

app.use('/auth', AuthRouter);
app.use('/admin', AdminRouter);
app.use('/api/v1/', DataApiRouter);

// Main application
app.use('/', AppRouter);
app.use('/', express.static(path.join(dir, '/webapp')));


// The directive to set app route path.
app.use("/odata", function (req, res) {
    oDataServer.handle(req, res);
});

// START APPLICATION
// =============================================================================
app.listen(CONFIG.PORT, () => debug(`Application started and listening on port ${chalk.green(CONFIG.PORT)}!`));