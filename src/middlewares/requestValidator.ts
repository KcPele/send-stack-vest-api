import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { errorResponse } from "../utils/responseHandler";

const validateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();
  const extractedErrors = [];
  errors.array().forEach((err: any) => {
    extractedErrors.push(`${err.param} invalid`);
  });

  return errorResponse(res, 400, { error: errors.array()[0] });
};

function checkComputedAmount(amount: number, computedAmount: number) {
  if (computedAmount < 0) {
    throw new Error("Split value is less than 0");
  } else if (amount < 0) {
    throw new Error("Computation did not add up: Amount is less than 0");
  } else if (computedAmount > amount) {
    throw new Error("Calculated amount is greater than the amount provided");
  }
}

export { validateRequest, checkComputedAmount };
