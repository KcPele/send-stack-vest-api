import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorResponse } from "../utils/responseHandler";

function checkComputedAmount(amount: number, computedAmount: number) {
  if (computedAmount > amount) {
    throw new Error("Calculated amount is greater than the amount provided");
  }
}

const splitValidationRules = () => {
  return [
    body("ID").isNumeric().withMessage("ID must be a number"),
    body("Amount")
      .isFloat({ min: 0 })
      .withMessage("Amount must be a number and not less than 0"),
    body("SplitInfo").isArray().withMessage("SplitInfo must be an array"),
    //check if split info is greater than 20 and less than 1
    body("SplitInfo")
      .custom((value) => {
        if (value.length > 20 || value.length < 1) {
          throw new Error(
            "SplitInfo must be an array of length greater than 0 and less than 20"
          );
        }
        return true;
      })
      .withMessage(
        "SplitInfo must be an array of length greater than 0 and less than 20"
      ),
    body("SplitInfo.*.SplitEntityId")
      .isString()
      .withMessage("SplitEntityId must be a string"),
    body("SplitInfo.*.SplitType")
      .isIn(["FLAT", "PERCENTAGE", "RATIO"])
      .withMessage(
        "SplitType must be one of the following: FLAT, PERCENTAGE, RATIO"
      ),

    //check if split value is greater than 0
    body("SplitInfo.*.SplitValue")
      .isFloat({ min: 0 })
      .withMessage("SplitValue must be a number and not less than 0"),

    body("CustomerEmail")
      .isEmail()
      .withMessage("CustomerEmail must be a valid email"),
    body("Currency").isString().withMessage("Currency must be a string"),
  ];
};

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

export { validateRequest, checkComputedAmount, splitValidationRules };
