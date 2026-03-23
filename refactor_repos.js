const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, 'src', 'domain', 'tenant', 'repositories');
const useCasePath = path.join(__dirname, 'src', 'application', 'tenant', 'use-cases');
const adapterPath = path.join(__dirname, 'src', 'infrastructure', 'tenant', 'stores-adapters');

function processDir(dir, fileCallback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath, fileCallback);
    } else if (fullPath.endsWith('.ts')) {
      fileCallback(fullPath);
    }
  }
}

// 1. Refactor Repositories
processDir(repoPath, (file) => {
  let content = fs.readFileSync(file, 'utf8');
  // Return void -> Promise<void>
  content = content.replace(/\): void;/g, '): Promise<void>;');
  
  // Return Object -> Promise<Object>
  // e.g. ): Sale | undefined; -> ): Promise<Sale | undefined>;
  content = content.replace(/\): ([A-Za-z0-9_\[\]\{\}\|& <>\?'"\n\r]+);/g, (match, p1) => {
    if (p1.startsWith('Promise')) return match; 
    return `): Promise<${p1.trim()}>;`;
  });
  
  fs.writeFileSync(file, content);
});

// 2. Refactor Zustand Adapters
processDir(adapterPath, (file) => {
  if (!file.includes('Zustand')) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // async keyword
  content = content.replace(/([a-zA-Z0-9_]+)\((.*?)\):/g, (match, p1, p2) => {
    if (p1 === 'constructor') return match;
    if (match.startsWith('async')) return match;
    // Don't asyncify local variables or closures inside methods easily
    return `async ${p1}(${p2}):`;
  });

  // return void
  content = content.replace(/\): void \{/g, '): Promise<void> {');
  
  // return types
  content = content.replace(/\): ([A-Za-z0-9_\[\]\{\}\|& <>\?'"\n\r]+) \{/g, (match, p1) => {
    if (p1.startsWith('Promise')) return match;
    return `): Promise<${p1.trim()}> {`;
  });

  fs.writeFileSync(file, content);
});

console.log("Refactoring complete!");
