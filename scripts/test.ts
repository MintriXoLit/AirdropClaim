import { ethers } from "hardhat";
import { MintToken } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account: ", deployer.address);

  const target="0x43E0fe67F74166027439eAb12d3C94F0099C04D3";
  const Mint: MintToken = await ethers.getContract("MintTokendApp");
  const tx = await Mint.mint(target,500);
  const symbol = await Mint.symbol();
  await tx.wait();

  const balance = await Mint.balanceOf(target);
  console.log(`balaceof ${target} is:`,balance.toString(),symbol );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
