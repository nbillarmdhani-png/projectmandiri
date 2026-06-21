require('dotenv').config();
const supabase = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const username = 'admin';
        const password = 'password123';
        const email = 'admin@boothapp.com';

        const { data: existing } = await supabase.from('users').select('id').eq('username', username);
        if (existing && existing.length > 0) {
            console.log('Admin user already exists.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { error } = await supabase.from('users').insert([
            { username, email, password: hashedPassword, role: 'admin' }
        ]);

        if (error) {
            console.error('Error creating admin:', error.message);
        } else {
            console.log('Admin user created successfully.');
        }
    } catch (e) {
        console.error(e);
    }
}

createAdmin();
