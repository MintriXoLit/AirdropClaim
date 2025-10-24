import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface MerkleProofs {
    [address: string]: {
        amount: string;
        proof: string[];
    };
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

    // Đọc merkle proofs
    const proofsPath = path.join(__dirname, "../merklettree/Merkle/merkleProofs.json");
    const proofs: MerkleProofs = JSON.parse(fs.readFileSync(proofsPath, "utf8"));

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

    // ============================================
    // TEST 1: User1 Claim
    // ============================================
    console.log("TEST 1: User1 Claims Tokens");

    const user1Address = user1.address;
    const user1Data = proofs[user1Address];

    if (!user1Data) {
        console.log("User1 not in whitelist!\n");
        return;
    }

    console.log("├─ Address:", user1Address);
    console.log("├─ Amount:", ethers.formatEther(user1Data.amount), "tokens");
    console.log("├─ Proof length:", user1Data.proof.length);

    const balanceBefore = await token.balanceOf(user1Address);
    console.log("├─ Balance before:", ethers.formatEther(balanceBefore));

    const hasClaimed = await airdrop.hasClaimed(user1Address);
    console.log("├─ Has claimed before:", hasClaimed);

    if (hasClaimed) {
        console.log("└─Already claimed!\n");
        // Không return, tiếp tục test các trường hợp khác
    } else {
        console.log("├─ Claiming...");
        try {
            const tx = await airdrop.connect(user1).claim(user1Data.amount, user1Data.proof);
            console.log("├─ Transaction hash:", tx.hash);
            await tx.wait();
            console.log("├─Transaction confirmed!");

            const balanceAfter = await token.balanceOf(user1Address);
            console.log("├─ Balance after:", ethers.formatEther(balanceAfter));
            console.log("└─ Received:", ethers.formatEther(balanceAfter - balanceBefore), "tokens\n");
        } catch (error: any) {
            console.log("└─Claim failed:", error.message, "\n");
        }
    }

    // ============================================
    // TEST 2: Double Claim (Should Fail)
    // ============================================
    console.log("TEST 2: Double Claim (Should Fail)");
    try {
        await airdrop.connect(user1).claim(user1Data.amount, user1Data.proof);
        console.log("└─BUG: Double claim succeeded!\n");
    } catch (error: any) {
        const message = error.message || error.toString();
        if (message.includes("AlreadyClaimed") || message.includes("Already claimed")) {
            console.log("└─Correctly blocked: Already claimed\n");
        } else {
            console.log("└─Blocked but wrong reason:", message, "\n");
        }
    }

    // ============================================
    // TEST 3: Claim with Wrong Amount (Should Fail)
    // ============================================
    console.log("TEST 3: Claim with Wrong Amount (Should Fail)");
    const user2Address = user2.address;
    const user2Data = proofs[user2Address];

    if (user2Data) {
        try {
            const wrongAmount = ethers.parseEther("99999"); // Số sai
            await airdrop.connect(user2).claim(wrongAmount, user2Data.proof);
            console.log("└─BUG: Wrong amount succeeded!\n");
        } catch (error: any) {
            const message = error.message || error.toString();
            if (message.includes("InvalidProof") || message.includes("Invalid proof")) {
                console.log("└─ Correctly blocked: Invalid proof\n");
            } else {
                console.log("└─Blocked but wrong reason:", message, "\n");
            }
        }
    } else {
        console.log("└─User2 not in whitelist, skipping test\n");
    }

    // ============================================
    // TEST 4: User2 Valid Claim
    // ============================================
    if (user2Data) {
        console.log("TEST 4: User2 Valid Claim");
        const hasClaimedUser2 = await airdrop.hasClaimed(user2Address);

        if (!hasClaimedUser2) {
            try {
                console.log("├─ Claiming...");
                const tx = await airdrop.connect(user2).claim(user2Data.amount, user2Data.proof);
                await tx.wait();
                console.log("├─Claim successful!");

                const balanceUser2 = await token.balanceOf(user2Address);
                console.log("└─ Balance:", ethers.formatEther(balanceUser2), "tokens\n");
            } catch (error: any) {
                console.log("└─Claim failed:", error.message, "\n");
            }
        } else {
            console.log("└─Already claimed\n");
        }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log("Final Summary:");
    const totalSupply = await token.totalSupply();
    console.log("├─ Total supply:", ethers.formatEther(totalSupply), "tokens");
    console.log("├─ User1 balance:", ethers.formatEther(await token.balanceOf(user1Address)), "tokens");
    console.log("└─ User2 balance:", ethers.formatEther(await token.balanceOf(user2Address)), "tokens");

    console.log("\nTest completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\nTest failed:");
        console.error(error);
        process.exit(1);
    });