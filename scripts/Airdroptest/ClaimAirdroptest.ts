// test/testClaim.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface MerkleProofs {
    [address: string]: {
        amount: string;
        proof: string[];
    }
}

async function main() {
    console.log("Testing Airdrop Claim...\n");
    const deploymentPath = path.join(__dirname, '../../data/deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    const AIRDROP_ADDRESS = deployment.airdropAddress;
    const TOKEN_ADDRESS = deployment.tokenProxy;
    
    console.log("Contract Addresses:");
    console.log("Token:", TOKEN_ADDRESS);
    console.log("Airdrop:", AIRDROP_ADDRESS, "\n");
    const proofsPath = path.join(__dirname, '../../scripts/merklettree/Merkle/merkleProofs.json');
    const proofs: MerkleProofs = JSON.parse(fs.readFileSync(proofsPath, 'utf8'));
    const [owner, user1, user2] = await ethers.getSigners();
    
    console.log("Test Accounts:");
    console.log("Owner:", owner.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address, "\n");
    const airdrop = await ethers.getContractAt("AirdropClaim", AIRDROP_ADDRESS);
    const token = await ethers.getContractAt("MintTokendApp", TOKEN_ADDRESS);
    console.log("Testing claim for User1...");
    const user1Address = user1.address;
    const user1Data = proofs[user1Address];
    if (!user1Data) {
        console.log("User1 not in whitelist!\n");
        return;
    }

    console.log("Address:", user1Address);
    console.log("Amount:", user1Data.amount, "tokens");
    console.log("Proof length:", user1Data.proof.length, "\n");
    const balanceBefore = await token.balanceOf(user1Address);
    console.log("Balance before:", balanceBefore);

    // Check đã claim chưa
    const hasClaimed = await airdrop.hasClaimed(user1Address);
    console.log("Has claimed:", hasClaimed);

    if (hasClaimed) {
        console.log("Already claimed!\n");
        return;
    }
    
    // Claim tokens
    console.log("\nClaiming...");
    const tx = await airdrop.connect(user1).claim(
        user1Data.amount,
        user1Data.proof
    );

    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed!\n");

    // Check balance sau claim
    const balanceAfter = await token.balanceOf(user1Address);
    console.log("Balance after:", balanceAfter);
    console.log("Received:", balanceAfter - balanceBefore, "tokens");
    
    // ============================================
    // 6. TEST CLAIM LẦN 2 (SHOULD FAIL)
    // ============================================
    console.log("\nTesting double claim (should fail)...");
    try {
        await airdrop.connect(user1).claim(
            user1Data.amount,
            user1Data.proof
        );
        console.log("Double claim succeeded (BUG!)");
    } catch (error: any) {
        console.log("Double claim blocked:", error.message.includes("Already claimed") ? "Already claimed" : "Failed");
    }
    
    // ============================================
    // 7. TEST CLAIM VỚI SAI AMOUNT (SHOULD FAIL)
    // ============================================
    console.log("\nTesting claim with wrong amount (should fail)...");
    const user2Address = user2.address;
    const user2Data = proofs[user2Address];
    
    if (user2Data) {
        try {
            const wrongAmount = 99999;
            await airdrop.connect(user2).claim(
                wrongAmount,
                user2Data.proof
            );
            console.log("Wrong amount succeeded (BUG!)");
        } catch (error: any) {
            console.log("Wrong amount blocked:", error.message.includes("Invalid proof") ? "Invalid proof" : "Failed");
        }
    }
    
    // ============================================
    // 8. SUMMARY
    // ============================================
    console.log("\nFinal Summary:");
    const totalSupply = await token.totalSupply();
    console.log("Total supply:", totalSupply);
    console.log("User1 balance:", await token.balanceOf(user1Address));
    console.log("User2 balance:", await token.balanceOf(user2Address));

    console.log("\nTest completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\nTest failed:");
        console.error(error);
        process.exit(1);
    });