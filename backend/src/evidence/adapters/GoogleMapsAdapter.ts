import logger from '../../utils/logger';

export class GoogleMapsAdapter {
  private apiKey: string;
  public stubMode: boolean;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.stubMode = process.env.STUB_MODE === 'true';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      if (!this.stubMode) {
        throw new Error('Configuration Error: GOOGLE_MAPS_API_KEY is missing and STUB_MODE is not enabled.');
      }
      logger.warn('GoogleMapsAdapter initialized in STUB_MODE because GOOGLE_MAPS_API_KEY is missing.');
    }
  }

  /**
   * Fetches reverse geocoding data from the Google Maps API.
   * If no API key is provided, returns a deterministic stub.
   */
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    if (this.stubMode && !this.apiKey) {
      // Deterministic stub
      return {
        formatted_address: '123 Fake St, Springfield',
        geometry: { location: { lat, lng } },
        place_id: 'ChIJstubplaceid',
        address_components: [
          { types: ['locality'], long_name: 'Springfield' },
          { types: ['administrative_area_level_1'], long_name: 'State' },
          { types: ['postal_code'], long_name: '12345' }
        ]
      };
    }

    // In a real production scenario, this would use the @googlemaps/google-maps-services-js SDK
    // For this milestone, we isolate the HTTP call logic.
    throw new Error('Google Maps real API call not implemented for this milestone phase.');
  }
}
