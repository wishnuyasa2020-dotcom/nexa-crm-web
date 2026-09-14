/**
 * Utility Script: Favicon & App Icon Generator for Nexa CRM
 * 
 * Menghasilkan seluruh aset favicon, PWA icon (any & maskable), dan Apple Touch Icon
 * langsung dari master file: public/logo.png (512x512 transparent).
 * 
 * Penggunaan:
 *   node generate_favicons.js
 */

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('⚠️  Package "sharp" belum terpasang.');
  console.error('Jalankan via: npx -p sharp node generate_favicons.js');
  process.exit(0);
}

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const logoPath = path.resolve('public/logo.png');
  if (!fs.existsSync(logoPath)) {
    throw new Error('Master logo source not found at ' + logoPath);
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const base64Logo = logoBuffer.toString('base64');

  console.log('Source logo:', logoPath);
  console.log('Source logo size:', logoBuffer.length, 'bytes');

  // 1. Generate transparent PNG buffers (Favicon & Standard PWA Icons)
  const [b16, b32, b48, b64, b192, b512] = await Promise.all([
    sharp(logoBuffer).resize(16, 16).png().toBuffer(),
    sharp(logoBuffer).resize(32, 32).png().toBuffer(),
    sharp(logoBuffer).resize(48, 48).png().toBuffer(),
    sharp(logoBuffer).resize(64, 64).png().toBuffer(),
    sharp(logoBuffer).resize(192, 192).png().toBuffer(),
    sharp(logoBuffer).resize(512, 512).png().toBuffer(),
  ]);

  // 2. Generate Full-Bleed Maskable Icons on White Background (Homescreen & Apple Touch)
  const [maskable512, maskable192, appleTouch180] = await Promise.all([
    sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).composite([{ input: logoBuffer, gravity: 'center' }]).png().toBuffer(),

    sharp({
      create: {
        width: 192,
        height: 192,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).composite([{ input: await sharp(logoBuffer).resize(192, 192).png().toBuffer(), gravity: 'center' }]).png().toBuffer(),

    sharp({
      create: {
        width: 180,
        height: 180,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).composite([{ input: await sharp(logoBuffer).resize(180, 180).png().toBuffer(), gravity: 'center' }]).png().toBuffer(),
  ]);

  // 3. Write PNG assets to public/ and src/app/
  // Favicons (Transparent)
  fs.writeFileSync('public/favicon-16x16.png', b16);
  fs.writeFileSync('public/favicon-32x32.png', b32);

  // Standard PWA Icons (Transparent - purpose: "any")
  fs.writeFileSync('public/icon-192.png', b192);
  fs.writeFileSync('public/icon-512.png', b512);
  fs.writeFileSync('src/app/icon.png', b512);

  // Maskable PWA Icons (Solid White Full-Bleed - purpose: "maskable")
  fs.writeFileSync('public/launcherhp.png', maskable512);
  fs.writeFileSync('public/icon-maskable-512.png', maskable512);
  fs.writeFileSync('public/icon-maskable-192.png', maskable192);

  // Apple Touch Icon (Solid White - iOS homescreen)
  fs.writeFileSync('public/apple-touch-icon.png', appleTouch180);

  // 4. Write public/favicon.svg (High-DPI vector wrapper with embedded base64)
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${base64Logo}" width="512" height="512"/>
</svg>
`;
  fs.writeFileSync('public/favicon.svg', svgContent, 'utf8');

  // 5. Create standard Windows Multi-resolution ICO (16x16, 32x32, 48x48, 64x64)
  const icoEntries = [
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
    { width: 64, height: 64, buffer: b64 }
  ];

  const count = icoEntries.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + count * entrySize;
  let totalSize = dirSize;
  for (const item of icoEntries) totalSize += item.buffer.length;

  const icoBuf = Buffer.alloc(totalSize);
  icoBuf.writeUInt16LE(0, 0); // Reserved
  icoBuf.writeUInt16LE(1, 2); // 1 = ICO
  icoBuf.writeUInt16LE(count, 4); // Number of images

  let currentOffset = dirSize;
  for (let i = 0; i < count; i++) {
    const item = icoEntries[i];
    const entryOffset = headerSize + i * entrySize;

    icoBuf.writeUInt8(item.width >= 256 ? 0 : item.width, entryOffset + 0);
    icoBuf.writeUInt8(item.height >= 256 ? 0 : item.height, entryOffset + 1);
    icoBuf.writeUInt8(0, entryOffset + 2);
    icoBuf.writeUInt8(0, entryOffset + 3);
    icoBuf.writeUInt16LE(1, entryOffset + 4);
    icoBuf.writeUInt16LE(32, entryOffset + 6);
    icoBuf.writeUInt32LE(item.buffer.length, entryOffset + 8);
    icoBuf.writeUInt32LE(currentOffset, entryOffset + 12);

    item.buffer.copy(icoBuf, currentOffset);
    currentOffset += item.buffer.length;
  }

  fs.writeFileSync('public/favicon.ico', icoBuf);
  fs.writeFileSync('src/app/favicon.ico', icoBuf);

  console.log('✅ Successfully generated all favicon and icon assets from public/logo.png:');
  console.log(' - public/favicon-16x16.png (', b16.length, 'bytes)');
  console.log(' - public/favicon-32x32.png (', b32.length, 'bytes)');
  console.log(' - public/icon-192.png (', b192.length, 'bytes)');
  console.log(' - public/icon-512.png (', b512.length, 'bytes)');
  console.log(' - src/app/icon.png (', b512.length, 'bytes)');
  console.log(' - public/launcherhp.png (', maskable512.length, 'bytes)');
  console.log(' - public/icon-maskable-512.png (', maskable512.length, 'bytes)');
  console.log(' - public/icon-maskable-192.png (', maskable192.length, 'bytes)');
  console.log(' - public/apple-touch-icon.png (', appleTouch180.length, 'bytes)');
  console.log(' - public/favicon.svg (', svgContent.length, 'bytes)');
  console.log(' - public/favicon.ico (', icoBuf.length, 'bytes)');
  console.log(' - src/app/favicon.ico (', icoBuf.length, 'bytes)');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
