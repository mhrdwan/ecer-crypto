import { sendSol } from "../core/coin/solana";
import { createTransaction } from "../core/midtrans/createTransaction";
import { sendTelegramMessage } from "../core/telegram/telegramFunction";
import Order from "../models/Order";

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
  const transactionDetails = {
    order_id: invoice,
    gross_amount: total,
  };
  const itemDetails = [
    {
      id: coin,
      price: total,
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

    console.log("Midtrans Notification Received:", {
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
    });

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

    const findID = await Order.findOne({ order_id });
    console.log(`ini findID`,findID) 
    if (findID) {
      const sendBalance = await sendSol({
        recipient: findID.addressWallet,
        amountSol: 1,
      });
      sendTelegramMessage({ chatId: findID.chatId, message: sendBalance });
      Order.updateOne({ status: "sukses" });
      if (transaction_status == "settlement") {
        await sendTelegramMessage({
          chatId: findID.chatId,
          message: `
    📢 Alert Transaksi Toko Ecer Ridwan 📢
    
    🛒 Order ID: ${order_id}
    📌 Status: ${transaction_status.toUpperCase()}
    💳 Pembayaran: ${payment_type}
    💵 Jumlah: Rp ${Number(gross_amount).toLocaleString("id-ID")}
    ⏰ Waktu Transaksi: ${new Date(transaction_time).toLocaleString()}
    🆔 ID Transaksi: ${transaction_id}
    
    📄 Detail Tambahan:
    🧾 Merchant ID: ${merchant_id}
    🏦 Issuer: ${issuer || "N/A"}
    🔍 Fraud Status: ${fraud_status || "N/A"}
    ✅ Waktu Penyelesaian: ${
      settlement_time ? new Date(settlement_time).toLocaleString() : "N/A"
    }
    🏢 Aquirer: ${acquirer || "N/A"}
    ⏳ Expiry Time: ${
      expiry_time ? new Date(expiry_time).toLocaleString() : "N/A"
    }
    
    📝 Catatan: ${
      transaction_status === "settlement"
        ? "Transaksi berhasil diselesaikan."
        : transaction_status === "pending"
        ? "Transaksi sedang diproses."
        : `Transaksi gagal dengan status ${transaction_status}.`
    }
          `,
        });
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
