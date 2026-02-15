import { createInstance } from "fhevmjs";

export async function createFhevmInstance() {
  // For local testing, we'll use a mock instance
  // In a real deployment, these would be proper addresses
  return await createInstance({
    chainId: 31337,
    networkUrl: "http://localhost:8545",
    gatewayUrl: "http://localhost:7077",
    kmsContractAddress: "0x0000000000000000000000000000000000000000", // Mock address for testing
  });
}