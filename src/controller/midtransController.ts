import { sendSol } from "../core/coin/solana";
import { createTransaction } from "../core/midtrans/createTransaction";
import { sendTelegramMessage } from "../core/telegram/telegramFunction";
import Order from "../models/Order";
const PPN = 0.007
export const midtransCreate = async ({
  total,
  cusName,
  email,
  coin,
  userId,
  name,
  addressWallet,
  chatId,
  token,
  jumlahToken,
}: {
  total: number;
  chatId: any;
  cusName: string;
  email: string;
  coin: string;
  userId: number;
  name: string;
  addressWallet: string;
  token: string;
  jumlahToken: number;
}) => {
  const invoice = `INV-RID-${Date.now()}`;
  const newOrder = new Order({
    name: name,
    chatId,
    token,
    telegramId: userId,
    totalAmount: total,
    status: "pending",
    invoice: invoice,
    addressWallet: addressWallet,
    jumlahToken,
  });
  await newOrder.save();
  console.log(`ini total`, total);
  const grossAmount = Math.max(Math.ceil(total * PPN), 10);
  const transactionDetails = {
    order_id: invoice,
    gross_amount: grossAmount,
  };
  const itemDetails = [
    {
      id: coin,
      price: grossAmount,
      quantity: 1,
      name: coin,
    },
  ];

  const customerDetails = {
    first_name: cusName,
    email: email,
  };

  try {
    const transaction = await createTransaction(
      transactionDetails,
      itemDetails,
      customerDetails
    );

    console.log("Transaction created successfully:", transaction);

    const paymentUrl = transaction || "URL tidak tersedia";
    await sendTelegramMessage({
      chatId,
      message: `
📢 Transaksi Berhasil Dibuat 📢

🛒 Order ID: ${transactionDetails.order_id}
😎 Pembeli : ${cusName},
💵 Jumlah: Rp ${total.toLocaleString("id-ID")}
💳 Pembayaran untuk: ${coin.toUpperCase()}

✅ Silakan lakukan pembayaran melalui link berikut:
🌐 ${paymentUrl}

📌 Harap segera menyelesaikan pembayaran sebelum masa berlaku berakhir.
`,
    });

    return transaction;
  } catch (error: any) {
    console.error(
      "Failed to create QRIS transaction:",
      error.response || error
    );
    throw new Error("Failed to create transaction");
  }
};

export const handleMidtransNotification = async (req: any, res: any) => {
  try {
    const {
      transaction_type,
      transaction_time,
      transaction_status,
      transaction_id,
      status_message,
      status_code,
      signature_key,
      settlement_time,
      payment_type,
      order_id,
      merchant_id,
      issuer,
      gross_amount,
      fraud_status,
      expiry_time,
      currency,
      acquirer,
    } = req.body;

    if (!transaction_status || !order_id || !status_code) {
      return res.status(400).json({
        message: "Invalid or missing parameters",
      });
    }

    // console.log("Midtrans Notification Received:", {
    //   transaction_type,
    //   transaction_time,
    //   transaction_status,
    //   transaction_id,
    //   status_message,
    //   status_code,
    //   signature_key,
    //   settlement_time,
    //   payment_type,
    //   order_id,
    //   merchant_id,
    //   issuer,
    //   gross_amount,
    //   fraud_status,
    //   expiry_time,
    //   currency,
    //   acquirer,
    // });

    switch (transaction_status) {
      case "settlement":
        console.log(`Transaction ${order_id} has been settled.`);
        break;

      case "pending":
        console.log(`Transaction ${order_id} is pending.`);
        break;

      case "deny":
      case "cancel":
      case "expire":
        console.log(
          `Transaction ${order_id} failed with status ${transaction_status}.`
        );
        break;

      default:
        console.log(`Unhandled transaction status: ${transaction_status}`);
        break;
    }

    const findID = await Order.findOne({ invoice: order_id });
    console.log(`ini findID`, findID);

    if (findID) {
      console.log(`ini jumlah sol`, findID.totalAmount);
      if (transaction_status === "settlement") {
        try {
          const sendBalance = await sendSol({
            recipient: findID.addressWallet,
            amountSol: findID.jumlahToken,
            chatId: findID.chatId,
          });

          findID.status = "sukses";
          await findID.save();

          await sendTelegramMessage({
            chatId: findID.chatId,
            message: `
📢 Transaksi Berhasil! 📢

🛒 Order ID: ${order_id}
📌 Status: ${transaction_status.toUpperCase()} ✅
💳 Pembayaran: ${payment_type}
💵 Jumlah Rupiah: Rp ${Number(gross_amount).toLocaleString("id-ID")}
💵 Jumlah Token: ${findID.jumlahToken} ${findID.token}
⏰ Waktu Transaksi: ${new Date(transaction_time).toLocaleString()}

Lihat detail transaksi Anda: \nhttps://solscan.io/tx/${
              sendBalance.signature
            }?cluster=devnet
        `,
          });
        } catch (error) {
          console.error("Error sending SOL or Telegram message:", error);
        }
      } else {
        console.log(
          `Transaction ${order_id} status is ${transaction_status}, no action taken.`
        );
      }
    }

    res.status(200).json({
      message: "Notification handled successfully",
      data: {
        transaction_type,
        transaction_time,
        transaction_status,
        transaction_id,
        status_message,
        status_code,
        signature_key,
        settlement_time,
        payment_type,
        order_id,
        merchant_id,
        issuer,
        gross_amount,
        fraud_status,
        expiry_time,
        currency,
        acquirer,
      },
    });
  } catch (error: any) {
    console.error("Error handling Midtrans notification:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
