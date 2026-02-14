import { createFhevmInstance as createInstance } from "@fhevm/hardhat-plugin";

export async function createFhevmInstance() {
  return await createInstance();
}