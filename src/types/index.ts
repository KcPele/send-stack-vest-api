interface SplitInfo {
  SplitType: "FLAT" | "PERCENTAGE" | "RATIO";
  SplitValue: number;
  SplitEntityId: string;
}

interface SplitPayment {
  ID: number;
  Amount: number;
  Currency: string;
  CustomerEmail: string;
  SplitInfo: SplitInfo[];
}
