const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:mongoInterface');
const chalk = require('chalk');
const db = 'erp-db';
const Adapter = require('simple-odata-server-mongodb');

let MongoDb = null;

function MongoInterface(CONFIG, oDataServer) {
    function connectToDb() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(CONFIG.DATA_BASE, { useNewUrlParser: true }, (err, client) => {
                if (err) {
                    debug(chalk.red('Error occured while connecting'));
                    reject(err);
                }
                debug(chalk.green('Successfull connection to DB server.'));
                MongoDb = client.db(db);
                oDataServer.adapter(Adapter(function(cb) { 
                    cb(err, MongoDb); 
                })); 

                resolve(MongoDb);
            });
        });
    }

    return {
        insertData: mOptions => new Promise(async (resolve, reject) => {
            try {
                MongoDb = await connectToDb();
                debug('Inserting data');

                MongoDb.collection(mOptions.collection).insertMany(mOptions.data);
                debug('Inserting done');
                resolve(MongoDb);
            } catch (err) {
                reject(err);
            }
        }),

        getUsers: () => new Promise(async (resolve, reject) => {
            MongoDb = await connectToDb();
            debug('Getting users data');

            try {
                const users = MongoDb.collection('users').find().toArray();
                resolve(users);
            } catch (err) {
                reject(err);
            }
        }),

        getUser: userId => new Promise(async (resolve, reject) => {
            MongoDb = await connectToDb();
            debug('Getting users data');

            try {
                const user = MongoDb.collection('users').findOne({ _id: new ObjectID(userId) });
                resolve(user);
            } catch (err) {
                reject(err);
            }
        }),

        createUser: userData => new Promise(async (resolve, reject) => {
            MongoDb = await connectToDb();
            const collection = MongoDb.collection('users');
            debug(`Creation of user ${chalk.yellow(userData.username)} requested`);
            try {
                resolve(await collection.insertOne(userData));
            } catch (err) {
                reject(err);
            }
        }),

        findUser: userData => new Promise(async (resolve, reject) => {
            MongoDb = await connectToDb();
            try {
                const user = await MongoDb.collection('users').findOne(userData);
                resolve(user);
            } catch (err) {
                debug(err.stack);
                reject(err);
            }
        })
    };
}

module.exports = MongoInterface;