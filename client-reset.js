// This script removes dynamic export code from all client components

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

// Function to clean a single file
function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has our import
  if (content.includes("import { dynamic, revalidate }") && 
      content.includes("export { dynamic, revalidate }")) {
    
    // Remove the import and export lines
    let newContent = content
      .replace(/import \{ dynamic, revalidate \} from [^\n]+\n\n?/g, '')
      .replace(/export \{ dynamic, revalidate \};\n\n?/g, '');
    
    fs.writeFileSync(filePath, newContent);
    console.log(`Cleaned ${filePath}`);
  }
}

// Function to find and clean all files
function findAndCleanFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        findAndCleanFiles(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Process .tsx and .ts files
      cleanFile(filePath);
    }
  });
}

console.log('Cleaning files...');
findAndCleanFiles(appDir);
console.log('Done!'); 