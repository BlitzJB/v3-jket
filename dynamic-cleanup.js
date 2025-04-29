// This script removes the previous dynamic export changes

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

// Function to clean a single file
function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has our import
  if (content.includes("import { dynamic, revalidate } from '") && 
      content.includes("export { dynamic, revalidate };")) {
    
    // Remove the import and export lines
    const importLine = content.match(/import { dynamic, revalidate } from .+\n/);
    const exportLine = content.match(/export { dynamic, revalidate };\n\n/);
    
    if (importLine && exportLine) {
      const newContent = content
        .replace(importLine[0], '')
        .replace(exportLine[0], '');
      
      fs.writeFileSync(filePath, newContent);
      console.log(`Cleaned ${filePath}`);
    }
  }
}

// Function to find and clean all route files
function findRouteFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        findRouteFiles(filePath);
      }
    } else if (file === 'route.ts' || file === 'page.tsx') {
      // Process route.ts and page.tsx files
      cleanFile(filePath);
    }
  });
}

console.log('Cleaning route files...');
findRouteFiles(appDir);
console.log('Done!'); 