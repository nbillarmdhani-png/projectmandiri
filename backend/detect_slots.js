const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function detectSlots(imagePath) {
    console.log('Analyzing:', imagePath);
    const { data, info } = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    
    let minAlpha = 255;
    for (let i = 3; i < data.length; i += info.channels) {
        if (data[i] < minAlpha) minAlpha = data[i];
    }
    console.log('Minimum alpha value:', minAlpha);
    
    // Create a 2D boolean array for transparency (alpha < 250)
    const isTransparent = new Array(height).fill(0).map(() => new Array(width).fill(false));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * info.channels;
            const alpha = data[idx + 3];
            // If the transparent slots are white or transparent, we can also check RGB
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Sometimes templates use pure white or green screen or just alpha
            if (alpha < 50) {
                isTransparent[y][x] = true;
            }
        }
    }

    const visited = new Array(height).fill(0).map(() => new Array(width).fill(false));
    const slots = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (isTransparent[y][x] && !visited[y][x]) {
                let minX = x;
                let minY = y;
                let maxX = x;
                let maxY = y;

                const queue = [[x, y]];
                visited[y][x] = true;

                while (queue.length > 0) {
                    const [cx, cy] = queue.shift();
                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            if (isTransparent[ny][nx] && !visited[ny][nx]) {
                                visited[ny][nx] = true;
                                queue.push([nx, ny]);
                            }
                        }
                    }
                }

                const slotWidth = maxX - minX + 1;
                const slotHeight = maxY - minY + 1;
                
                if (slotWidth > 20 && slotHeight > 20) {
                    slots.push({
                        top: minY,
                        left: minX,
                        width: slotWidth,
                        height: slotHeight
                    });
                }
            }
        }
    }
    
    console.log(`Detected ${slots.length} slots:`);
    console.dir(slots);
}

detectSlots(process.argv[2]).catch(console.error);
