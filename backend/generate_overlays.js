/**
 * generate_overlays.js
 * Script satu kali untuk membuat aset overlay SVG dummy bergaya Scrapbook & Y2K.
 * Jalankan: node generate_overlays.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'uploads', 'overlays');

const overlays = [
    // ----- VINTAGE DIARY Background -----
    {
        name: 'vintage_bg.png',
        width: 800,
        height: 1300,
        svg: `<svg width="800" height="1300" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="1300" fill="#8B2E3F"/>
          <!-- Vintage paper texture dots -->
          ${Array.from({length: 300}, (_, i) => 
            `<circle cx="${Math.floor((i * 137) % 800)}" cy="${Math.floor((i * 97) % 1300)}" r="1.5" fill="rgba(255,255,255,0.04)"/>`
          ).join('')}
          <!-- Old letter script overlay -->
          <text x="20" y="200" font-family="serif" font-size="18" fill="rgba(255,255,255,0.08)" transform="rotate(-15, 20, 200)">Liebe, die ich niemals sah</text>
          <text x="80" y="280" font-family="serif" font-size="15" fill="rgba(255,255,255,0.06)" transform="rotate(-10, 80, 280)">dream a little dream of me</text>
          <text x="40" y="700" font-family="serif" font-size="20" fill="rgba(255,255,255,0.06)" transform="rotate(8, 40, 700)">pearl and sweetheart</text>
          <!-- Decorative bottom text -->
          <text x="480" y="1260" font-family="cursive" font-size="22" fill="rgba(255,220,220,0.35)">dream a little dream of me</text>
          <!-- Vinyl record circle -->
          <circle cx="130" cy="1100" r="80" fill="#1a0a00" stroke="rgba(255,200,150,0.3)" stroke-width="2"/>
          <circle cx="130" cy="1100" r="55" fill="none" stroke="rgba(255,200,150,0.15)" stroke-width="1"/>
          <circle cx="130" cy="1100" r="30" fill="none" stroke="rgba(255,200,150,0.15)" stroke-width="1"/>
          <circle cx="130" cy="1100" r="8" fill="#5a2a00"/>
          <!-- White flowers (simplified circles) -->
          <circle cx="720" cy="380" r="35" fill="rgba(255,255,255,0.25)"/>
          <circle cx="700" cy="350" r="20" fill="rgba(255,255,255,0.2)"/>
          <circle cx="740" cy="360" r="15" fill="rgba(255,255,255,0.2)"/>
          <!-- Small blue flowers scattered -->
          <circle cx="500" cy="1150" r="6" fill="rgba(150,180,255,0.6)"/>
          <circle cx="520" cy="1170" r="5" fill="rgba(150,180,255,0.5)"/>
          <circle cx="480" cy="1165" r="4" fill="rgba(150,180,255,0.5)"/>
          <circle cx="600" cy="1200" r="5" fill="rgba(150,180,255,0.5)"/>
          <!-- Gramophone silhouette -->
          <circle cx="200" cy="650" r="40" fill="none" stroke="rgba(180,130,80,0.5)" stroke-width="2"/>
          <rect x="240" y="620" width="50" height="8" fill="rgba(180,130,80,0.4)" rx="4"/>
          <polygon points="290,610 310,630 290,650" fill="rgba(180,130,80,0.4)"/>
        </svg>`
    },

    // ----- VINTAGE DIARY: Photo Frame Polaroid Style -----
    {
        name: 'polaroid_frame.png',
        width: 520,
        height: 430,
        svg: `<svg width="520" height="430" xmlns="http://www.w3.org/2000/svg">
          <rect width="520" height="430" fill="white" rx="4"/>
          <rect x="12" y="12" width="496" height="370" fill="rgba(200,210,240,0.4)" rx="2" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>
          <!-- Corner marks -->
          <line x1="12" y1="24" x2="24" y2="24" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="24" y1="12" x2="24" y2="24" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="496" y1="24" x2="508" y2="24" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="496" y1="12" x2="496" y2="24" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="12" y1="382" x2="24" y2="382" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="24" y1="382" x2="24" y2="394" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="496" y1="382" x2="508" y2="382" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
          <line x1="496" y1="382" x2="496" y2="394" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
        </svg>`
    },

    // ----- Y2K Background -----
    {
        name: 'y2k_bg.png',
        width: 800,
        height: 1200,
        svg: `<svg width="800" height="1200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="y2kGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#b5a0c8"/>
              <stop offset="50%" style="stop-color:#c9a89d"/>
              <stop offset="100%" style="stop-color:#a89db5"/>
            </linearGradient>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2.5" fill="rgba(255,255,255,0.2)"/>
            </pattern>
          </defs>
          <rect width="800" height="1200" fill="url(#y2kGrad)"/>
          <rect width="800" height="1200" fill="url(#dots)"/>
          <!-- Spiral notebook rings at top -->
          ${Array.from({length: 12}, (_, i) => 
            `<ellipse cx="${60 + i*60}" cy="35" rx="12" ry="18" fill="none" stroke="rgba(180,180,180,0.7)" stroke-width="3"/>
             <rect x="${52 + i*60}" y="20" width="16" height="6" fill="url(#y2kGrad)" stroke="rgba(180,180,180,0.3)" stroke-width="1"/>`
          ).join('')}
          <!-- Torn paper top edge -->
          <path d="M0,60 Q40,50 80,65 Q120,75 160,58 Q200,45 240,62 Q280,78 320,60 Q360,45 400,65 Q440,80 480,58 Q520,42 560,65 Q600,82 640,60 Q680,45 720,65 Q760,80 800,60 L800,0 L0,0 Z" fill="rgba(245,235,220,0.85)"/>
          <!-- Y2K Star stickers -->
          <text x="680" y="170" font-size="48" fill="#FF6B9D" opacity="0.85">✦</text>
          <text x="30" y="1100" font-size="36" fill="#6BB5FF" opacity="0.85">✦</text>
          <text x="730" y="1050" font-size="28" fill="#B56BFF" opacity="0.7">★</text>
          <text x="50" y="250" font-size="24" fill="#FF9B6B" opacity="0.7">✦</text>
          <!-- Balloon dog outline (simplified) -->
          <circle cx="680" cy="1050" r="30" fill="none" stroke="#FF6B9D" stroke-width="3" opacity="0.6"/>
          <circle cx="710" cy="1070" r="25" fill="none" stroke="#FF6B9D" stroke-width="3" opacity="0.6"/>
          <circle cx="660" cy="1085" r="22" fill="none" stroke="#FF6B9D" stroke-width="3" opacity="0.6"/>
          <!-- Chain decoration top right -->
          ${Array.from({length: 8}, (_, i) =>
            `<circle cx="740" cy="${80 + i*25}" r="8" fill="none" stroke="rgba(160,160,180,0.6)" stroke-width="2"/>
             <line x1="740" y1="${88 + i*25}" x2="740" y2="${105 + i*25}" stroke="rgba(160,160,180,0.6)" stroke-width="2"/>`
          ).join('')}
        </svg>`
    },

    // ----- Y2K Phone Frame -----
    {
        name: 'y2k_phone_frame.png',
        width: 400,
        height: 500,
        svg: `<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#d4a9a0"/>
              <stop offset="100%" style="stop-color:#c49088"/>
            </linearGradient>
          </defs>
          <!-- Phone body -->
          <rect x="20" y="20" width="360" height="460" rx="40" ry="40" fill="url(#phoneGrad)" stroke="rgba(180,120,100,0.5)" stroke-width="3"/>
          <!-- Screen bezel -->
          <rect x="40" y="50" width="320" height="330" rx="16" fill="rgba(200,220,255,0.3)" stroke="rgba(180,140,130,0.6)" stroke-width="2"/>
          <!-- Photo area -->
          <rect x="50" y="60" width="300" height="310" rx="12" fill="rgba(200,215,255,0.4)"/>
          <!-- Bottom button cluster -->
          <circle cx="200" cy="440" r="20" fill="rgba(160,100,90,0.5)" stroke="rgba(140,80,70,0.4)" stroke-width="2"/>
          <circle cx="150" cy="440" r="12" fill="rgba(160,100,90,0.4)"/>
          <circle cx="250" cy="440" r="12" fill="rgba(160,100,90,0.4)"/>
          <circle cx="110" cy="440" r="8" fill="rgba(160,100,90,0.35)"/>
          <circle cx="290" cy="440" r="8" fill="rgba(160,100,90,0.35)"/>
          <!-- Speaker at top -->
          <rect x="150" y="30" width="100" height="8" rx="4" fill="rgba(140,90,80,0.4)"/>
          <!-- Side button -->
          <rect x="380" y="120" width="10" height="40" rx="4" fill="rgba(160,110,100,0.6)"/>
          <rect x="380" y="180" width="10" height="30" rx="4" fill="rgba(160,110,100,0.6)"/>
        </svg>`
    },

    // ----- PASTEL GRID Background -----
    {
        name: 'pastel_grid_bg.png',
        width: 1300,
        height: 1300,
        svg: `<svg width="1300" height="1300" xmlns="http://www.w3.org/2000/svg">
          <rect width="1300" height="1300" fill="#f8f4f0"/>
          <!-- Subtle grain texture -->
          ${Array.from({length: 200}, (_, i) => 
            `<rect x="${Math.floor((i * 211) % 1300)}" y="${Math.floor((i * 173) % 1300)}" width="2" height="2" fill="rgba(0,0,0,0.015)"/>`
          ).join('')}
          <!-- Corner decorative dots -->
          <circle cx="60" cy="60" r="8" fill="rgba(124,58,237,0.15)"/>
          <circle cx="90" cy="60" r="5" fill="rgba(244,114,182,0.15)"/>
          <circle cx="60" cy="90" r="5" fill="rgba(167,139,250,0.15)"/>
          <circle cx="1240" cy="60" r="8" fill="rgba(244,114,182,0.15)"/>
          <circle cx="60" cy="1240" r="8" fill="rgba(167,139,250,0.15)"/>
          <circle cx="1240" cy="1240" r="8" fill="rgba(124,58,237,0.15)"/>
        </svg>`
    }
];

async function generate() {
    console.log('Generating overlay assets...');
    for (const ov of overlays) {
        const outPath = path.join(OUT, ov.name);
        await sharp(Buffer.from(ov.svg))
            .png()
            .toFile(outPath);
        console.log(`✓ Generated: ${ov.name}`);
    }
    console.log('\nAll overlays generated!');
}

generate().catch(console.error);
