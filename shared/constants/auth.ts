export const USER_ROLES = ['citizen', 'authority'] as const;

export const PERMISSIONS = {
  submitReport: 'submit_report',
  readOwnReports: 'read_own_reports',
  viewResolutionSummaries: 'view_resolution_summaries',
  confirmReport: 'confirm_report',
  trackReportStatus: 'track_report_status',
  viewOwnProfile: 'view_own_profile',
  viewWorkOrders: 'view_work_orders',
  viewReviewQueue: 'view_review_queue',
  updateWorkOrderStatus: 'update_work_order_status',
  viewAuditHistory: 'view_audit_history',
  accessDashboard: 'access_dashboard',
} as const;

export const ROLE_PERMISSIONS = {
  citizen: [
    PERMISSIONS.submitReport,
    PERMISSIONS.readOwnReports,
    PERMISSIONS.viewResolutionSummaries,
    PERMISSIONS.confirmReport,
    PERMISSIONS.trackReportStatus,
    PERMISSIONS.viewOwnProfile,
  ],
  authority: [
    PERMISSIONS.viewOwnProfile,
    PERMISSIONS.viewWorkOrders,
    PERMISSIONS.viewReviewQueue,
    PERMISSIONS.updateWorkOrderStatus,
    PERMISSIONS.viewAuditHistory,
    PERMISSIONS.accessDashboard,
  ],
} as const;
