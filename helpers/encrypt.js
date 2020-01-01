const crypto = require('crypto');

const ITTERATIONS = 10000;
const KEY_LENGTH = 512;
const DYGEST = 'sha512';

module.exports = {
    generateHash: (password) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, ITTERATIONS, KEY_LENGTH, DYGEST).toString('hex');
        return {
            salt,
            hash
        };
    },

    validateHash: (password, salt, hash) => {
        const hashCheck = crypto.pbkdf2Sync(password, salt, ITTERATIONS, KEY_LENGTH, DYGEST).toString('hex');
        return hashCheck === hash;
    }
};