const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

let supabase;

const getSupabase = () => {
    if (supabase) return supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials are not provided in the environment variables.');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    return supabase;
};

const lazySupabase = new Proxy({}, {
    get(_target, prop) {
        const client = getSupabase();
        const value = client[prop];
        return typeof value === 'function' ? value.bind(client) : value;
    }
});

module.exports = lazySupabase;
