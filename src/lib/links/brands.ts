export interface Brand {
  name: string;
  domain: string;
  words: readonly string[];
  short?: boolean;
}

export const BRANDS: readonly Brand[] = [
  { name: "Amazon", domain: "amazon.com", words: ["amazon"] },
  { name: "American Express", domain: "americanexpress.com", words: ["americanexpress", "amex"] },
  { name: "Apple", domain: "apple.com", words: ["apple"] },
  { name: "AT&T", domain: "att.com", words: ["att"], short: true },
  { name: "Bank of America", domain: "bankofamerica.com", words: ["bankofamerica"] },
  { name: "Capital One", domain: "capitalone.com", words: ["capitalone"] },
  { name: "Chase", domain: "chase.com", words: ["chase"] },
  { name: "Citi", domain: "citi.com", words: ["citi"], short: true },
  { name: "Costco", domain: "costco.com", words: ["costco"] },
  { name: "CVS", domain: "cvs.com", words: ["cvs"], short: true },
  { name: "DHL", domain: "dhl.com", words: ["dhl"], short: true },
  { name: "Discover", domain: "discover.com", words: ["discover"] },
  { name: "E-ZPass", domain: "e-zpassiag.com", words: ["ezpass"] },
  { name: "Facebook", domain: "facebook.com", words: ["facebook"] },
  { name: "FedEx", domain: "fedex.com", words: ["fedex"] },
  { name: "Google", domain: "google.com", words: ["google"] },
  { name: "Instagram", domain: "instagram.com", words: ["instagram"] },
  { name: "IRS", domain: "irs.gov", words: ["irs"], short: true },
  { name: "Mastercard", domain: "mastercard.com", words: ["mastercard"] },
  { name: "Microsoft", domain: "microsoft.com", words: ["microsoft"] },
  { name: "Netflix", domain: "netflix.com", words: ["netflix"] },
  { name: "PayPal", domain: "paypal.com", words: ["paypal"] },
  { name: "Social Security", domain: "ssa.gov", words: ["socialsecurity", "ssa"] },
  { name: "Spectrum", domain: "spectrum.com", words: ["spectrum"] },
  { name: "Target", domain: "target.com", words: ["target"], short: true },
  { name: "T-Mobile", domain: "t-mobile.com", words: ["tmobile"] },
  { name: "UPS", domain: "ups.com", words: ["ups"], short: true },
  { name: "USPS", domain: "usps.com", words: ["usps"], short: true },
  { name: "Verizon", domain: "verizon.com", words: ["verizon"] },
  { name: "Visa", domain: "visa.com", words: ["visa"], short: true },
  { name: "Walgreens", domain: "walgreens.com", words: ["walgreens"] },
  { name: "Walmart", domain: "walmart.com", words: ["walmart"] },
  { name: "Wells Fargo", domain: "wellsfargo.com", words: ["wellsfargo"] },
  { name: "Xfinity", domain: "xfinity.com", words: ["xfinity"] },
] as const;

const MONEY_REQUEST = /(?:\$\s*\d|\b(?:pay|payment|fee|toll|balance|invoice|gift\s*card|wire|cash|money|refund)\b)/i;

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function messageHasBrandOrMoney(text: string): boolean {
  if (MONEY_REQUEST.test(text)) {
    return true;
  }

  return BRANDS.some((brand) => {
    const displayWords = brand.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (displayWords.length > 1) {
      const displayPattern = new RegExp(
        `(?:^|[^a-z0-9])${displayWords.map(escaped).join("[^a-z0-9]+")}(?:$|[^a-z0-9])`,
        "i",
      );
      if (displayPattern.test(text)) return true;
    }

    return brand.words.some((name) => {
      const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped(name)}(?:$|[^a-z0-9])`, "i");
      return pattern.test(text.replace(/[^a-z0-9.:/$-]+/gi, " "));
    });
  });
}
