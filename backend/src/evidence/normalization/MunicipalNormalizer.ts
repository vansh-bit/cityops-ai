import { EvidenceNormalizer } from '../interfaces/evidenceInterfaces';

export class MunicipalNormalizer implements EvidenceNormalizer<any> {
  normalize(rawResponse: any): Record<string, any> {
    if (!rawResponse || typeof rawResponse !== 'object') {
      return {};
    }
    
    // Normalize municipal contextual data
    return {
      assetId: rawResponse.asset_id || null,
      assetType: rawResponse.asset_type || null,
      department: rawResponse.department_owner || 'UNKNOWN',
      maintenanceSchedule: rawResponse.maintenance_schedule || null,
      activeWorkOrders: Array.isArray(rawResponse.active_work_orders) ? rawResponse.active_work_orders : [],
      jurisdiction: rawResponse.jurisdiction || null,
    };
  }
}
