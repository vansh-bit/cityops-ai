import { EvidenceStatus } from '../../contracts/evidenceContracts';

export interface LocationEvidence {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface MunicipalityEvidence {
  municipalityName: string;
  jurisdiction: string;
  administrativeArea: string;
  responsibleAuthority: string;
}

export interface InfrastructureEvidence {
  roadType: string;
  nearbyLandmarks: string[];
  nearbyPublicInfrastructure: string[];
  accessibility: string;
}

export interface EvidenceMetadata {
  collectionDurationMs: number;
  providerCount: number;
  successfulProviders: number;
  failedProviders: number;
}

export interface ProviderStatus {
  provider: string;
  status: "VALID" | "PARTIAL" | "ERROR";
  durationMs: number;
  error?: string;
}

export interface EvidencePackage {
  requestId: string;
  collectedAt: string;
  overallStatus: EvidenceStatus;
  providers: ProviderStatus[];
  location?: LocationEvidence;
  municipality?: MunicipalityEvidence;
  infrastructure?: InfrastructureEvidence;
  metadata: EvidenceMetadata;
  limitations: string[];
}
