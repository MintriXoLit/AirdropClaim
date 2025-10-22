import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log("Starting deployment...\n");

    interface MerkleRootData {
        merkleRoot: string;
    }

    interface DeploymentInfo {
        network: string;
        chainId: string;
        tokenProxy: string;
        tokenImplementation: string;
        airdropAddress: string;
        tokenName: string;
        tokenSymbol: string;
        merkleRoot: string;
        deployedAt: string;
    }

    async function main(): Promise<void> {
        const merkleFilePath = path.join(__dirname, '../scripts/merklettree/Merkle/merkleRoot.json');
        if (!fs.existsSync(merkleFilePath)) {
            throw new Error(`Merkle root file not found at: ${merkleFilePath}`);
        }
        const merkleData: MerkleRootData = JSON.parse(
            fs.readFileSync(merkleFilePath, 'utf8')
        );
        const merkleRoot = merkleData.merkleRoot;
        
        const TOKEN_NAME = "MyToken";
        const TOKEN_SYMBOL = "MTK";
        
        console.log("Deployment parameters:");
        console.log("Token Name:", TOKEN_NAME);
        console.log("Token Symbol:", TOKEN_SYMBOL);
        console.log("Merkle Root:", merkleRoot, "\n");
        console.log("Deploying Token (Upgradeable)...");
        const MintTokendApp = await ethers.getContractFactory("MintTokendApp");
        const tokenProxy = await upgrades.deployProxy(
            MintTokendApp,
            [TOKEN_NAME, TOKEN_SYMBOL],
            { initializer: 'initialize' }
        );
        await tokenProxy.waitForDeployment();
        const tokenProxyAddress = await tokenProxy.getAddress();
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(
            tokenProxyAddress
        );
        
        console.log("Token Proxy deployed:", tokenProxyAddress);
        console.log("Implementation at:", implementationAddress, "\n");
        console.log("Deploying Airdrop (Simple)...");
        const AirdropClaim = await ethers.getContractFactory("AirdropClaim");
        const airdrop = await AirdropClaim.deploy(
            tokenProxyAddress, 
            merkleRoot
        );
        await airdrop.waitForDeployment();
        const airdropAddress = await airdrop.getAddress();
        console.log("Airdrop deployed:", airdropAddress, "\n");
        console.log("Adding Airdrop as minter...");
        const addMinterTx = await tokenProxy.setAirdrop(airdropAddress);
        await addMinterTx.wait();
        console.log("Airdrop added to minters whitelist");
        
    
        const network = await ethers.provider.getNetwork();
        const deploymentInfo: DeploymentInfo = {
            network: network.name,
            chainId: network.chainId.toString(),
            tokenProxy: tokenProxyAddress,
            tokenImplementation: implementationAddress,
            airdropAddress: airdropAddress,
            tokenName: TOKEN_NAME,
            tokenSymbol: TOKEN_SYMBOL,
            merkleRoot: merkleRoot,
            deployedAt: new Date().toISOString()
        };
        
        const deploymentPath = path.join(__dirname, '../data/deployment.json');
        const dataDir = path.dirname(deploymentPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("Deployment info saved to:", deploymentPath);
        console.log("\nDeployment completed!");
        console.log("\nContract Addresses:");
        console.log("├─ Token Proxy:", tokenProxyAddress);
        console.log("├─ Token Logic:", implementationAddress);
        console.log("└─ Airdrop:", airdropAddress);
        console.log("\n Security:");
        console.log("├─ Users claim via:", airdropAddress);
        console.log("├─ Only Airdrop can mint via:", tokenProxyAddress);
    }
    
    await main();
};

export default func;
func.tags = ["deploy"];