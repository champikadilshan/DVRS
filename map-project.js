import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, basename, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
    // Directories to ignore
    ignoreDirs: [
        'node_modules',
        'dist',
        'build',
        '.git',
        '.github',
        'coverage',
        '.next',
        '.nuxt',
        '.vscode',
        '.idea'
    ],
    // File extensions to include
    includeExtensions: [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.css',
        '.scss',
        '.json',
        '.html',
        '.md',
        '.env',
        '.config.js',
        '.config.ts'
    ],
    // Files to ignore
    ignoreFiles: [
        'package-lock.json',
        'yarn.lock',
        '.DS_Store',
        'thumbs.db'
    ]
};

// Store all file paths
const filePaths = [];

// Function to check if a path should be ignored
function shouldIgnore(pathName) {
    const base = basename(pathName);
    return CONFIG.ignoreDirs.includes(base) ||
           CONFIG.ignoreFiles.includes(base) ||
           base.startsWith('.');
}

// Function to check if file extension should be included
function shouldIncludeFile(fileName) {
    const ext = extname(fileName);
    return CONFIG.includeExtensions.includes(ext) ||
           CONFIG.includeExtensions.some(e => fileName.endsWith(e));
}

// Main recursive function to walk through directories
function walkDir(currentPath, indent = '') {
    const files = readdirSync(currentPath);
    
    files.forEach(file => {
        const filePath = join(currentPath, file);
        const stats = statSync(filePath);
        
        if (shouldIgnore(filePath)) {
            return;
        }

        if (stats.isDirectory()) {
            filePaths.push(`${indent}📁 ${file}/`);
            walkDir(filePath, indent + '  ');
        } else if (shouldIncludeFile(file)) {
            const relativePath = relative(process.cwd(), filePath);
            filePaths.push(`${indent}📄 ${file} (${relativePath})`);
        }
    });
}

// Function to generate imports map
function generateImportsMap() {
    const importsMap = {};
    
    filePaths.forEach(filePath => {
        if (filePath.includes('(')) {
            const fullPath = filePath.split('(')[1].split(')')[0];
            const ext = extname(fullPath);
            if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
                importsMap[fullPath] = `import { ComponentName } from '${fullPath.replace(ext, '')}';`;
            }
        }
    });

    return importsMap;
}

// Main execution
console.log('🗂️ Project Structure:\n');
walkDir(process.cwd());

// Print results
filePaths.forEach(path => console.log(path));

// Generate and print imports map
console.log('\n📦 Potential Import Statements:\n');
const importsMap = generateImportsMap();
Object.values(importsMap).forEach(importStatement => console.log(importStatement));

// Save to file
const output = [
    '# Project Structure',
    '',
    ...filePaths,
    '',
    '# Potential Import Statements',
    '',
    ...Object.values(importsMap)
].join('\n');

writeFileSync('project-structure.md', output);
console.log('\n✅ Project structure has been saved to project-structure.md');