export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

export const numberToWords = (amount: number): string => {
  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ];
  const b = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
    'eighty', 'ninety'
  ];

  const numToString = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 == 0 ? '' : ' and ' + numToString(n % 100));
    return '';
  };

  if (amount === 0) return 'zero';

  const billion = Math.floor(amount / 1000000000);
  const million = Math.floor((amount % 1000000000) / 1000000);
  const thousand = Math.floor((amount % 1000000) / 1000);
  const remainder = Math.floor(amount % 1000);

  let result = '';

  if (billion) result += numToString(billion) + ' billion ';
  if (million) result += numToString(million) + ' million ';
  if (thousand) result += numToString(thousand) + ' thousand ';
  if (remainder) result += numToString(remainder);

  return result.trim() + ' Naira only';
};