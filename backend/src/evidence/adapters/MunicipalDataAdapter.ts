import logger from '../../utils/logger';

export class MunicipalDataAdapter {
  private endpointUrl: string;
  public stubMode: boolean;

  constructor() {
    this.endpointUrl = process.env.MUNICIPAL_API_URL || '';
    this.stubMode = process.env.STUB_MODE === 'true';
  }

  async initialize(): Promise<void> {
    if (!this.endpointUrl) {
      if (!this.stubMode) {
        throw new Error('Configuration Error: MUNICIPAL_API_URL is missing and STUB_MODE is not enabled.');
      }
      logger.warn('MunicipalDataAdapter initialized in STUB_MODE because MUNICIPAL_API_URL is missing.');
    }
  }

  /**
   * Fetches civic asset information.
   * Returns a deterministic stub if no endpoint URL is provided.
   */
  async fetchAssetContext(locationQuery: string): Promise<any> {
    if (this.stubMode && !this.endpointUrl) {
      // Deterministic stub
      return {
        asset_id: 'ASSET-999',
        asset_type: 'Public Roadway',
        department_owner: 'Department of Transportation',
        maintenance_schedule: 'Quarterly',
        active_work_orders: [],
        jurisdiction: 'City of Springfield'
      };
    }

    throw new Error('Municipal Data real API call not implemented for this milestone phase.');
  }
}
