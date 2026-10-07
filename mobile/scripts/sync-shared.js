// Copies the shared validation/constants module into the mobile app so it also works
// when the mobile app lives in its own repository. Run: npm run sync:shared
const fs = require('fs');
const path = require('path');
const src = path.resolve(__dirname, '../../shared/index.js');
const dest = path.resolve(__dirname, '../src/shared/index.js');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log('Synced shared module ->', path.relative(process.cwd(), dest));
