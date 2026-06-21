const supabase = require('../config/db');

const Result = {
    create: async (sessionId, finalImagePath) => {
        const { data, error } = await supabase.from('photobooth_results').upsert([
            { session_id: sessionId, final_image_path: finalImagePath }
        ], { onConflict: 'session_id' }).select('id').single();
        if (error) throw error;
        return data.id;
    },
    findByUser: async (userId) => {
        const { data, error } = await supabase
            .from('photobooth_results')
            .select(`
                id, 
                final_image_path, 
                created_at, 
                session_id,
                photobooth_sessions!inner(
                    user_id,
                    templates (name)
                )
            `)
            .eq('photobooth_sessions.user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(row => ({
            id: row.id,
            final_image_path: row.final_image_path,
            created_at: row.created_at,
            session_id: row.session_id,
            template_name: row.photobooth_sessions?.templates?.name || 'Unknown'
        }));
    },
    delete: async (id) => {
        const { error } = await supabase.from('photobooth_results').delete().eq('id', id);
        if (error) throw error;
        return 1;
    },
    deleteAllByUser: async (userId) => {
        // Need to delete all results where session_id belongs to the user
        // Due to Supabase RPC limits, we fetch the sessions first
        const { data: sessions } = await supabase.from('photobooth_sessions').select('id').eq('user_id', userId);
        if (!sessions || sessions.length === 0) return 0;

        const sessionIds = sessions.map(s => s.id);
        const { error } = await supabase.from('photobooth_results').delete().in('session_id', sessionIds);
        if (error) throw error;
        return sessionIds.length;
    }
};

module.exports = Result;
