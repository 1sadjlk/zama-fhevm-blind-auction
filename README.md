# FHEVM Example Hub

A comprehensive system for creating standalone FHEVM (Fully Homomorphic Encryption Virtual Machine) example repositories with automated documentation generation.

## 🎯 Project Overview

This project provides tools and examples for building privacy-preserving smart contracts using FHEVM by Zama. It includes:

- **🏗️ Base Template**: Complete Hardhat setup for FHEVM development
- **📝 Example Contracts**: Categorized collection of FHEVM examples
- **🤖 Automation Tools**: Scripts to generate standalone repositories and documentation
- **📚 Documentation**: GitBook-formatted guides for each example

## 🚀 Quick Start

### Generate a Standalone Example

```bash
# Using npm scripts (recommended)
npm run create-example blind-auction ./output/my-blind-auction

# Or directly
node scripts/create-fhevm-example.js blind-auction ./output/my-blind-auction

# Navigate and run
cd ./output/my-blind-auction
npm install --legacy-peer-deps
npm run compile
npm run test
```

### Generate Documentation

```bash
# Single example
npm run generate-docs blind-auction

# All examples
npm run generate-docs --all
```

## 📁 Project Structure

```
fhevm-example-hub/
├── contracts/                   # All example contracts (source)
│   ├── auctions/               # Auction examples
│   │   └── BlindAuction.sol    # Sealed-bid auction
│   └── basic/                  # Basic FHE operations
│
├── test/                       # All test files (mirrors contracts/)
│   ├── auctions/
│   │   └── BlindAuction.ts     # Comprehensive test suite
│   └── utils/
│       └── fhevm.ts            # Test utilities
│
├── scripts/                    # Automation tools
│   ├── create-fhevm-example.js # Repository generator
│   └── generate-docs.js        # Documentation generator
│
├── docs/                       # Generated GitBook documentation
│   ├── SUMMARY.md              # Documentation index
│   └── *.md                    # Individual example docs
│
├── fhevm-hardhat-template/     # Base Hardhat template
└── test-output/                # Generated example repositories
```

## 🔧 Available Examples

### Advanced Examples
- **blind-auction** - Sealed-bid auction with confidential bids

### Basic Examples (Coming Soon)
- **fhe-counter** - Simple encrypted counter
- **encrypt-single-value** - FHE encryption basics
- **user-decrypt** - User decryption patterns

## 🎨 Core Concepts

### FHEVM Encryption Model

FHEVM uses encryption binding where values are bound to `[contract, user]` pairs:

1. **Encryption Binding**: Values encrypted locally, bound to specific contract/user
2. **Input Proofs**: Zero-knowledge proofs attest correct binding  
3. **Permission System**: Both contract and user need FHE permissions

### Critical Patterns

**✅ DO: Grant Both Permissions**
```solidity
FHE.allowThis(encryptedValue);        // Contract permission
FHE.allow(encryptedValue, msg.sender); // User permission
```

**❌ DON'T: Forget allowThis**
```solidity
FHE.allow(encryptedValue, msg.sender); // Missing allowThis - will fail!
```

**✅ DO: Use New API (v0.10.0+)**
```solidity
euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
euint32 publicAmount = FHE.makePubliclyDecryptable(amount);
```

## 🛠️ Development Workflow

### Creating a New Example

1. **Write Contract** in `contracts/<category>/YourExample.sol`
2. **Write Tests** in `test/<category>/YourExample.ts`
3. **Update Configurations** in both automation scripts
4. **Generate Documentation** with `npm run generate-docs your-example`
5. **Test Standalone Repository**

### Testing Your Example

```bash
# Test in main project
npm run compile
npm run test

# Test standalone generation
node scripts/create-fhevm-example.js your-example ./test-output
cd test-output && npm install --legacy-peer-deps && npm test
```

## 🔑 Key Dependencies

- `@fhevm/solidity` (v0.10.0) - Core FHEVM Solidity library
- `@fhevm/hardhat-plugin` (v0.3.0-4) - FHEVM testing integration
- `@zama-fhe/relayer-sdk` (v0.3.0-8) - Decryption relayer SDK
- `hardhat-deploy` - Deployment management

## 📖 Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Protocol Examples**: https://docs.zama.org/protocol/examples
- **Base Template**: https://github.com/zama-ai/fhevm-hardhat-template
- **Zama Guild**: https://guild.xyz/zama/developer-program

## 🏆 Bounty Information

This project is submitted for the **Zama FHEVM Example Hub Bounty**:
- **Prize Pool**: $10,000 USD
- **1st Place**: $5,000
- **2nd Place**: $3,000  
- **3rd Place**: $2,000
- **Deadline**: December 31, 2025

## 🤝 Contributing

Contributions are welcome! When adding examples:

1. Follow existing patterns and structure
2. Include comprehensive comments in code
3. Demonstrate both correct and incorrect usage
4. Update both automation scripts
5. Test generated standalone repository
6. Verify documentation renders correctly

## 📄 License

BSD-3-Clause-Clear License

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**