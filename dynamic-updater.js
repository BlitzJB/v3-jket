// This script adds the dynamic export to all route.ts files

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

// Import statement to add to route files
const dynamicImport = "import { dynamic, revalidate } from '@/app/config';\n\nexport { dynamic, revalidate };\n\n";
const apiDynamicImport = "import { dynamic, revalidate } from '../config';\n\nexport { dynamic, revalidate };\n\n";

function findRouteFiles(dir, isApi = false) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        findRouteFiles(filePath, isApi || file === 'api');
      }
    } else if (file === 'route.ts' || file === 'page.tsx') {
      // Process route.ts and page.tsx files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip if already has the import
      if (content.includes('export { dynamic, revalidate }')) {
        console.log(`Skipping ${filePath} - already has dynamic export`);
        return;
      }
      
      // Add the import statement at the beginning of the file
      const importToAdd = isApi ? apiDynamicImport : dynamicImport;
      const newContent = importToAdd + content;
      
      fs.writeFileSync(filePath, newContent);
      console.log(`Updated ${filePath}`);
    }
  });
}

console.log('Updating route files to be dynamic...');
findRouteFiles(appDir);
console.log('Done!'); 