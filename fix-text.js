const fs = require('fs');
const path = require('path');

function replaceTextMain(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceTextMain(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;

            // Globally replace the defunct class with the exact hex
            content = content.replace(/text-bg-main/g, 'text-[#0A1128]');

            // Also, replace bg-[#a1d600] if any other hover shades exist
            content = content.replace(/hover:bg-\[#a1d600\]/ig, 'hover:brightness-110');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Replaced text-bg-main in: ${fullPath}`);
            }
        }
    }
}

replaceTextMain(path.join(__dirname, 'src'));
console.log('Done fixing text contrast.');
