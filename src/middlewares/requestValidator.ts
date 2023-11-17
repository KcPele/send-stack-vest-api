import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { errorResponse } from "../utils/responseHandler";

function checkComputedAmount(amount: number, computedAmount: number) {
  if (computedAmount > amount) {
    throw new Error("Calculated amount is greater than the amount provided");
  }
}

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

export { validateRequest, checkComputedAmount };
