import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const providerPolygon = new ethers.JsonRpcProvider(process.env.RPC_URL_POLYGON);

const privateKey = process.env.PRIVKEY_NVM as string;
const wallet = new ethers.Wallet(privateKey);

export async function checkPolygonBalance() {
  try {
    const balance = await providerPolygon.getBalance(wallet.address);
    const balanceEther = ethers.formatEther(balance);
    console.log(`Saldo MATIC: ${balanceEther} MATIC`);
    return balanceEther;
  } catch (error: any) {
    console.error("Error checking Polygon balance:", error);
    throw error;
  }
}

export async function sendTransaction(
    recipient: string,
    amountEther: string,
  ) {
    const provider = providerPolygon ;
    const walletConnected = wallet.connect(provider);
  
    try {
      const tx = {
        to: recipient,
        value: ethers.parseEther(amountEther),
      };
  
      console.log("Mengirim transaksi...");
      const transaction = await walletConnected.sendTransaction(tx);
      console.log("Hash transaksi:", transaction.hash);
  
      const receipt = await transaction.wait();
      console.log("Transaksi berhasil:", receipt);
      return receipt;
    } catch (error: any) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  }
  
