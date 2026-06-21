const supabase = require('../config/db');

const Template = {
    findAll: async () => {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;
        return data || [];
    },
    findById: async (id) => {
        const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },
    create: async (name, description, filePath, frameCount = 4) => {
        const { data, error } = await supabase.from('templates').insert([
            { name, description, file_path: filePath, frame_count: frameCount }
        ]).select('id').single();
        if (error) throw error;
        return data.id;
    },
    updateConfig: async (id, configObj) => {
        const frameCount = configObj.slots ? configObj.slots.length : 4;
        const { error } = await supabase.from('templates').update({
            config: configObj,
            frame_count: frameCount
        }).eq('id', id);
        if (error) throw error;
        return 1;
    },
    delete: async (id) => {
        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) throw error;
        return 1;
    }
};

module.exports = Template;
