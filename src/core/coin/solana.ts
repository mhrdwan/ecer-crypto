import {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
import { sendTelegramMessage } from "../telegram/telegramFunction";
import Order from "../../models/Order";
dotenv.config();
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const privateKeyBase58 = process.env.PRIVKEY_SOLANA as string;
const privateKey = bs58.decode(privateKeyBase58);
const keypair = Keypair.fromSecretKey(privateKey);
const publicKey = keypair.publicKey;

export async function checkSolBalance() {
  try {
    const balanceLamports = await connection.getBalance(publicKey);
    const balanceSol = balanceLamports / 1e9;
    console.log(`Saldo SOL: ${balanceSol} SOL`);
    return balanceSol;
  } catch (error: any) {
    console.error("Error checking balance:", error);
    throw error;
  }
}

export async function sendSol({
  amountSol,
  recipient,
  chatId,
}: {
  amountSol: number;
  recipient: string;
  chatId: number;
}) {
  const recipientAddress = new PublicKey(recipient);

  const amountLamports = amountSol * 1e9;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: recipientAddress,
      lamports: amountLamports,
    })
  );

  try {
    const signature = await connection.sendTransaction(transaction, [keypair]);

    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    console.log("Transaction Confirmed:", confirmation);

    if (confirmation.value.err) {
      console.error("Transaction failed with error:", confirmation.value.err);
      throw new Error(
        `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
      );
    }

    return { signature, confirmation };
  } catch (error: any) {
    console.error("Error during transaction:", error);

    await sendTelegramMessage({
      chatId: chatId,
      message: `🚨 Transaksi gagal: ${error.message}`,
    });
    await sendTelegramMessage({
      chatId: chatId,
      message:
        `🚨 📞 <b>Hubungi Admin Untuk Meminta Refund Manual</b>\n\n` +
        `Harap sertakan informasi berikut dalam format berikut:\n\n` +
        `<b>Format Refund:</b>\n` +
        `Order ID: \n` +
        `Total Token:\n` +
        `Jenis Token:\n` +
        `Total Pembayaran: \n\n` +
        `Untuk informasi lebih lanjut, silakan hubungi admin:\n` +
        `- 📱 <b>Telegram:</b> @ridwantech\n\n` +
        `Kami siap membantu Anda!`,
      parseMode: "HTML",
    });

    throw error;
  }
}
