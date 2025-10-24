import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("Starting deployment...\n");

  interface MerkleRootData {
    merkleRoot: string;
  }

  async function main(): Promise<void> {
    const merkleFilePath = path.join(__dirname, "../scripts/merklettree/Merkle/merkleRoot.json");
    if (!fs.existsSync(merkleFilePath)) {
      throw new Error(`Merkle root file not found at: ${merkleFilePath}`);
    }
    const merkleData: MerkleRootData = JSON.parse(fs.readFileSync(merkleFilePath, "utf8"));
    const merkleRoot = merkleData.merkleRoot;

    const TOKEN_NAME = "MyToken";
    const TOKEN_SYMBOL = "MTK";

    console.log("Deployment parameters:");
    console.log("Token Name:", TOKEN_NAME);
    console.log("Token Symbol:", TOKEN_SYMBOL);
    console.log("Merkle Root:", merkleRoot, "\n");
    console.log("Deploying Token (Upgradeable)...");
    const MintTokendApp = await ethers.getContractFactory("MintTokendApp");
    const deployToken = await deploy("MintTokendApp", {
      contract: "MintTokendApp",
      args: [TOKEN_NAME, TOKEN_SYMBOL],
      from: deployer,
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: false,
    });
    const tokenContract = await ethers.getContractAt("MintTokendApp", deployToken.address);
    const Role_Admin = await tokenContract.DEFAULT_ADMIN_ROLE();
    const Role_Minter = await tokenContract.MINTER_ROLE();
    const Role_Burner = await tokenContract.BURNER_ROLE();
    console.log("Token logic contract at:", deployToken.address, "\n");
    console.log("Deploying Airdrop (Simple)...");
    const AirdropClaim = await ethers.getContractFactory("AirdropClaim");
    const deployAirdropProxy = await deploy("AirdropClaim", {
      proxy: {
        proxyContract: "UUPS",
        execute: {
          init: {
            methodName: "initialize",
            args: [
              // tham số constructor của mình là gì truyền vô
              deployToken.address,
              merkleRoot,
            ],
          },
        },
      },
      contract: "AirdropClaim",
      from: deployer,
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: true,
    });
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(deployAirdropProxy.address);
    const airdropAddress = await deployAirdropProxy.address;
    console.log("Airdrop deployed:", airdropAddress, "\n");
    console.log("Adding Airdrop as minter...");
    const addMinterTx = await tokenContract.grantRole(Role_Minter, airdropAddress);
    await addMinterTx.wait();
    const isAdmin = await tokenContract.hasRole(Role_Admin, deployer);
    const airdropHasMinterRole = await tokenContract.hasRole(Role_Minter, airdropAddress);
    console.log("├─ Deployer is admin?", isAdmin);
    console.log("└─ Airdrop has MINTER_ROLE?", airdropHasMinterRole, "\n");

    console.log("\nDeployment completed!");
    console.log("\nContract Addresses:");
    console.log("├─ Token :", deployToken.address);
    console.log("├─ Airdrop Logic:", implementationAddress);
    console.log("└─ proxy Airdrop:", deployAirdropProxy.address);
    console.log("\n Security:");
    console.log("├─ Users claim via:", deployAirdropProxy.address);
    console.log("├─ Only Airdrop can mint via:", deployAirdropProxy.address);
  }

  await main();
};

export default func;
func.tags = ["deploy"];
