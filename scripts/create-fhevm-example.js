#!/usr/bin/env node

/**
 * FHEVM Example Generator
 * Creates standalone FHEVM example repositories with automated scaffolding
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Example configurations
const EXAMPLES_MAP = {
  'blind-auction': {
    contract: 'auctions/BlindAuction.sol',
    test: 'auctions/BlindAuction.ts',
    description: 'Sealed-bid auction with encrypted bids',
    category: 'auctions'
  },
  'fhe-counter': {
    contract: 'basic/FHECounter.sol', 
    test: 'basic/FHECounter.ts',
    description: 'Simple encrypted counter demonstrating FHE basics',
    category: 'basic'
  }
};

function createExample(exampleName, outputDir) {
  if (!EXAMPLES_MAP[exampleName]) {
    console.error(`❌ Example '${exampleName}' not found`);
    console.log('Available examples:', Object.keys(EXAMPLES_MAP).join(', '));
    process.exit(1);
  }

  const config = EXAMPLES_MAP[exampleName];
  const templateDir = path.join(__dirname, '..', 'fhevm-hardhat-template');
  
  console.log(`🚀 Creating ${exampleName} example in ${outputDir}`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Copy template
  console.log('📁 Copying base template...');
  execSync(`cp -r ${templateDir}/* ${outputDir}/`, { stdio: 'inherit' });
  
  // Copy specific contract
  const contractSrc = path.join(__dirname, '..', 'contracts', config.contract);
  const contractDest = path.join(outputDir, 'contracts', path.basename(config.contract));
  
  if (fs.existsSync(contractSrc)) {
    console.log(`📄 Copying contract: ${config.contract}`);
    fs.copyFileSync(contractSrc, contractDest);
  }
  
  // Copy specific test
  const testSrc = path.join(__dirname, '..', 'test', config.test);
  const testDest = path.join(outputDir, 'test', path.basename(config.test));
  
  if (fs.existsSync(testSrc)) {
    console.log(`🧪 Copying test: ${config.test}`);
    fs.copyFileSync(testSrc, testDest);
  }
  
  // Generate README
  const readme = generateReadme(exampleName, config);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  
  // Update package.json
  updatePackageJson(outputDir, exampleName, config);
  
  console.log(`✅ Example '${exampleName}' created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${outputDir}`);
  console.log(`  npm install`);
  console.log(`  npm run compile`);
  console.log(`  npm run test`);
}

function generateReadme(exampleName, config) {
  return `# ${exampleName.charAt(0).toUpperCase() + exampleName.slice(1)} - FHEVM Example

${config.description}

## Overview

This example demonstrates ${config.description.toLowerCase()} using FHEVM (Fully Homomorphic Encryption Virtual Machine) by Zama.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy (local)
npm run deploy:local
\`\`\`

## Key Concepts

This example showcases:
- Encrypted data handling with FHEVM
- Permission management with FHE.allow() and FHE.allowThis()
- ${config.category === 'auctions' ? 'Confidential bidding mechanisms' : 'Basic FHE operations'}

## Files

- \`contracts/${path.basename(config.contract)}\` - Main contract implementation
- \`test/${path.basename(config.test)}\` - Comprehensive test suite
- \`deploy/\` - Deployment scripts

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)
- [GitHub Repository](https://github.com/zama-ai/fhevm)

## License

BSD-3-Clause-Clear
`;
}

function updatePackageJson(outputDir, exampleName, config) {
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.name = `fhevm-${exampleName}`;
  packageJson.description = config.description;
  packageJson.keywords = ['fhevm', 'zama', 'fhe', 'privacy', 'blockchain', config.category];
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node create-fhevm-example.js <example-name> <output-dir>');
    console.log('Available examples:', Object.keys(EXAMPLES_MAP).join(', '));
    process.exit(1);
  }
  
  const [exampleName, outputDir] = args;
  createExample(exampleName, outputDir);
}

module.exports = { createExample, EXAMPLES_MAP };