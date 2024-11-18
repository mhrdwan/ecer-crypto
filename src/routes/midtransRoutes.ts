import express from "express";
import { handleMidtransNotification } from "../controller/midtransController";

const router = express.Router();

router.post("/payment/notification", handleMidtransNotification);

export default router;
