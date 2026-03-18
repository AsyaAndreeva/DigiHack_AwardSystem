const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src/app', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = content
            .replace(/rounded-none/g, 'rounded-md')
            .replace(/rounded-sm/g, 'rounded-md');
        if (content !== modified) {
            fs.writeFileSync(filePath, modified, 'utf8');
            console.log('Modified: ' + filePath);
        }
    }
});
