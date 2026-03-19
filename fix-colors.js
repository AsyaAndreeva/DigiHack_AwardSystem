const fs = require('fs');
const path = require('path');

function replaceDeepColors(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceDeepColors(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let initial = content;
            
            // 1. Replace rgba(196,255,0,0.X) with color-mix
            content = content.replace(/rgba\(196,255,0,0\.(\d+)\)/g, (match, p1) => {
                let percent = p1.length === 1 ? p1 + '0' : p1; // 0.3 -> 30, 0.15 -> 15
                return `color-mix(in_srgb,var(--color-brand-500)_${percent}%,transparent)`;
            });

            // 2. Replace hardcoded hover shades #a1d600 (darker shade of #c4ff00)
            content = content.replace(/hover:bg-\[#a1d600\]/ig, 'hover:brightness-110');
            content = content.replace(/hover:text-\[#a1d600\]/ig, 'hover:brightness-110');
            
            // 3. Any straggler #c4ff00 just in case
            content = content.replace(/\[#c4ff00\]/ig, 'brand-500');

            if (content !== initial) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Deep fixed colors in: ${fullPath}`);
            }
        }
    }
}

replaceDeepColors(path.join(__dirname, 'src'));
console.log('Done deep fixing colors.');
