// Shared types for tender scraper engines.
// Every engine produces these raw objects; the orchestrator normalises them
// into Tender + related rows.

export interface RawTender {
  sourcePortal: string;
  sourceTenderId: string;
  sourceUrl: string;
  nitRefNumber?: string | null;
  title: string;
  workType?: string;
  procurementType?: string;
  authorityName?: string; // free-text from portal — orchestrator resolves to TenderAuthority
  estimatedValueInr?: bigint | null;
  tenderFeeInr?: bigint | null;
  emdAmountInr?: bigint | null;
  publishedAt?: Date | null;
  bidSubmissionStart?: Date | null;
  bidSubmissionEnd?: Date | null;
  locationState?: string;
  locationDistrict?: string;
  locationTaluk?: string;
  status?: string;
  numberOfCovers?: number | null;
  rawHtmlSnapshot?: string;
}

export interface RawTenderDetail extends RawTender {
  description?: string;
  eligibility?: {
    minAnnualTurnoverInr?: number | null;
    yearsRequired?: number | null;
    similarWorkExp?: string | null;
    registrationTypes?: string[];
    locationRestrictions?: string | null;
  };
  documents?: Array<{ docType: string; displayName: string; sourceUrl: string }>;
}

export interface RawCorrigendum {
  sourceTenderId: string;
  sequenceNo: number;
  issuedAt: Date;
  changeType: string;
  summaryPlain?: string | null;
  diffJson: Record<string, unknown>;
  sourceUrl?: string | null;
}

export interface RawAward {
  sourceTenderId: string;
  awardedAt: Date;
  winnerName: string;
  winnerIsCompany: boolean;
  awardedAmountInr: bigint;
  aocDocumentUrl?: string | null;
  l1Rank?: number;
}

export interface EngineListOptions {
  sinceDate?: Date;
  state?: string;
  limit?: number;
  dryRun?: boolean; // if true, engine must not persist anything to DB and should return parsed-but-not-saved results
}

export interface EnginePortalConfig {
  id: string;
  portalCode: string;
  baseUrl: string;
  rateLimitSeconds: number;
  maxRequestsPerDay: number;
  appliesToStates: string[];
}

export interface ScraperEngine {
  readonly engineType: "kppp-seam" | "nicgep" | "ireps" | "tenderwizard";
  listTenders(cfg: EnginePortalConfig, opts: EngineListOptions): Promise<RawTender[]>;
  fetchTenderDetail?(cfg: EnginePortalConfig, sourceTenderId: string): Promise<RawTenderDetail | null>;
  fetchCorrigenda?(cfg: EnginePortalConfig, sourceTenderId: string): Promise<RawCorrigendum[]>;
  fetchAward?(cfg: EnginePortalConfig, sourceTenderId: string): Promise<RawAward | null>;
}
