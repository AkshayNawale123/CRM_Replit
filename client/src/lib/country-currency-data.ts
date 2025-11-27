export interface CountryData {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  exchangeRateToINR: number;
}

export const countries: CountryData[] = [
  { name: "Afghanistan", code: "AF", currency: "AFN", currencySymbol: "؋", exchangeRateToINR: 1.21 },
  { name: "Albania", code: "AL", currency: "ALL", currencySymbol: "L", exchangeRateToINR: 0.87 },
  { name: "Algeria", code: "DZ", currency: "DZD", currencySymbol: "د.ج", exchangeRateToINR: 0.62 },
  { name: "Argentina", code: "AR", currency: "ARS", currencySymbol: "$", exchangeRateToINR: 0.084 },
  { name: "Australia", code: "AU", currency: "AUD", currencySymbol: "$", exchangeRateToINR: 54.5 },
  { name: "Austria", code: "AT", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Bahrain", code: "BH", currency: "BHD", currencySymbol: ".د.ب", exchangeRateToINR: 221.5 },
  { name: "Bangladesh", code: "BD", currency: "BDT", currencySymbol: "৳", exchangeRateToINR: 0.76 },
  { name: "Belgium", code: "BE", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Brazil", code: "BR", currency: "BRL", currencySymbol: "R$", exchangeRateToINR: 14.5 },
  { name: "Canada", code: "CA", currency: "CAD", currencySymbol: "$", exchangeRateToINR: 61.2 },
  { name: "Chile", code: "CL", currency: "CLP", currencySymbol: "$", exchangeRateToINR: 0.088 },
  { name: "China", code: "CN", currency: "CNY", currencySymbol: "¥", exchangeRateToINR: 11.5 },
  { name: "Colombia", code: "CO", currency: "COP", currencySymbol: "$", exchangeRateToINR: 0.02 },
  { name: "Czech Republic", code: "CZ", currency: "CZK", currencySymbol: "Kč", exchangeRateToINR: 3.65 },
  { name: "Denmark", code: "DK", currency: "DKK", currencySymbol: "kr", exchangeRateToINR: 12.2 },
  { name: "Egypt", code: "EG", currency: "EGP", currencySymbol: "E£", exchangeRateToINR: 1.7 },
  { name: "Finland", code: "FI", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "France", code: "FR", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Germany", code: "DE", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Greece", code: "GR", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Hong Kong", code: "HK", currency: "HKD", currencySymbol: "HK$", exchangeRateToINR: 10.7 },
  { name: "Hungary", code: "HU", currency: "HUF", currencySymbol: "Ft", exchangeRateToINR: 0.23 },
  { name: "Iceland", code: "IS", currency: "ISK", currencySymbol: "kr", exchangeRateToINR: 0.61 },
  { name: "India", code: "IN", currency: "INR", currencySymbol: "₹", exchangeRateToINR: 1 },
  { name: "Indonesia", code: "ID", currency: "IDR", currencySymbol: "Rp", exchangeRateToINR: 0.0053 },
  { name: "Ireland", code: "IE", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Israel", code: "IL", currency: "ILS", currencySymbol: "₪", exchangeRateToINR: 23.2 },
  { name: "Italy", code: "IT", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Japan", code: "JP", currency: "JPY", currencySymbol: "¥", exchangeRateToINR: 0.56 },
  { name: "Jordan", code: "JO", currency: "JOD", currencySymbol: "د.ا", exchangeRateToINR: 117.8 },
  { name: "Kenya", code: "KE", currency: "KES", currencySymbol: "KSh", exchangeRateToINR: 0.54 },
  { name: "Kuwait", code: "KW", currency: "KWD", currencySymbol: "د.ك", exchangeRateToINR: 272.5 },
  { name: "Malaysia", code: "MY", currency: "MYR", currencySymbol: "RM", exchangeRateToINR: 18.8 },
  { name: "Mexico", code: "MX", currency: "MXN", currencySymbol: "$", exchangeRateToINR: 4.85 },
  { name: "Netherlands", code: "NL", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "New Zealand", code: "NZ", currency: "NZD", currencySymbol: "$", exchangeRateToINR: 50.5 },
  { name: "Nigeria", code: "NG", currency: "NGN", currencySymbol: "₦", exchangeRateToINR: 0.055 },
  { name: "Norway", code: "NO", currency: "NOK", currencySymbol: "kr", exchangeRateToINR: 7.65 },
  { name: "Oman", code: "OM", currency: "OMR", currencySymbol: "ر.ع.", exchangeRateToINR: 217.2 },
  { name: "Pakistan", code: "PK", currency: "PKR", currencySymbol: "₨", exchangeRateToINR: 0.30 },
  { name: "Peru", code: "PE", currency: "PEN", currencySymbol: "S/", exchangeRateToINR: 22.5 },
  { name: "Philippines", code: "PH", currency: "PHP", currencySymbol: "₱", exchangeRateToINR: 1.49 },
  { name: "Poland", code: "PL", currency: "PLN", currencySymbol: "zł", exchangeRateToINR: 20.8 },
  { name: "Portugal", code: "PT", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Qatar", code: "QA", currency: "QAR", currencySymbol: "ر.ق", exchangeRateToINR: 22.95 },
  { name: "Romania", code: "RO", currency: "RON", currencySymbol: "lei", exchangeRateToINR: 18.4 },
  { name: "Russia", code: "RU", currency: "RUB", currencySymbol: "₽", exchangeRateToINR: 0.82 },
  { name: "Saudi Arabia", code: "SA", currency: "SAR", currencySymbol: "ر.س", exchangeRateToINR: 22.28 },
  { name: "Singapore", code: "SG", currency: "SGD", currencySymbol: "S$", exchangeRateToINR: 62.5 },
  { name: "South Africa", code: "ZA", currency: "ZAR", currencySymbol: "R", exchangeRateToINR: 4.65 },
  { name: "South Korea", code: "KR", currency: "KRW", currencySymbol: "₩", exchangeRateToINR: 0.062 },
  { name: "Spain", code: "ES", currency: "EUR", currencySymbol: "€", exchangeRateToINR: 91.2 },
  { name: "Sri Lanka", code: "LK", currency: "LKR", currencySymbol: "Rs", exchangeRateToINR: 0.28 },
  { name: "Sweden", code: "SE", currency: "SEK", currencySymbol: "kr", exchangeRateToINR: 7.95 },
  { name: "Switzerland", code: "CH", currency: "CHF", currencySymbol: "CHF", exchangeRateToINR: 95.5 },
  { name: "Taiwan", code: "TW", currency: "TWD", currencySymbol: "NT$", exchangeRateToINR: 2.6 },
  { name: "Thailand", code: "TH", currency: "THB", currencySymbol: "฿", exchangeRateToINR: 2.45 },
  { name: "Turkey", code: "TR", currency: "TRY", currencySymbol: "₺", exchangeRateToINR: 2.45 },
  { name: "Ukraine", code: "UA", currency: "UAH", currencySymbol: "₴", exchangeRateToINR: 2.02 },
  { name: "United Arab Emirates", code: "AE", currency: "AED", currencySymbol: "د.إ", exchangeRateToINR: 22.75 },
  { name: "United Kingdom", code: "GB", currency: "GBP", currencySymbol: "£", exchangeRateToINR: 106.5 },
  { name: "United States", code: "US", currency: "USD", currencySymbol: "$", exchangeRateToINR: 83.5 },
  { name: "Vietnam", code: "VN", currency: "VND", currencySymbol: "₫", exchangeRateToINR: 0.0034 },
];

const countryAliases: Record<string, string> = {
  "uae": "United Arab Emirates",
  "usa": "United States",
  "uk": "United Kingdom",
  "usd": "United States",
  "gbp": "United Kingdom",
  "eur": "Germany",
};

export function getCountryByName(name: string): CountryData | undefined {
  const lowerName = name.toLowerCase();
  const normalizedName = countryAliases[lowerName] || name;
  return countries.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
}

export function getCurrencyByCountry(countryName: string): { currency: string; symbol: string; rate: number } | null {
  const country = getCountryByName(countryName);
  if (!country) return null;
  return {
    currency: country.currency,
    symbol: country.currencySymbol,
    rate: country.exchangeRateToINR
  };
}

export function convertToINR(value: number, countryName: string): number {
  const country = getCountryByName(countryName);
  if (!country) return value * 83.5;
  return value * country.exchangeRateToINR;
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyByCountry(value: number, countryName: string): string {
  const country = getCountryByName(countryName);
  if (!country) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: country.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${country.currencySymbol}${value.toLocaleString()}`;
  }
}

export function formatCompactCurrencyByCountry(value: number, countryName: string): string {
  const country = getCountryByName(countryName);
  const symbol = country?.currencySymbol || "$";
  
  if (value >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${symbol}${(value / 1000).toFixed(0)}K`;
  }
  return `${symbol}${value.toLocaleString()}`;
}

export function searchCountries(query: string): CountryData[] {
  if (!query.trim()) return countries;
  const lowerQuery = query.toLowerCase();
  return countries.filter(country => 
    country.name.toLowerCase().includes(lowerQuery) ||
    country.code.toLowerCase().includes(lowerQuery) ||
    country.currency.toLowerCase().includes(lowerQuery)
  );
}
