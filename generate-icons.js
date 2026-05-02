const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, text) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(size / 3)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

fs.writeFileSync('public/icons/icon-192x192.png', createIcon(192, 'SKS'));
fs.writeFileSync('public/icons/icon-512x512.png', createIcon(512, 'SKS'));
console.log('Icons generated successfully.');
