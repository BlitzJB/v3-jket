// This script adds the dynamic export to all route.ts files with correct paths

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

// Function to get the relative path to app/config.ts
function getRelativeConfigPath(filePath) {
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'app'));
  return `${relativePath}/config`.replace(/\\/g, '/');
}

// Function to update a single file
function updateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already correctly updated
  if (content.includes('export const dynamic = \'force-dynamic\'') || 
      content.includes('export { dynamic, revalidate }')) {
    console.log(`Skipping ${filePath} - already has dynamic export`);
    return;
  }
  
  // Get the proper import path
  const configPath = getRelativeConfigPath(filePath);
  
  // Create import statement
  const dynamicImport = `import { dynamic, revalidate } from '${configPath}';\n\nexport { dynamic, revalidate };\n\n`;
  
  // Add the import statement at the beginning of the file
  const newContent = dynamicImport + content;
  
  fs.writeFileSync(filePath, newContent);
  console.log(`Updated ${filePath}`);
}

// Function to find and process all route files
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
      updateFile(filePath);
    }
  });
}

console.log('Updating route files to be dynamic...');
findRouteFiles(appDir);
console.log('Done!'); 