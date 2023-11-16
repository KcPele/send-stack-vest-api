import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { checkComputedAmount } from "../middlewares/requestValidator";
import { body } from "express-validator";

export const splitValidationRules = () => {
  return [
    body("ID").isNumeric().withMessage("ID must be a number"),
    body("Amount")
      .isFloat({ min: 0 })
      .withMessage("Amount must be a number and not less than 0"),
    body("SplitInfo").isArray().withMessage("SplitInfo must be an array"),
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
    body("CustomerEmail")
      .isEmail()
      .withMessage("CustomerEmail must be a valid email"),
    body("Currency").isString().withMessage("Currency must be a string"),
  ];
};

const computeSplitedPayment = async (req: Request, res: Response) => {
  try {
    //get request body
    const { ID, Amount, SplitInfo } = req.body as SplitPayment;

    let _Amount = Amount;

    //validate request body
    if (!SplitInfo?.length) {
      return errorResponse(res, 500, {
        error: true,
        message: "SplitInfo array must have a minimum of 1 split entity",
      });
    }
    if (SplitInfo.length > 20) {
      return errorResponse(res, 500, {
        error: true,
        message: "SplitInfo array must have a maximum of 20 split entities",
      });
    }
    const SplitBreakdown: { SplitEntityId: string; Amount: number }[] = [];
    //compute flat
    const computeFlat = (splitValue: number) => {
      checkComputedAmount(_Amount, splitValue);
      _Amount -= splitValue;
      return splitValue;
    };

    //compute percentage
    const computePercentage = (splitValue: number) => {
      let _amt = (_Amount * splitValue) / 100;
      checkComputedAmount(_Amount, _amt);
      _Amount -= _amt;
      return _amt;
    };

    //compute ratio
    let remainingRatioAmount = 0;
    const ratioSplits = SplitInfo.filter(
      (split) => split.SplitType === "RATIO"
    );
    const totalRatio = ratioSplits.reduce(
      (acc, split) => acc + split.SplitValue,
      0
    );
    const computeRatio = (splitValue: number) => {
      checkComputedAmount(_Amount, splitValue);
      let _amt = (splitValue / totalRatio) * remainingRatioAmount;
      _Amount -= _amt;
      return _amt;
    };

    const SplitBreakdownFlat = SplitInfo.filter(
      (split) => split.SplitType === "FLAT"
    ).map((split) => ({
      SplitEntityId: split.SplitEntityId,
      Amount: computeFlat(split.SplitValue),
    }));

    const SplitBreakdownPercentage = SplitInfo.filter(
      (split) => split.SplitType === "PERCENTAGE"
    ).map((split) => ({
      SplitEntityId: split.SplitEntityId,
      Amount: computePercentage(split.SplitValue),
    }));

    remainingRatioAmount = _Amount;
    const SplitBreakdownRatio = ratioSplits.map((split) => ({
      SplitEntityId: split.SplitEntityId,
      Amount: computeRatio(split.SplitValue),
    }));

    SplitBreakdown.push(
      ...SplitBreakdownFlat,
      ...SplitBreakdownPercentage,
      ...SplitBreakdownRatio
    );

    successResponse(res, 200, {
      ID,
      Balance: _Amount,
      SplitBreakdown,
    });
  } catch (err: any) {
    errorResponse(res, 500, {
      error: true,
      message: err?.message,
    });
  }
};

export { computeSplitedPayment };
