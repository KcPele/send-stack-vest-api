import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { checkComputedAmount } from "../middlewares/requestValidator";

const computeSplitedPayment = async (req: Request, res: Response) => {
  try {
    //get request body
    const { ID, Amount, SplitInfo } = req.body as SplitPayment;

    let _Amount = Amount;

    //validate request body
    if (!SplitInfo?.length) {
      throw new Error(" SplitInfo array must have a minimum of 1 split entity");
    }
    if (SplitInfo.length > 20) {
      throw new Error(
        " SplitInfo array must have a maximum of 20 split entities"
      );
    }
    const SplitBreakdown: { SplitEntityId: string; Amount: number }[] = [];
    //compute flat
    const computeFlat = (splitValue: number) => {
      checkComputedAmount(_Amount, splitValue);
      let _amt = Math.min(_Amount, splitValue);
      _Amount -= _amt;
      return _amt;
    };

    //compute percentage
    const computePercentage = (splitValue: number) => {
      let _amt = (_Amount * splitValue) / 100;

      checkComputedAmount(_Amount, _amt);
      _amt = Math.min(_amt, _Amount);
      _Amount -= _amt;
      return _amt;
    };

    //compute ratio
    let remainingRatioAmount = _Amount;
    const ratioSplits = SplitInfo.filter(
      (split) => split.SplitType === "RATIO"
    );
    const totalRatio = ratioSplits.reduce(
      (acc, split) => acc + split.SplitValue,
      0
    );
    const computeRatio = (splitValue: number) => {
      checkComputedAmount(_Amount, splitValue);
      let _amt = Math.min(
        (splitValue / totalRatio) * remainingRatioAmount,
        _Amount
      );

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
