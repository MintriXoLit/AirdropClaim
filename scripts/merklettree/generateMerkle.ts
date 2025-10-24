import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Define interfaces
interface WhitelistEntry {
  address: string;
  amount: string;
}

interface MerkleProofs {
  [address: string]: {
    amount: string;
    proof: string[];
  };
}

// Đọc whitelist từ file
const whitelist: WhitelistEntry[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./Merkle/whitelist.json"), "utf8")
);

// Tạo leaf từ address và amount
function generateLeaf(address: string, amount: string): Buffer {
  // Convert amount string to BigInt to ensure proper uint256 handling
  const amountBigInt = ethers.toBigInt(amount);
  return Buffer.from(ethers.solidityPackedKeccak256(["address", "uint256"], [address, amountBigInt]).slice(2), "hex");
}

// Tạo leaves từ whitelist
const leaves: Buffer[] = whitelist.map(({ address, amount }) => {
  console.log(`Processing ${address} with amount ${amount}`);
  return generateLeaf(address, amount);
});

// Tạo Merkle Tree
const merkleTree = new MerkleTree(leaves, keccak256, {
  sortPairs: true,
  hashLeaves: false,
});

// Lấy root
const root: string = merkleTree.getHexRoot();

// Tạo object chứa proofs cho mỗi address
const proofs: MerkleProofs = {};
whitelist.forEach(({ address, amount }) => {
  const leaf = generateLeaf(address, amount);
  const proof = merkleTree.getHexProof(leaf);
  proofs[address] = {
    amount: amount,
    proof: proof,
  };
});

// Lưu proofs vào file JSON
const proofsPath = path.join(__dirname, "./Merkle/merkleProofs.json");
fs.writeFileSync(proofsPath, JSON.stringify(proofs, null, 2));

// Lưu root vào file riêng
const rootPath = path.join(__dirname, "./Merkle/merkleRoot.json");
fs.writeFileSync(rootPath, JSON.stringify({ merkleRoot: root }, null, 2));

console.log("Merkle root:", root);
console.log("Root saved to:", rootPath);
console.log("Proofs saved to:", proofsPath);

// Hàm verify proof (để test)
function verifyProof(address: string, amount: string): boolean {
  const leaf = generateLeaf(address, amount);
  const proof = proofs[address].proof;
  return merkleTree.verify(proof, leaf, root);
}

// Test verify một số address
console.log("\nTesting some proofs:");
const testAddresses = whitelist.slice(0, 3); // Test 3 address đầu tiên
testAddresses.forEach(({ address, amount }) => {
  const isValid = verifyProof(address, amount);
  console.log(`Address ${address} (amount: ${amount}): ${isValid ? "Valid" : "Invalid"}`);
});
