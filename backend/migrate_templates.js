/**
 * migrate_templates.js
 * Menambah kolom `config` ke tabel templates dan mengisi 6 template bervariasi.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Adding config column...');
        try {
            await connection.query(`ALTER TABLE templates ADD COLUMN config JSON NULL AFTER frame_count`);
            console.log('✓ Column added');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists, skipping.');
            } else throw e;
        }

        console.log('Adding thumbnail_url column...');
        try {
            await connection.query(`ALTER TABLE templates ADD COLUMN thumbnail_url VARCHAR(255) NULL AFTER config`);
            console.log('✓ Column added');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists, skipping.');
            } else throw e;
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE templates');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const templates = [
            // ID 1: Classic Vertical Strip (1x4)
            {
                id: 1,
                name: 'Classic Strip',
                description: '4 shots, clean vertical layout',
                file_path: '/uploads/templates/classic.png',
                frame_count: 4,
                thumbnail_url: null,
                config: JSON.stringify({
                    engine: 'grid',
                    canvasWidth: 700,
                    canvasHeight: 2100,
                    background: { r: 255, g: 255, b: 255 },
                    slots: [
                        { top: 40, left: 40, width: 620, height: 460 },
                        { top: 540, left: 40, width: 620, height: 460 },
                        { top: 1040, left: 40, width: 620, height: 460 },
                        { top: 1540, left: 40, width: 620, height: 460 }
                    ],
                    decorations: []
                })
            },
            // ID 2: Grid Collage 2x2
            {
                id: 2,
                name: 'Grid Collage',
                description: '4 shots in a 2×2 aesthetic grid',
                file_path: '/uploads/templates/grid.png',
                frame_count: 4,
                thumbnail_url: null,
                config: JSON.stringify({
                    engine: 'grid',
                    canvasWidth: 1300,
                    canvasHeight: 1300,
                    background: { r: 248, g: 244, b: 240 },
                    backgroundOverlay: '/uploads/overlays/pastel_grid_bg.png',
                    slots: [
                        { top: 60, left: 60, width: 570, height: 570 },
                        { top: 60, left: 670, width: 570, height: 570 },
                        { top: 670, left: 60, width: 570, height: 570 },
                        { top: 670, left: 670, width: 570, height: 570 }
                    ],
                    decorations: []
                })
            },
            // ID 3: Cinematic Strip 1x3
            {
                id: 3,
                name: 'Cinematic',
                description: '3 widescreen shots for a film-like look',
                file_path: '/uploads/templates/cinematic.png',
                frame_count: 3,
                thumbnail_url: null,
                config: JSON.stringify({
                    engine: 'grid',
                    canvasWidth: 800,
                    canvasHeight: 1400,
                    background: { r: 15, g: 15, b: 20 },
                    slots: [
                        { top: 60, left: 40, width: 720, height: 400, borderColor: { r: 255, g: 255, b: 255 }, borderWidth: 3 },
                        { top: 520, left: 40, width: 720, height: 400, borderColor: { r: 255, g: 255, b: 255 }, borderWidth: 3 },
                        { top: 980, left: 40, width: 720, height: 400, borderColor: { r: 255, g: 255, b: 255 }, borderWidth: 3 }
                    ],
                    decorations: []
                })
            },
            // ID 4: Retro Polaroid Single
            {
                id: 4,
                name: 'Retro Polaroid',
                description: '1 shot with thick white bottom margin',
                file_path: '/uploads/templates/polaroid.png',
                frame_count: 1,
                thumbnail_url: null,
                config: JSON.stringify({
                    engine: 'scrapbook',
                    canvasWidth: 700,
                    canvasHeight: 900,
                    background: { r: 255, g: 255, b: 255 },
                    slots: [
                        { top: 40, left: 40, width: 620, height: 620, rotation: 0 }
                    ],
                    decorations: []
                })
            },
            // ID 5: Vintage Diary (Scrapbook 2 frames)
            {
                id: 5,
                name: 'Vintage Diary',
                description: '2 polaroid shots on a moody vintage background',
                file_path: '/uploads/templates/vintage.png',
                frame_count: 2,
                thumbnail_url: null,
                config: JSON.stringify({
                    engine: 'scrapbook',
                    canvasWidth: 800,
                    canvasHeight: 1300,
                    background: { r: 139, g: 46, b: 63 },
                    backgroundOverlay: '/uploads/overlays/vintage_bg.png',
                    slots: [
                        {
                            top: 80, left: 100, width: 520, height: 430,
                            rotation: -5,
                            frameOverlay: '/uploads/overlays/polaroid_frame.png'
                        },
                        {
                            top: 680, left: 170, width: 520, height: 430,
                            rotation: 4,
                            frameOverlay: '/uploads/overlays/polaroid_frame.png'
                        }
                    ],
                    decorations: []
                })
            },
            // ID 6: Y2K Retro (1 frame in phone-style)
            {
                id: 6,
                name: 'Y2K Retro',
                description: '1 shot inside a nostalgic Y2K phone frame',
                file_path: '/uploads/templates/y2k.png',
                frame_count: 1,
                thumbnail_url: null,
                config: JSON.stringify({
                    engine: 'scrapbook',
                    canvasWidth: 800,
                    canvasHeight: 1200,
                    background: { r: 181, g: 160, b: 200 },
                    backgroundOverlay: '/uploads/overlays/y2k_bg.png',
                    slots: [
                        {
                            top: 265, left: 250, width: 300, height: 310,
                            rotation: 0,
                            frameOverlay: null
                        }
                    ],
                    decorations: [
                        { type: 'overlay', path: '/uploads/overlays/y2k_phone_frame.png', top: 150, left: 200, width: 400, height: 500 }
                    ]
                })
            }
        ];

        console.log('Inserting templates...');
        for (const t of templates) {
            await connection.query(
                `INSERT INTO templates (id, name, description, file_path, frame_count, config, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [t.id, t.name, t.description, t.file_path, t.frame_count, t.config, t.thumbnail_url]
            );
            console.log(`  ✓ ${t.name}`);
        }

        console.log('\nMigration complete!');
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

migrate();
