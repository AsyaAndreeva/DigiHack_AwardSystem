const fs = require('fs');
const path = require('path');

function replaceColor(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceColor(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalLength = content.length;
            
            // Neon Green / brand-500 -> Yellow
            content = content.replace(/brand-500/g, 'brand-yellow');
            content = content.replace(/text-\[\#C4FF00\]/ig, 'text-brand-yellow');
            content = content.replace(/bg-\[\#C4FF00\]/ig, 'bg-brand-yellow');
            content = content.replace(/border-\[\#C4FF00\]/ig, 'border-brand-yellow');
            content = content.replace(/\#C4FF00/ig, '#DAEA5F');
            
            // rgba neon green shadow
            content = content.replace(/rgba\(196,\s*255,\s*0,/ig, 'rgba(218, 234, 95,');

            // Old Dark
            content = content.replace(/text-\[\#0A1128\]/ig, 'text-brand-dark');
            content = content.replace(/bg-\[\#0A1128\]/ig, 'bg-brand-dark');
            content = content.replace(/\#0A1128/ig, '#000928');

            // Old Orange
            content = content.replace(/text-\[\#FF9D00\]/ig, 'text-brand-orange');
            content = content.replace(/bg-\[\#FF9D00\]/ig, 'bg-brand-orange');
            content = content.replace(/border-\[\#FF9D00\]/ig, 'border-brand-orange');
            content = content.replace(/\#FF9D00/ig, '#F39B2D');
            content = content.replace(/rgba\(255,\s*157,\s*0,/ig, 'rgba(243, 155, 45,');

            // Old Pink
            content = content.replace(/text-\[\#FF3B5C\]/ig, 'text-brand-pink');
            content = content.replace(/bg-\[\#FF3B5C\]/gi, 'bg-brand-pink');
            content = content.replace(/border-\[\#FF3B5C\]/gi, 'border-brand-pink');
            content = content.replace(/\#FF3B5C/ig, '#EA4C64');
            content = content.replace(/rgba\(255,\s*59,\s*92,/ig, 'rgba(234, 76, 100,');
            
            // Old Tailwind Yellow
            content = content.replace(/text-yellow-400/g, 'text-brand-yellow');
            content = content.replace(/bg-yellow-400/g, 'bg-brand-yellow');
            content = content.replace(/border-yellow-400/g, 'border-brand-yellow');
            content = content.replace(/rgba\(250,\s*204,\s*21,/ig, 'rgba(218, 234, 95,');

            if (content !== fs.readFileSync(fullPath, 'utf8')) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

replaceColor(path.join(__dirname, 'src'));
console.log('Global color replacement complete.');
