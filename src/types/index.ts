interface SplitInfo {
  SplitType: "FLAT" | "PERCENTAGE" | "RATIO";
  SplitValue: number;
  SplitEntityId: string;
}

interface Transaction {
  ID: number;
  Amount: number;
  Currency: string;
  CustomerEmail: string;
  SplitInfo: SplitInfo[];
}

interface SplitResult {
  ID: number;
  Balance: number;
  SplitBreakdown: { SplitEntityId: string; Amount: number }[];
}
