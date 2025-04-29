// This script fixes client component files by putting the 'use client' directive first

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

// Function to fix a single file
function fixClientComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if file doesn't have our dynamic exports or doesn't have 'use client'
  if (!content.includes('export { dynamic, revalidate }') || 
      !content.includes('use client')) {
    return;
  }
  
  // Get the proper import path for the config
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'app'));
  const configPath = `${relativePath}/config`.replace(/\\/g, '/');
  
  // Extract the 'use client' directive 
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  
  if (hasUseClient) {
    // Remove both the dynamic import and export
    let newContent = content
      .replace(/import \{ dynamic, revalidate \} from [^\n]+\n\n/g, '')
      .replace(/export \{ dynamic, revalidate \};\n\n/g, '');
    
    // Make sure the 'use client' is at the top
    newContent = newContent.replace(/'use client'|"use client"/g, '');
    
    // Add 'use client' and dynamic imports in the correct order
    newContent = `'use client'

import { dynamic, revalidate } from '${configPath}';
export { dynamic, revalidate };

${newContent.trim()}`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed client component: ${filePath}`);
  }
}

// Function to find and process all route files
function findClientComponents(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        findClientComponents(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Process .tsx and .ts files
      fixClientComponent(filePath);
    }
  });
}

console.log('Fixing client component files...');
findClientComponents(appDir);
console.log('Done!'); 