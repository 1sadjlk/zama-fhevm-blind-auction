# Blind-auction - FHEVM Example

Sealed-bid auction with encrypted bids

## Overview

This example demonstrates sealed-bid auction with encrypted bids using FHEVM (Fully Homomorphic Encryption Virtual Machine) by Zama.

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy (local)
npm run deploy:local
```

## Key Concepts

This example showcases:
- Encrypted data handling with FHEVM
- Permission management with FHE.allow() and FHE.allowThis()
- Confidential bidding mechanisms

## Files

- `contracts/BlindAuction.sol` - Main contract implementation
- `test/BlindAuction.ts` - Comprehensive test suite
- `deploy/` - Deployment scripts

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)
- [GitHub Repository](https://github.com/zama-ai/fhevm)

## License

BSD-3-Clause-Clear
