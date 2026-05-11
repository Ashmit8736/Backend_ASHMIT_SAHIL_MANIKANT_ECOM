const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

const jsFiles = getAllFiles(srcDir);
// Also include server.js
jsFiles.push(path.join(__dirname, 'server.js'));

const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
let mismatches = [];

jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
        const reqPath = match[1];
        if (!reqPath.startsWith('.')) continue; // skip node_modules

        const parts = reqPath.split('/');
        let currentDir = path.dirname(file);
        let errorFound = false;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part === '.') continue;
            if (part === '..') {
                currentDir = path.dirname(currentDir);
                continue;
            }

            if (!fs.existsSync(currentDir)) break;
            
            const files = fs.readdirSync(currentDir);
            
            // Check exact match
            if (files.includes(part)) {
                currentDir = path.join(currentDir, part);
            } else if (files.includes(part + '.js')) {
                currentDir = path.join(currentDir, part + '.js');
            } else {
                // Not found exact, find case insensitive
                const lowerPart = part.toLowerCase();
                const found = files.find(f => f.toLowerCase() === lowerPart || f.toLowerCase() === lowerPart + '.js');
                if (found) {
                    mismatches.push({
                        file: path.relative(__dirname, file),
                        importedAs: reqPath,
                        actualName: found,
                        partThatFailed: part
                    });
                }
                errorFound = true;
                break;
            }
        }
    }
});

console.log(JSON.stringify(mismatches, null, 2));
