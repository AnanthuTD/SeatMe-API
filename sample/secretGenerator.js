import crypto from 'crypto';

const accessTokenSecret = crypto.randomBytes(64).toString('hex');

console.log(accessTokenSecret);
