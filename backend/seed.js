const db = require('./config/db');

async function seed() {
    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE templates');
        await db.query(`INSERT INTO templates (id, name, description, file_path, frame_count) VALUES 
            (1, 'Classic Vertical', '4 frames in a classic vertical strip', '/uploads/templates/classic.png', 4),
            (2, 'Grid Collage', '2x2 aesthetic grid layout', '/uploads/templates/grid.png', 4),
            (3, 'Cinematic', '3 frames in a vertical strip', '/uploads/templates/cinematic.png', 3),
            (4, 'Retro Polaroid', 'Single frame with vintage bottom margin', '/uploads/templates/polaroid.png', 1)`);
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Seeding complete');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
seed();
