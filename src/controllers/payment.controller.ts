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

const computeSplitedPayment = async (req: Request, res: Response) => {
  try {
    const transaction: Transaction = req.body;

    // Validate the transaction object

    // Implement the split calculation logic here
    const splitResult: SplitResult = calculateSplit(transaction);

    // Send the response

    res.status(200).json(splitResult);
  } catch (error: any) {
    console.error(error);
    errorResponse(res, 500, { error: true, message: error.message });
  }
};

// Function to calculate split
function calculateSplit(transaction: Transaction): SplitResult {
  let balance = transaction.Amount;
  const splitBreakdown: { SplitEntityId: string; Amount: number }[] = [];

  // Sort SplitInfo based on precedence rules
  const sortedSplitInfo = transaction.SplitInfo.sort((a, b) => {
    if (a.SplitType === "FLAT" && b.SplitType === "FLAT") {
      return (
        transaction.SplitInfo.indexOf(a) - transaction.SplitInfo.indexOf(b)
      );
    }
    if (a.SplitType === "FLAT") return -1;
    if (b.SplitType === "FLAT") return 1;
    if (a.SplitType === "PERCENTAGE" && b.SplitType === "PERCENTAGE") {
      return (
        transaction.SplitInfo.indexOf(a) - transaction.SplitInfo.indexOf(b)
      );
    }
    if (a.SplitType === "PERCENTAGE") return -1;
    if (b.SplitType === "PERCENTAGE") return 1;
    return 0;
  });

  // Calculate split amounts
  let openingRatioBalance = balance;
  for (const splitEntity of sortedSplitInfo) {
    let splitAmount = 0;

    switch (splitEntity.SplitType) {
      case "FLAT":
        splitAmount = splitEntity.SplitValue;
        checkComputedAmount(balance, splitAmount);
        balance -= splitAmount;
        openingRatioBalance = balance;
        break;
      case "PERCENTAGE":
        splitAmount = (splitEntity.SplitValue / 100) * balance;
        checkComputedAmount(balance, splitAmount);
        balance -= splitAmount;
        openingRatioBalance = balance;
        break;
      case "RATIO":
        const totalRatio = sortedSplitInfo
          .filter((s) => s.SplitType === "RATIO")
          .reduce((acc, s) => acc + s.SplitValue, 0);
        splitAmount =
          (splitEntity.SplitValue / totalRatio) * openingRatioBalance;
        console.log("openingRatioBalance", openingRatioBalance);
        console.log(balance, splitAmount);
        balance = Number(balance.toFixed(2)) - Number(splitAmount.toFixed(2));
        break;
    }

    // Add to split breakdown
    splitBreakdown.push({
      SplitEntityId: splitEntity.SplitEntityId,
      Amount: splitAmount,
    });
  }

  return {
    ID: transaction.ID,
    Balance: balance,
    SplitBreakdown: splitBreakdown,
  };
}

export { computeSplitedPayment };
