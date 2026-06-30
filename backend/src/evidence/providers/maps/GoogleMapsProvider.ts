import { Client, GeocodeResponse, PlacesNearbyResponse, AddressType, PlaceType2, GeocodeResult, Place } from '@googlemaps/google-maps-services-js';
import { randomUUID } from 'crypto';
import { 
  EvidenceProvider, 
} from '../../interfaces/evidenceInterfaces';
import { 
  Evidence, 
  EvidenceRequest, 
  EvidenceResponse, 
  EvidenceSource, 
  EvidenceStatus 
} from '../../contracts/evidenceContracts';
import logger from '../../../utils/logger';

export class GoogleMapsProvider implements EvidenceProvider {
  private client: Client;
  private apiKey: string;
  private maxRetries = 1;
  
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.MAPS_API_KEY || process.env.VITE_MAPS_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      logger.warn('GoogleMapsProvider initialized without a valid API key. Evidence collection may fail.');
    }
  }

  validateRequest(request: EvidenceRequest): boolean {
    if (request.source !== EvidenceSource.GOOGLE_MAPS) {
      return false;
    }
    const { latitude, longitude } = request.parameters;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return false;
    }
    return true;
  }

  /**
   * Helper to execute API calls with exponential backoff and randomized jitter
   */
  private async executeWithRetry<T>(operation: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Don't retry validation or auth errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error;
      }
      
      if (attempt >= this.maxRetries) {
        throw error;
      }
      
      const baseDelay = 500 * Math.pow(2, attempt);
      const jitter = Math.random() * 200;
      const delay = baseDelay + jitter;
      
      logger.warn(`GoogleMapsProvider API error, retrying in ${delay}ms...`, { attempt, error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry(operation, attempt + 1);
    }
  }

  async collectEvidence(request: EvidenceRequest): Promise<EvidenceResponse> {
    const startTime = Date.now();
    const response: EvidenceResponse = {
      requestId: request.requestId,
      source: EvidenceSource.GOOGLE_MAPS,
      evidence: null,
      status: EvidenceStatus.ERROR,
      errors: []
    };

    if (!this.validateRequest(request)) {
      response.errors?.push('Invalid request parameters: missing or invalid coordinates.');
      return response;
    }

    const { latitude, longitude } = request.parameters;

    try {
      // Execute APIs concurrently with Promise.allSettled to preserve partial evidence
      const results = await Promise.allSettled([
        this.executeWithRetry<GeocodeResponse>(() => this.client.reverseGeocode({
          params: {
            latlng: { lat: latitude, lng: longitude },
            key: this.apiKey,
          },
          timeout: 4000
        })),
        this.executeWithRetry<PlacesNearbyResponse>(() => this.client.placesNearby({
          params: {
            location: { lat: latitude, lng: longitude },
            radius: 50,
            key: this.apiKey,
          },
          timeout: 4000
        }))
      ]);

      const durationMs = Date.now() - startTime;
      const geocodeResult = results[0];
      const placesResult = results[1];
      
      let locationEvidence;
      let municipalityEvidence;
      let infrastructureEvidence;

      if (geocodeResult.status === 'fulfilled' && geocodeResult.value) {
        locationEvidence = this.extractLocationEvidence(geocodeResult.value.data.results, latitude, longitude);
        municipalityEvidence = this.extractMunicipalityEvidence(geocodeResult.value.data.results);
      } else if (geocodeResult.status === 'rejected') {
        logger.error('GoogleMapsProvider reverseGeocode failed', { error: geocodeResult.reason?.message });
        response.errors?.push(`ReverseGeocode Error: ${geocodeResult.reason?.message || 'Unknown error'}`);
      }

      if (placesResult.status === 'fulfilled' && placesResult.value) {
        infrastructureEvidence = this.extractInfrastructureEvidence(placesResult.value.data.results);
      } else if (placesResult.status === 'rejected') {
        logger.error('GoogleMapsProvider placesNearby failed', { error: placesResult.reason?.message });
        response.errors?.push(`PlacesNearby Error: ${placesResult.reason?.message || 'Unknown error'}`);
      }

      if (geocodeResult.status === 'rejected' && placesResult.status === 'rejected') {
        response.status = EvidenceStatus.ERROR;
        return response;
      }

      const evidence: Evidence = {
        id: randomUUID(),
        metadata: {
          providerId: 'google-maps-services-js',
          source: EvidenceSource.GOOGLE_MAPS,
          timestamp: new Date().toISOString(),
          executionDurationMs: durationMs,
        },
        status: EvidenceStatus.VALID,
        data: {
          location: locationEvidence,
          municipality: municipalityEvidence,
          infrastructure: infrastructureEvidence
        }
      };

      response.evidence = evidence;
      response.status = (geocodeResult.status === 'rejected' || placesResult.status === 'rejected') ? EvidenceStatus.PARTIAL : EvidenceStatus.VALID;

    } catch (error: any) {
      logger.error('GoogleMapsProvider execution failed', { error: error.message });
      response.status = EvidenceStatus.ERROR;
      response.errors?.push(`Maps API Error: ${error.message}`);
    }

    return response;
  }

  private extractLocationEvidence(results: GeocodeResult[], latitude: number, longitude: number) {
    if (!results || results.length === 0) return undefined;
    
    const result = results[0];
    let locality = '';
    let city = '';
    let district = '';
    let state = '';
    let country = '';
    let postalCode = '';

    for (const component of result.address_components) {
      if (component.types.includes('locality' as AddressType)) {
        locality = component.long_name;
        city = component.long_name;
      }
      if (component.types.includes('sublocality' as AddressType)) {
        district = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1' as AddressType)) {
        state = component.long_name;
      }
      if (component.types.includes('country' as AddressType)) {
        country = component.long_name;
      }
      if (component.types.includes('postal_code' as AddressType)) {
        postalCode = component.long_name;
      }
    }

    return {
      latitude,
      longitude,
      formattedAddress: result.formatted_address,
      locality,
      city,
      district,
      state,
      country,
      postalCode
    };
  }

  private extractMunicipalityEvidence(results: GeocodeResult[]) {
    if (!results || results.length === 0) return undefined;
    
    // Find political or administrative areas
    let municipalityName = 'Unknown Municipality';
    let administrativeArea = 'Unknown Area';

    for (const result of results) {
      if (result.types.includes('administrative_area_level_3' as AddressType) || result.types.includes('locality' as AddressType)) {
        municipalityName = result.address_components[0]?.long_name || municipalityName;
      }
      if (result.types.includes('administrative_area_level_1' as AddressType) || result.types.includes('administrative_area_level_2' as AddressType)) {
        administrativeArea = result.address_components[0]?.long_name || administrativeArea;
      }
    }

    return {
      municipalityName,
      jurisdiction: 'Municipal Government',
      administrativeArea,
      responsibleAuthority: `${municipalityName} Department of Public Works`
    };
  }

  private extractInfrastructureEvidence(places: Place[]) {
    const nearbyLandmarks: string[] = [];
    const nearbyPublicInfrastructure: string[] = [];
    
    if (places && places.length > 0) {
      for (const place of places.slice(0, 5)) {
        if (place.types?.includes('school' as any) || place.types?.includes('hospital' as any) || place.types?.includes('park' as any)) {
          nearbyPublicInfrastructure.push(place.name || (place.types ? place.types[0] : 'Unknown Infrastructure'));
        } else {
          nearbyLandmarks.push(place.name || (place.types ? place.types[0] : 'Unknown Landmark'));
        }
      }
    }

    return {
      roadType: 'Local Road',
      nearbyLandmarks,
      nearbyPublicInfrastructure,
      accessibility: 'Public Access'
    };
  }

}
