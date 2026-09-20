// Supported currencies for the multi-currency system.
// Each entry has the ISO 4217 code, a human-readable name, and the unicode symbol.

export type CurrencyInfo = {
  code: string;
  name: string;
  symbol: string;
};

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب" },
  { code: "OMR", name: "Omani Rial", symbol: "﷼" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
];

const CURRENCY_CODES = new Set(SUPPORTED_CURRENCIES.map((c) => c.code));

/** Default currency used when none is specified. */
export const DEFAULT_CURRENCY = "AED";

/** Returns true if the given code is a supported currency. */
export function isSupportedCurrency(code: string): boolean {
  return CURRENCY_CODES.has(code.toUpperCase());
}

/**
 * Returns a valid currency code: the given code if supported, otherwise the
 * fallback (defaults to DEFAULT_CURRENCY). Useful for normalizing stored or
 * user-supplied values that may predate the supported-currency list.
 */
export function normalizeCurrency(code?: string | null, fallback = DEFAULT_CURRENCY): string {
  if (code && isSupportedCurrency(code)) return code.toUpperCase();
  return fallback;
}

/** Looks up currency metadata by code (returns undefined if not found). */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code.toUpperCase());
}

/** Returns the symbol for a currency code, or the code itself if unknown. */
export function currencySymbol(code: string): string {
  return getCurrencyInfo(code)?.symbol ?? code;
}
