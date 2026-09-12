export type Tier = "none" | "amber" | "red";           // ordered: none < amber < red
export interface EvidenceRow { signal: string; tier: Tier; text: string }   // text is a fixed plain-English code template
export interface LinkReport { raw: string; host: string | null; finalUrl: string | null; evidence: EvidenceRow[] }
export interface LinkCheckResult { links: LinkReport[]; floor: Tier; rows: EvidenceRow[] }
export interface ModelReading { tier: Tier; explanation: string }           // explanation is at most about 60 words
export interface Verdict { tier: Tier; headline: string; rows: EvidenceRow[]; explanation: string; advice: string | null }
