import express from "express";
import { computeSplitedPayment } from "../controllers/payment.controller";
const router = express.Router();

router.post("/split-payment/compute", computeSplitedPayment);

export default router;
