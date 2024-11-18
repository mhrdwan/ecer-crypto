import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
    },
    chatId: {
      type: Number,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    addressWallet: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    invoice: {
      type: String,
      required: true,
    },
    jumlahToken: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
