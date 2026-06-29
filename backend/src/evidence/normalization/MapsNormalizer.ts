import { EvidenceNormalizer } from '../interfaces/evidenceInterfaces';

export class MapsNormalizer implements EvidenceNormalizer<any> {
  normalize(rawResponse: any): Record<string, any> {
    if (!rawResponse || typeof rawResponse !== 'object') {
      return {};
    }
    
    // Convert a hypothetical Google Maps geocoding response into a standardized format
    return {
      formattedAddress: rawResponse.formatted_address || 'Unknown',
      coordinates: rawResponse.geometry?.location || null,
      placeId: rawResponse.place_id || null,
      administrativeArea: rawResponse.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || null,
      locality: rawResponse.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || null,
      postalCode: rawResponse.address_components?.find((c: any) => c.types.includes('postal_code'))?.long_name || null,
    };
  }
}
