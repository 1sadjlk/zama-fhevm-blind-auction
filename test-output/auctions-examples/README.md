# Auctions Examples - FHEVM

Confidential auction mechanisms using FHEVM

## Overview

This project contains multiple FHEVM examples demonstrating confidential auction mechanisms using fhevm.

## Examples Included

- **blind-auction** - Sealed-bid auction with encrypted bids

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Compile all contracts
npm run compile

# Run all tests
npm run test

# Deploy all contracts (local)
npm run deploy:local
```

## Project Structure

```
auctions-examples/
├── contracts/
│   ├── BlindAuction.sol
├── test/
│   ├── BlindAuction.ts
│   └── utils/
│       └── fhevm.ts
├── deploy/
└── README.md
```

## Key Concepts

This category demonstrates:
- Encrypted data handling with FHEVM
- Permission management with FHE.allow() and FHE.allowThis()
- Confidential bidding and auction mechanisms
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
