export const formatDiscountDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const isExpired = (expiryStr: string) => {
  return new Date(expiryStr) < new Date();
};
