import {ethers} from "ethers"
async function main() 
{
    const provider = new ethers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");
    const abi=[
                "function getCount() public view returns (uint)",
                "function increment() public"
            ]
    const contractAddress="0x1234567890abcdef1234567890abcdef12345678";
    const Contract = new ethers.Contract(contractAddress,abi,provider);
    const tx = await Contract.getCount();
    
     
    
}
main().catch(console.error);