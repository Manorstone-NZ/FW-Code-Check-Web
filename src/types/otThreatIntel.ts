export interface OTThreatIntel {
  id: string; // UUID
  title: string;
  summary: string;
  source: string;
  retrieved_at: string; // ISO timestamp
  affected_vendors: string[];
  threat_type: string;
  severity: 'High' | 'Medium' | 'Low';
  industrial_protocols: string[];
  system_targets: string[]; // e.g. SCADA, PLC, HMI
  tags: string[];
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  site_relevance?: string; // Optional: "Relevant to site", "Mitigated", etc.
  response_notes?: string; // Optional: analyst notes
  llm_response?: string; // Optional: full LLM/AI markdown response
}
