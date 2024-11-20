import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const privateKey = "2e9a4943b68575f4b5c2cceffd68f475cdb15de8ce9b9d2e2f4a3b3eacba0370"; 
const providerBnb = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
// const providerBnb = new ethers.JsonRpcProvider(process.env.RPC_URL_BNB);

// const privateKey = process.env.PRIVKEY_NVM as string;
const wallet = new ethers.Wallet(privateKey);

export async function checkBnbBalance() {
  try {
    const balance = await providerBnb.getBalance(wallet.address);
    const balanceEther = ethers.formatEther(balance);
    console.log(`Saldo BNB: ${balanceEther} BNB`);
    return balanceEther;
  } catch (error: any) {
    console.error("Error checking BNB balance:", error);
    throw error;
  }
}
