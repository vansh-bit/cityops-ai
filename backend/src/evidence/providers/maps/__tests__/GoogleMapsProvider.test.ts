import { GoogleMapsProvider } from '../GoogleMapsProvider';
import { EvidenceRequest, EvidenceSource, EvidenceStatus } from '../../../contracts/evidenceContracts';
import { Client } from '@googlemaps/google-maps-services-js';

jest.mock('@googlemaps/google-maps-services-js');

describe('GoogleMapsProvider', () => {
  let provider: GoogleMapsProvider;
  let mockClient: jest.Mocked<Client>;

  beforeEach(() => {
    mockClient = new Client({}) as jest.Mocked<Client>;
    (Client as jest.Mock).mockImplementation(() => mockClient);
    
    process.env.MAPS_API_KEY = 'valid_key_for_test';
    provider = new GoogleMapsProvider();
    
    // Clear mocks
    mockClient.reverseGeocode.mockReset();
    mockClient.placesNearby.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should invalidate requests that are not for GOOGLE_MAPS', () => {
    const request: EvidenceRequest = {
      requestId: 'test-1',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { latitude: 40.7128, longitude: -74.0060 }
    };
    expect(provider.validateRequest(request)).toBe(false);
  });

  it('should invalidate requests with missing or non-numeric coordinates', () => {
    const request: EvidenceRequest = {
      requestId: 'test-2',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { latitude: '40.7128', longitude: -74.0060 }
    };
    expect(provider.validateRequest(request)).toBe(false);
  });

  it('should invalidate requests with out of bounds coordinates', () => {
    const request: EvidenceRequest = {
      requestId: 'test-3',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { latitude: 140.7128, longitude: -74.0060 }
    };
    expect(provider.validateRequest(request)).toBe(false);
  });

  it('should return VALID and evidence on successful API calls', async () => {
    const request: EvidenceRequest = {
      requestId: 'test-4',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { latitude: 40.7128, longitude: -74.0060 }
    };

    mockClient.reverseGeocode.mockResolvedValue({
      data: {
        results: [{
          formatted_address: '123 Test St',
          types: ['street_address', 'administrative_area_level_3', 'locality'],
          address_components: [
            { long_name: 'Test City', types: ['locality'] }
          ]
        }]
      }
    } as any);

    mockClient.placesNearby.mockResolvedValue({
      data: {
        results: [{
          name: 'Test School',
          types: ['school']
        }]
      }
    } as any);

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence).toBeDefined();
    expect(response.evidence?.data.location.formattedAddress).toBe('123 Test St');
    expect(response.evidence?.data.municipality.municipalityName).toBe('Test City');
    expect(response.evidence?.data.infrastructure.nearbyPublicInfrastructure).toContain('Test School');
  });

  it('should return PARTIAL status if reverseGeocode succeeds but placesNearby fails', async () => {
    const request: EvidenceRequest = {
      requestId: 'test-5',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { latitude: 40.7128, longitude: -74.0060 }
    };

    mockClient.reverseGeocode.mockResolvedValue({
      data: {
        results: [{
          formatted_address: '123 Test St',
          types: ['street_address'],
          address_components: [
            { long_name: 'Test City', types: ['locality'] }
          ]
        }]
      }
    } as any);

    mockClient.placesNearby.mockRejectedValue(new Error('Places API Failed'));

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.PARTIAL);
    expect(response.evidence).toBeDefined();
    expect(response.evidence?.data.location.formattedAddress).toBe('123 Test St');
    expect(response.evidence?.data.infrastructure).toBeUndefined(); // Did not succeed
    expect(response.errors).toContain('PlacesNearby Error: Places API Failed');
  });

  it('should return PARTIAL status if placesNearby succeeds but reverseGeocode fails', async () => {
    const request: EvidenceRequest = {
      requestId: 'test-6',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { latitude: 40.7128, longitude: -74.0060 }
    };

    mockClient.reverseGeocode.mockRejectedValue(new Error('Geocode API Failed'));

    mockClient.placesNearby.mockResolvedValue({
      data: {
        results: [{
          name: 'Test School',
          types: ['school']
        }]
      }
    } as any);

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.PARTIAL);
    expect(response.evidence).toBeDefined();
    expect(response.evidence?.data.location).toBeUndefined(); // Did not succeed
    expect(response.evidence?.data.infrastructure.nearbyPublicInfrastructure).toContain('Test School');
    expect(response.errors).toContain('ReverseGeocode Error: Geocode API Failed');
  });

  it('should return ERROR status if both APIs fail', async () => {
    const request: EvidenceRequest = {
      requestId: 'test-7',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { latitude: 40.7128, longitude: -74.0060 }
    };

    mockClient.reverseGeocode.mockRejectedValue(new Error('Geocode API Failed'));
    mockClient.placesNearby.mockRejectedValue(new Error('Places API Failed'));

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.evidence).toBeNull();
    expect(response.errors?.length).toBeGreaterThan(0);
  });
});
