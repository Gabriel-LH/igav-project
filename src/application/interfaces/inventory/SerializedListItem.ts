export interface SerializedListItem {
  id: string;
  serialCode: string;
  productName: string;
  variantName: string;
  variantCode: string;
  branchName: string;
  condition: string;
  status: string;
  isForRent: boolean;
  isForSale: boolean;
  createdAt: Date;
}
