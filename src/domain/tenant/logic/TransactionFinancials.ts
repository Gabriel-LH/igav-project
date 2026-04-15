export interface IFinancialData {
  totalAmount: number;
  paymentMethodId?: string;
  creditPaymentMethodId?: string;
  receivedAmount?: number;
  creditAppliedAmount?: number;
  keepAsCredit?: boolean;
}

export class TransactionFinancials {
  public readonly totalAmount: number;
  public readonly downPayment: number;
  public readonly paymentMethodId: string;
  public readonly creditPaymentMethodId: string;
  public readonly receivedAmount: number;
  public readonly creditAppliedAmount: number;
  public readonly keepAsCredit: boolean;

  constructor(data: IFinancialData) {
    this.totalAmount = data.totalAmount;
    this.paymentMethodId = data.paymentMethodId ?? "";
    this.creditPaymentMethodId = data.creditPaymentMethodId ?? "";
    this.receivedAmount = data.receivedAmount ?? 0;
    this.creditAppliedAmount = data.creditAppliedAmount ?? 0;
    this.downPayment = this.receivedAmount + this.creditAppliedAmount;
    this.keepAsCredit = data.keepAsCredit ?? false;
  }

  get initialNetPaid(): number {
    return this.downPayment > 0 ? this.downPayment : 0;
  }

  get overpayment(): number {
    return this.receivedAmount > this.totalAmount
      ? this.receivedAmount - this.totalAmount
      : 0;
  }

  get hasOverpaymentToKeep(): boolean {
    return this.overpayment > 0 && this.keepAsCredit;
  }
}
