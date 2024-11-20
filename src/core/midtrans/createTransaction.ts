import {
  CustomerDetails,
  ItemDetails,
  TransactionDetails,
} from "../../types/transaction";
import snap from "./midtransClient";

export async function createTransaction(
  transactionDetails: TransactionDetails,
  itemDetails: ItemDetails[],
  customerDetails: CustomerDetails
) {
  const parameter = {
    transaction_details: transactionDetails,
    item_details: itemDetails,
    customer_details: customerDetails,
    expiry: {
      unit: "minutes", 
      duration: 2,   
    },
  };

  try {
    const transaction = await snap.createTransactionRedirectUrl(parameter);
    return transaction;
  } catch (error: any) {
    console.error(
      "Error membuat transaksi:",
      error.response?.data || error.message
    );
    throw error;
  }
}
