import express from "express";
import bodyParser from "body-parser";
import midtransRoutes from "./routes/midtransRoutes";
import { telegram } from "./core/telegram/telegramConnect";
import { getPriceSol } from "./core/api/solanaPrice";
import { checkSolBalance,sendSol } from "./core/coin/solana";
import { connectDB } from "./connection/conenction";

const app = express();
app.use(bodyParser.json());

app.use("/api", midtransRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server jalan di ${PORT}`);
  await telegram({});
  await connectDB()
  // checkSolBalance()
  // sendSol({amountSol:0.001,recipient:"G8bCvt3JkrPQuQVcznadRoaHWdVPQ18PzkmZdgXiME6x"})
});
