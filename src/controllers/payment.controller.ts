import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { checkComputedAmount } from "../middlewares/requestValidator";
import { body, ValidationChain } from "express-validator";

const MAX_SPLIT_ENTITIES = 20;

interface SplitPayment {
  ID: number;
  Amount: number;
  SplitInfo: {
    SplitEntityId: string;
    SplitType: "FLAT" | "PERCENTAGE" | "RATIO";
    SplitValue: number;
  }[];
  CustomerEmail: string;
  Currency: string;
}

const commonValidation: ValidationChain[] = [
  body("ID").isNumeric().withMessage("ID must be a number"),
  body("Amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a number and not less than 0"),
  body("SplitInfo").isArray().withMessage("SplitInfo must be an array"),
  body("CustomerEmail")
    .isEmail()
    .withMessage("CustomerEmail must be a valid email"),
  body("Currency").isString().withMessage("Currency must be a string"),
];

export const splitValidationRules = (): ValidationChain[] => [
  ...commonValidation,
  body("SplitInfo.*.SplitEntityId")
    .isString()
    .withMessage("SplitEntityId must be a string"),
  body("SplitInfo.*.SplitType")
    .isIn(["FLAT", "PERCENTAGE", "RATIO"])
    .withMessage(
      "SplitType must be one of the following: FLAT, PERCENTAGE, RATIO"
    ),
  body("SplitInfo.*.SplitValue")
    .isNumeric()
    .withMessage("SplitValue must be a number"),
];

const computeSplit = (
  split: SplitPayment["SplitInfo"][0],
  computeFunction: (value: number) => number
) => ({
  SplitEntityId: split.SplitEntityId,
  Amount: computeFunction(split.SplitValue),
});

const computeFlat = (splitValue: number, totalAmount: number) => {
  checkComputedAmount(totalAmount, splitValue);
  return splitValue;
};

const computePercentage = (splitValue: number, totalAmount: number) => {
  const amount = (totalAmount * splitValue) / 100;
  checkComputedAmount(totalAmount, amount);
  return amount;
};

const computeRatio = (
  splitValue: number,
  totalRatio: number,
  remainingRatioAmount: number
) => {
  const amount = (splitValue / totalRatio) * remainingRatioAmount;
  checkComputedAmount(remainingRatioAmount, amount);
  return amount;
};

const computeSplitedPayment = async (req: Request, res: Response) => {
  try {
    const { ID, Amount, SplitInfo } = req.body as SplitPayment;

    if (!SplitInfo?.length) {
      return errorResponse(res, 500, {
        error: true,
        message: "SplitInfo array must have a minimum of 1 split entity",
      });
    }

    if (SplitInfo.length > MAX_SPLIT_ENTITIES) {
      return errorResponse(res, 500, {
        error: true,
        message: `SplitInfo array must have a maximum of ${MAX_SPLIT_ENTITIES} split entities`,
      });
    }

    let remainingRatioAmount = 0;

    const SplitBreakdownFlat = SplitInfo.filter(
      (split) => split.SplitType === "FLAT"
    ).map((split) =>
      computeSplit(split, (value) => computeFlat(value, Amount))
    );

    const SplitBreakdownPercentage = SplitInfo.filter(
      (split) => split.SplitType === "PERCENTAGE"
    ).map((split) =>
      computeSplit(split, (value) => computePercentage(value, Amount))
    );

    const ratioSplits = SplitInfo.filter(
      (split) => split.SplitType === "RATIO"
    );
    const totalRatio = ratioSplits.reduce(
      (acc, split) => acc + split.SplitValue,
      0
    );

    const SplitBreakdownRatio = ratioSplits.map((split) =>
      computeSplit(split, (value) =>
        computeRatio(value, totalRatio, remainingRatioAmount)
      )
    );

    const SplitBreakdown = [
      ...SplitBreakdownFlat,
      ...SplitBreakdownPercentage,
      ...SplitBreakdownRatio,
    ];

    successResponse(res, 200, {
      ID,
      Balance: Amount,
      SplitBreakdown,
    });
  } catch (err: any) {
    if (err) {
      // handle specific error
    } else {
      errorResponse(res, 500, {
        error: true,
        message: err?.message,
      });
    }
  }
};

export { computeSplitedPayment };
