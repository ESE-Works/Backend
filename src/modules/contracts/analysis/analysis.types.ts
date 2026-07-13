export type InputSource =
  | 'image_camera'
  | 'image_gallery'
  | 'image_file'
  | 'text_paste'
  | 'text_special_terms'
  | 'sample';

export interface ContractExtraction {
  lessor_name: string | null;
  lessee_name: string | null;
  property_address: string | null;
  property_type: 'apartment' | 'officetel' | 'villa' | 'oneroom' | 'unknown';
  contract_type: 'monthly' | 'lease' | 'semi_lease' | 'unknown';
  deposit: number | null;
  monthly_rent: number | null;
  contract_start: string | null;
  contract_end: string | null;
  special_terms: string[];
}

export interface MissingCheckItem {
  item: string;
  severity: 'danger' | 'warning';
  description: string;
}

export interface ClauseAnalysis {
  id: string;
  original_text: string;
  type: 'danger' | 'warning' | 'safe';
  reason: string;
  law_reference: string;
  suggestion: string;
  request_guide: string;
}

export interface FraudRiskIndicator {
  indicator: string;
  severity: 'danger' | 'warning';
  description: string;
}

export interface ContractAnalysisResult {
  contract_valid: boolean;
  input_mode: 'full' | 'special_terms';
  is_truncated: boolean;
  extraction: ContractExtraction | null;
  missing_check: MissingCheckItem[];
  clauses: ClauseAnalysis[];
  fraud_risk: {
    detected: boolean;
    indicators: FraudRiskIndicator[];
  } | null;
  summary: string;
  risk_score?: number;
  risk_grade?: 'safe' | 'warning' | 'danger' | 'critical';
}
