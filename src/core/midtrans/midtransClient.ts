import { MidtransClient } from 'midtrans-node-client';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = true
const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';

const snap = new MidtransClient.Snap({
  isProduction,
  serverKey,
  clientKey,
});
export default snap;
