import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface MerkleRootData {
    merkleRoot: string;
  }

async function main() {
    console.log("Testing Airdrop Claim...\n");

    // ✅ Đọc từ deployments/ thay vì data/
    const network = "localhost"; // hoặc "sepolia", "mainnet"...
    const deploymentsPath = path.join(__dirname, `../../deployments/${network}`);

    // Đọc Token address
    const tokenDeployment = JSON.parse(
        fs.readFileSync(path.join(deploymentsPath, "MintTokendApp.json"), "utf8")
    );
    const TOKEN_ADDRESS = tokenDeployment.address;

    // Đọc Airdrop address
    const airdropDeployment = JSON.parse(
        fs.readFileSync(path.join(deploymentsPath, "AirdropClaim.json"), "utf8")
    );
    const AIRDROP_ADDRESS = airdropDeployment.address;

    console.log("Contract Addresses:");
    console.log("├─ Token:", TOKEN_ADDRESS);
    console.log("└─ Airdrop:", AIRDROP_ADDRESS, "\n");

    const merkleFilePath = path.join(__dirname, "../merklettree/Merkle/merkleRoot.json");
        if (!fs.existsSync(merkleFilePath)) {
          throw new Error(`Merkle root file not found at: ${merkleFilePath}`);
        }
        const merkleData: MerkleRootData = JSON.parse(fs.readFileSync(merkleFilePath, "utf8"));
        const merkleRoot = merkleData.merkleRoot;

    const [owner, user1, user2,user3,user4,user5,user6,user7] = await ethers.getSigners();

    console.log("Test Accounts:");
    console.log("├─ Owner:", owner.address);
    console.log("├─ User1:", user1.address);
    console.log("├─ User2:", user2.address);
    console.log("├─ User3:", user3.address);
    console.log("├─ User4:", user4.address);
    console.log("├─ User5:", user5.address);
    console.log("├─ User6:", user6.address);
    console.log("└─ User7:", user7.address, "\n");

    // Get contracts
    const airdrop = await ethers.getContractAt("AirdropClaim", AIRDROP_ADDRESS);
    const token = await ethers.getContractAt("MintTokendApp", TOKEN_ADDRESS);
    //========test set root====
    const newRoot = merkleRoot;
    const txSetRoot = await airdrop.connect(owner).setMerkleRoot(newRoot);
    await txSetRoot.wait();
    console.log("Set new Merkle Root to:", newRoot);
    await airdrop.connect(owner).merkleRoot().then((root: string) => {
        console.log("Updated Merkle Root in contract:", root);
    });



}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\nTest failed:");
        console.error(error);
        process.exit(1);
    });