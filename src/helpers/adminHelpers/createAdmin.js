import { createAdmin } from '../bcryptHelper.js';

const userData = {
    id: 'AAA',
    name: 'admin',
    email: 'admin@gmail.com',
    phone: '1234567890',
    isAdmin: true,
    password: 'admin',
    designation: 'admin',
};
createAdmin(userData);
