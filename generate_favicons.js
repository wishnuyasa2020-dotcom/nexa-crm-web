const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const logoPath = path.resolve('../nexa-landing/logo.png');
  if (!fs.existsSync(logoPath)) {
    throw new Error('Logo source not found at ' + logoPath);
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const base64Logo = logoBuffer.toString('base64');

  console.log('Source logo size:', logoBuffer.length, 'bytes');

  // 1. Generate resized PNG buffers
  const [b16, b32, b48, b64, b180, b192, b512] = await Promise.all([
    sharp(logoBuffer).resize(16, 16).png().toBuffer(),
    sharp(logoBuffer).resize(32, 32).png().toBuffer(),
    sharp(logoBuffer).resize(48, 48).png().toBuffer(),
    sharp(logoBuffer).resize(64, 64).png().toBuffer(),
    sharp(logoBuffer).resize(180, 180).png().toBuffer(),
    sharp(logoBuffer).resize(192, 192).png().toBuffer(),
    sharp(logoBuffer).resize(512, 512).png().toBuffer(),
  ]);

  // 2. Write PNG assets to public/ and src/app/
  fs.writeFileSync('public/favicon-16x16.png', b16);
  fs.writeFileSync('public/favicon-32x32.png', b32);
  fs.writeFileSync('public/apple-touch-icon.png', b180);
  fs.writeFileSync('public/icon-192.png', b192);
  fs.writeFileSync('public/icon-512.png', b512);
  fs.writeFileSync('public/logo.png', b512);

  // App router icon convention: src/app/icon.png
  fs.writeFileSync('src/app/icon.png', b512);

  // 3. Write public/favicon.svg (high-DPI vector wrapper with embedded base64)
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${base64Logo}" width="512" height="512"/>
</svg>
`;
  fs.writeFileSync('public/favicon.svg', svgContent, 'utf8');

  // 4. Create standard Windows ICO containing 16x16, 32x32, 48x48, 64x64
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

  console.log('✅ Successfully generated all favicon and icon assets from nexa-landing/logo.png:');
  console.log(' - public/favicon-16x16.png (', b16.length, 'bytes)');
  console.log(' - public/favicon-32x32.png (', b32.length, 'bytes)');
  console.log(' - public/apple-touch-icon.png (', b180.length, 'bytes)');
  console.log(' - public/icon-192.png (', b192.length, 'bytes)');
  console.log(' - public/icon-512.png (', b512.length, 'bytes)');
  console.log(' - public/logo.png (', b512.length, 'bytes)');
  console.log(' - public/favicon.svg (', svgContent.length, 'bytes)');
  console.log(' - public/favicon.ico (', icoBuf.length, 'bytes)');
  console.log(' - src/app/favicon.ico (', icoBuf.length, 'bytes)');
  console.log(' - src/app/icon.png (', b512.length, 'bytes)');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
