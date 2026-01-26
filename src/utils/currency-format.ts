export const formatCurrency = (amount?: number) => {
    const currency = "S/.";
    return `${currency} ${amount?.toFixed(2)}`;
  };