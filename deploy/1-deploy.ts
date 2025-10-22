import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting deployment...\n");

interface MerkleRootData {
    merkleRoot: string;
}

interface DeploymentInfo {
    network: string;
    chainId: bigint;
    proxy: string;
    tokenName: string;
    tokenSymbol: string;
    airdropAmount: string;
    deployedAt: string;
}

async function main(): Promise<void> {
    console.log(" Starting deployment...\n");
    const merkleFilePath: string = path.join(__dirname, '../Merkle/merkleRoot.json');
    
    if (!fs.existsSync(merkleFilePath)) {
        throw new Error(`Merkle root file not found at: ${merkleFilePath}`);
    }
    
    const merkleData: MerkleRootData = JSON.parse(
        fs.readFileSync(merkleFilePath, 'utf8')
    );
    const merkleRoot: string = merkleData.merkleRoot;
    
    console.log("Root:", merkleRoot);
    const TOKEN_NAME: string = "MyToken";
    const TOKEN_SYMBOL: string = "MTK";
    const AIRDROP_AMOUNT: bigint = ethers.parseEther("100");
  
    console.log("Deployment parameters:");
    console.log("Name:", TOKEN_NAME);
    console.log("Symbol:", TOKEN_SYMBOL);
    console.log("Airdrop amount:", ethers.formatEther(AIRDROP_AMOUNT));
    console.log("Merkle root:", merkleRoot, "\n");
    console.log("Deploying contract...");
    const MyToken = await ethers.getContractFactory("MintToken");
    
    const proxy = await upgrades.deployProxy(
        MyToken,
        [
            TOKEN_NAME,
            TOKEN_SYMBOL,
            merkleRoot
        ],
        { initializer: 'initialize' }
    );
    await proxy.waitForDeployment();
    const proxyAddress: string = await proxy.getAddress();
    console.log(" Proxy deployed to:", proxyAddress);
    
    const network = await ethers.provider.getNetwork();
    
    const deploymentInfo: DeploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        proxy: proxyAddress,
        tokenName: TOKEN_NAME,
        tokenSymbol: TOKEN_SYMBOL,
        airdropAmount: ethers.formatEther(AIRDROP_AMOUNT),
        deployedAt: new Date().toISOString()
    };
    
    const deploymentPath: string = path.join(__dirname, '../data/deployment.json');
    const dataDir: string = path.dirname(deploymentPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deploymentInfo, null, 2)
    );
    
}
};
export default func;
func.tags = ["deploy"];
