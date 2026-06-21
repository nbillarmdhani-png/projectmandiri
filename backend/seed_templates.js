require('dotenv').config();
const supabase = require('./config/db');
const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        const templateDir = 'd:\\proyek\\photobooth\\template';
        if (!fs.existsSync(templateDir)) {
            console.log('Template dir not found:', templateDir);
            return;
        }

        const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.png'));
        console.log(`Found ${files.length} template files. Seeding to Supabase...`);

        const { data: existing } = await supabase.from('templates').select('name');
        const existingNames = existing ? existing.map(e => e.name) : [];

        for (const file of files) {
            const name = file.replace('.png', '');
            if (existingNames.includes(name)) {
                console.log(`Skipping ${name}, already exists.`);
                continue;
            }

            const srcPath = path.join(templateDir, file);
            const fileBuffer = fs.readFileSync(srcPath);
            const safeName = file.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const destName = `template_${Date.now()}_${safeName}`;

            console.log(`Uploading ${name} to Storage...`);
            const { error: uploadError } = await supabase.storage.from('overlays').upload(destName, fileBuffer, {
                contentType: 'image/png'
            });

            if (uploadError) {
                console.error('Failed to upload:', uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage.from('overlays').getPublicUrl(destName);

            const config = {
                canvasWidth: 1080,
                canvasHeight: 1350,
                backgroundOverlay: publicUrl,
                slots: []
            };

            const { error: dbError } = await supabase.from('templates').insert([
                {
                    name: name,
                    description: `Template ${name}`,
                    file_path: publicUrl,
                    config: config
                }
            ]);

            if (dbError) {
                console.error('Failed to insert DB:', dbError.message);
            } else {
                console.log(`Successfully seeded ${name}`);
            }
        }

        console.log('Seeding completed!');
    } catch (e) {
        console.error(e);
    }
}

seed();
