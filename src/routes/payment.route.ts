import express from "express";
import {
  computeSplitedPayment,
  splitValidationRules,
} from "../controllers/payment.controller";
import { validateRequest } from "../middlewares/requestValidator";
const router = express.Router();

router.post(
  "/split-payment/compute",
  splitValidationRules(),
  validateRequest,
  computeSplitedPayment
);

export default router;
