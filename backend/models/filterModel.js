const supabase = require('../config/db');

const Filter = {
    findAll: async () => {
        const { data, error } = await supabase.from('filters').select('*');
        if (error) throw error;
        return data || [];
    }
};

module.exports = Filter;
