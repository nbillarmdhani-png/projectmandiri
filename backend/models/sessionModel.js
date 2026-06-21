const supabase = require('../config/db');

const Session = {
    create: async (userId, templateId) => {
        const { data, error } = await supabase.from('photobooth_sessions').insert([
            { user_id: userId, template_id: templateId, status: 'active' }
        ]).select('id').single();
        if (error) throw error;
        return data.id;
    },
    updateStatus: async (sessionId, status) => {
        const { error } = await supabase.from('photobooth_sessions').update({
            status,
            completed_at: new Date().toISOString()
        }).eq('id', sessionId);
        if (error) throw error;
        return 1;
    }
};

module.exports = Session;
