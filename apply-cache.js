const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
            if (file.endsWith('route.ts')) {
                results.push(file);
            }
          next();
        }
      });
    })();
  });
};

const cacheText = `export const dynamic = 'force-dynamic';\nexport const revalidate = 0;\nexport const fetchCache = 'force-no-store';\n\n`;

walk(path.join(__dirname, 'src', 'app', 'api'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
      let content = fs.readFileSync(file, 'utf8');
      if (!content.includes('export const dynamic')) {
          // Find the last import
          const importMatches = [...content.matchAll(/^import .*;$/gm)];
          if (importMatches.length > 0) {
              const lastMatch = importMatches[importMatches.length - 1];
              const insertPos = lastMatch.index + lastMatch[0].length + 1;
              const newContent = content.slice(0, insertPos) + '\n' + cacheText + content.slice(insertPos);
              fs.writeFileSync(file, newContent);
              console.log('Modified ' + file);
          } else {
              fs.writeFileSync(file, cacheText + content);
              console.log('Modified ' + file);
          }
      } else {
          console.log('Skipped ' + file);
      }
  });
});
