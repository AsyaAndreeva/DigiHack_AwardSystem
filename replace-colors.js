const fs = require('fs');
const path = require('path');

function replaceColor(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            replaceColor(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalLength = content.length;
            
            // Replaces text-[#C4FF00] with text-brand-500
            // and bg-[#C4FF00] with bg-brand-500
            // and everything else ending in [#C4FF00]
            content = content.replace(/\[#C4FF00\]/ig, 'brand-500');
            
            if (content !== fs.readFileSync(fullPath, 'utf8')) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

replaceColor(path.join(__dirname, 'src'));
console.log('Global color replacement complete.');
