#!/usr/bin/env node

/**
 * FHEVM Documentation Generator
 * Automatically generates GitBook-compatible documentation from contracts and tests
 */

const fs = require('fs');
const path = require('path');

// Documentation configurations
const DOCS_CONFIG = {
  'blind-auction': {
    title: 'Blind Auction',
    description: 'Sealed-bid auction with encrypted bids using FHEVM',
    category: 'Advanced Examples',
    concepts: ['Encrypted bidding', 'Access control', 'Public decryption', 'Auction mechanics']
  },
  'fhe-counter': {
    title: 'FHE Counter',
    description: 'Simple encrypted counter demonstrating basic FHE operations',
    category: 'Basic Examples', 
    concepts: ['Encrypted state', 'FHE arithmetic', 'Permission management']
  }
};

function generateDocs(exampleName, outputDir = './docs') {
  if (!DOCS_CONFIG[exampleName]) {
    console.error(`❌ Documentation config for '${exampleName}' not found`);
    process.exit(1);
  }

  const config = DOCS_CONFIG[exampleName];
  
  console.log(`📚 Generating documentation for ${exampleName}`);
  
  // Create docs directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate markdown documentation
  const docContent = generateMarkdownDoc(exampleName, config);
  const docPath = path.join(outputDir, `${exampleName}.md`);
  
  fs.writeFileSync(docPath, docContent);
  console.log(`✅ Documentation generated: ${docPath}`);
  
  // Update SUMMARY.md
  updateSummary(outputDir, exampleName, config);
}

function generateMarkdownDoc(exampleName, config) {
  const contractPath = getContractPath(exampleName);
  const testPath = getTestPath(exampleName);
  
  let contractCode = '';
  let testCode = '';
  
  if (fs.existsSync(contractPath)) {
    contractCode = fs.readFileSync(contractPath, 'utf8');
  }
  
  if (fs.existsSync(testPath)) {
    testCode = fs.readFileSync(testPath, 'utf8');
  }
  
  return `# ${config.title}

${config.description}

## Overview

This example demonstrates ${config.description.toLowerCase()}.

## Key Concepts

${config.concepts.map(concept => `- **${concept}**`).join('\n')}

## Contract Implementation

\`\`\`solidity
${contractCode}
\`\`\`

## Test Suite

The test suite demonstrates both correct usage and common pitfalls:

\`\`\`typescript
${testCode}
\`\`\`

## Usage

### Deploy the Contract

\`\`\`bash
npm run deploy:local
\`\`\`

### Run Tests

\`\`\`bash
npm run test
\`\`\`

## Important Patterns

### ✅ Correct Usage

- Always call \`FHE.allowThis()\` for contract permissions
- Use \`FHE.allow()\` for user permissions
- Match encryption signer with transaction sender

### ❌ Common Mistakes

- Forgetting \`allowThis()\` permissions
- Mismatching encryption context
- Using deprecated API functions

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)
- [GitHub Repository](https://github.com/zama-ai/fhevm)
`;
}

function getContractPath(exampleName) {
  const contractMap = {
    'blind-auction': 'contracts/auctions/BlindAuction.sol',
    'fhe-counter': 'contracts/basic/FHECounter.sol'
  };
  
  return path.join(__dirname, '..', contractMap[exampleName] || '');
}

function getTestPath(exampleName) {
  const testMap = {
    'blind-auction': 'test/auctions/BlindAuction.ts',
    'fhe-counter': 'test/basic/FHECounter.ts'
  };
  
  return path.join(__dirname, '..', testMap[exampleName] || '');
}

function updateSummary(outputDir, exampleName, config) {
  const summaryPath = path.join(outputDir, 'SUMMARY.md');
  
  let summaryContent = '';
  if (fs.existsSync(summaryPath)) {
    summaryContent = fs.readFileSync(summaryPath, 'utf8');
  } else {
    summaryContent = `# Summary

## Introduction

* [Overview](README.md)

## Examples

`;
  }
  
  // Add entry if not exists
  const entryLine = `* [${config.title}](${exampleName}.md)`;
  if (!summaryContent.includes(entryLine)) {
    summaryContent += `${entryLine}\n`;
  }
  
  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`📝 Updated SUMMARY.md`);
}

function generateAllDocs() {
  console.log('📚 Generating documentation for all examples...');
  
  Object.keys(DOCS_CONFIG).forEach(exampleName => {
    generateDocs(exampleName);
  });
  
  console.log('✅ All documentation generated successfully!');
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: node generate-docs.js <example-name> [output-dir]');
    console.log('       node generate-docs.js --all');
    console.log('Available examples:', Object.keys(DOCS_CONFIG).join(', '));
    process.exit(0);
  }
  
  if (args[0] === '--all') {
    generateAllDocs();
  } else {
    const [exampleName, outputDir] = args;
    generateDocs(exampleName, outputDir);
  }
}

module.exports = { generateDocs, generateAllDocs, DOCS_CONFIG };