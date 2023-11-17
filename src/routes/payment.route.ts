import express from "express";
import { computeSplitedPayment } from "../controllers/payment.controller";
import {
  splitValidationRules,
  validateRequest,
} from "../middlewares/requestValidator";
const router = express.Router();

router.post(
  "/split-payment/compute",
  splitValidationRules(),
  validateRequest,
  computeSplitedPayment
);

export default router;
