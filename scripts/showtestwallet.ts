
import {ethers} from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  signers.forEach((signer, index) => {
    console.log(`Account #${index}: ${signer.address}`);
  });
}

main().catch(console.error);
