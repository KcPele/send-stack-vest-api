import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { checkComputedAmount } from "../middlewares/requestValidator";

const computeSplitedPayment = async (req: Request, res: Response) => {
  try {
    const transaction: Transaction = req.body;

    // Implement the split calculation logic here
    const splitResult: SplitResult = calculateSplit(transaction);

    // Send the response
    successResponse(res, 200, splitResult);
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

        balance = 0;
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
