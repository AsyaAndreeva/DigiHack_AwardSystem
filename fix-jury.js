const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/app/jury/page.tsx'),
  path.join(__dirname, 'src/app/dashboard/page.tsx'),
  path.join(__dirname, 'src/app/evaluate/[teamId]/page.tsx')
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/brand-yellow/g, 'brand-light-blue');
        content = content.replace(/rgba\(218,\s*234,\s*95/g, 'rgba(166, 195, 255');
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
    }
});
