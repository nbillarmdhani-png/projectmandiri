const supabase = require('../config/db');

const User = {
    findByEmail: async (email) => {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error && error.code !== 'PGRST116') console.error(error);
        return data || null;
    },
    findByUsername: async (username) => {
        const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
        if (error && error.code !== 'PGRST116') console.error(error);
        return data || null;
    },
    findById: async (id) => {
        const { data, error } = await supabase.from('users').select('id, username, email, role, created_at, updated_at').eq('id', id).single();
        if (error && error.code !== 'PGRST116') console.error(error);
        return data || null;
    },
    create: async (username, email, passwordHash, role = 'user') => {
        const { data, error } = await supabase.from('users').insert([
            { username, email, password: passwordHash, role }
        ]).select('id').single();
        if (error) throw error;
        return data.id;
    }
};

module.exports = User;
