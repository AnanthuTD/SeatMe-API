import { createAdmin } from '../bcryptHelper.js';

const userData = {
    id: 'AAA1',
    name: 'admin',
    email: 'seatmemes@gmail.com',
    phone: '1234567891',
    role: true,
    password: 'dca2024',
    designation: 'admin',
};
createAdmin(userData);
