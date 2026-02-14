#!/usr/bin/env node

/**
 * FHEVM Category Generator
 * Creates projects with multiple examples from a specific category
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Category configurations
const CATEGORIES = {
  'auctions': {
    description: 'Confidential auction mechanisms using FHEVM',
    examples: ['blind-auction'],
    contracts: ['auctions/BlindAuction.sol'],
    tests: ['auctions/BlindAuction.ts']
  },
  'basic': {
    description: 'Fundamental FHE operations and patterns',
    examples: ['fhe-counter', 'encrypt-single-value'],
    contracts: ['basic/FHECounter.sol'],
    tests: ['basic/FHECounter.ts']
  }
};

function createCategory(categoryName, outputDir) {
  if (!CATEGORIES[categoryName]) {
    console.error(`❌ Category '${categoryName}' not found`);
    console.log('Available categories:', Object.keys(CATEGORIES).join(', '));
    process.exit(1);
  }

  const config = CATEGORIES[categoryName];
  const templateDir = path.join(__dirname, '..', 'fhevm-hardhat-template');
  
  console.log(`🚀 Creating ${categoryName} category project in ${outputDir}`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Copy template
  console.log('📁 Copying base template...');
  execSync(`cp -r ${templateDir}/* ${outputDir}/`, { stdio: 'inherit' });
  
  // Copy all contracts from category
  console.log(`📄 Copying ${config.contracts.length} contracts...`);
  config.contracts.forEach(contractPath => {
    const contractSrc = path.join(__dirname, '..', 'contracts', contractPath);
    const contractDest = path.join(outputDir, 'contracts', path.basename(contractPath));
    
    if (fs.existsSync(contractSrc)) {
      console.log(`  - ${contractPath}`);
      fs.copyFileSync(contractSrc, contractDest);
    }
  });
  
  // Copy all tests from category
  console.log(`🧪 Copying ${config.tests.length} tests...`);
  config.tests.forEach(testPath => {
    const testSrc = path.join(__dirname, '..', 'test', testPath);
    const testDest = path.join(outputDir, 'test', path.basename(testPath));
    
    if (fs.existsSync(testSrc)) {
      console.log(`  - ${testPath}`);
      fs.copyFileSync(testSrc, testDest);
    }
  });
  
  // Copy utils
  const utilsSrc = path.join(__dirname, '..', 'test', 'utils');
  const utilsDest = path.join(outputDir, 'test', 'utils');
  if (fs.existsSync(utilsSrc)) {
    execSync(`cp -r ${utilsSrc} ${utilsDest}`, { stdio: 'inherit' });
  }
  
  // Generate README
  const readme = generateCategoryReadme(categoryName, config);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  
  // Update package.json
  updateCategoryPackageJson(outputDir, categoryName, config);
  
  console.log(`✅ Category '${categoryName}' project created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${outputDir}`);
  console.log(`  npm install --legacy-peer-deps`);
  console.log(`  npm run compile`);
  console.log(`  npm run test`);
}

function generateCategoryReadme(categoryName, config) {
  return `# ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Examples - FHEVM

${config.description}

## Overview

This project contains multiple FHEVM examples demonstrating ${config.description.toLowerCase()}.

## Examples Included

${config.examples.map(example => `- **${example}** - ${getExampleDescription(example)}`).join('\n')}

## Quick Start

\`\`\`bash
# Install dependencies
npm install --legacy-peer-deps

# Compile all contracts
npm run compile

# Run all tests
npm run test

# Deploy all contracts (local)
npm run deploy:local
\`\`\`

## Project Structure

\`\`\`
${categoryName}-examples/
├── contracts/
${config.contracts.map(c => `│   ├── ${path.basename(c)}`).join('\n')}
├── test/
${config.tests.map(t => `│   ├── ${path.basename(t)}`).join('\n')}
│   └── utils/
│       └── fhevm.ts
├── deploy/
└── README.md
\`\`\`

## Key Concepts

This category demonstrates:
- Encrypted data handling with FHEVM
- Permission management with FHE.allow() and FHE.allowThis()
- ${categoryName === 'auctions' ? 'Confidential bidding and auction mechanisms' : 'Basic FHE operations and patterns'}
- Public decryption patterns
- Common pitfalls and best practices

## Testing

Each example includes comprehensive tests showing:
- ✅ Correct usage patterns
- ❌ Common mistakes and edge cases
- 🔧 Permission handling
- 📊 Gas usage patterns

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)
- [GitHub Repository](https://github.com/zama-ai/fhevm)

## License

BSD-3-Clause-Clear
`;
}

function getExampleDescription(exampleName) {
  const descriptions = {
    'blind-auction': 'Sealed-bid auction with encrypted bids',
    'fhe-counter': 'Simple encrypted counter demonstrating FHE basics',
    'encrypt-single-value': 'Basic FHE encryption patterns'
  };
  
  return descriptions[exampleName] || 'FHEVM example';
}

function updateCategoryPackageJson(outputDir, categoryName, config) {
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.name = `fhevm-${categoryName}-examples`;
  packageJson.description = config.description;
  packageJson.keywords = ['fhevm', 'zama', 'fhe', 'privacy', 'blockchain', categoryName, 'examples'];
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node create-fhevm-category.js <category-name> <output-dir>');
    console.log('Available categories:', Object.keys(CATEGORIES).join(', '));
    process.exit(1);
  }
  
  const [categoryName, outputDir] = args;
  createCategory(categoryName, outputDir);
}

module.exports = { createCategory, CATEGORIES };