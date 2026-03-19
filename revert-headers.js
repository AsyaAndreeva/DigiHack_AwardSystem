const fs = require('fs');
const path = require('path');

function revertMaxW(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            revertMaxW(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalLength = content.length;
            
            content = content.replace(/max-w-7xl mx-auto /g, '');
            // Only revert the header's max-w-[1600px] explicitly so we don't break main layout container if not intended
            content = content.replace(/max-[w]-\[1600px\] mx-auto w-full flex items-center/g, 'w-full flex items-center');
            // But let's also remove it from the sticky sub-header footer (line 524)
            content = content.replace(/max-[w]-\[1600px\] mx-auto flex items-center justify-between/g, 'flex items-center justify-between w-full px-4 md:px-8');

            if (content !== fs.readFileSync(fullPath, 'utf8')) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Reverted: ${fullPath}`);
            }
        }
    }
}

revertMaxW(path.join(__dirname, 'src/app'));
console.log('Done reverting headers.');
