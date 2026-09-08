import { AppUser, UserRole } from '../types';

export interface RestrictionDefinition {
  id: string;
  category:
    | 'Creation Privileges'
    | 'Deletion & Purge Controls'
    | 'Editing & Modification'
    | 'Financial & Commercials'
    | 'Client & Confidential Data'
    | 'System Modules'
    | 'Export & Reporting';
  label: string;
  description: string;
  icon?: string;
}

export const RESTRICTION_DEFINITIONS: RestrictionDefinition[] = [
  // 1. Creation Privileges
  {
    id: 'action_create_engagement',
    category: 'Creation Privileges',
    label: 'Create New Engagement Proposals & Charters',
    description: 'Hides and blocks all buttons to create or draft new engagement letters across Navbar, Dashboard, CRM, and Templates.',
  },
  {
    id: 'action_create_crm_lead',
    category: 'Creation Privileges',
    label: 'Create New CRM Leads & Mandates',
    description: 'Hides and blocks adding new leads or prospective client entries in the Marketing CRM.',
  },
  {
    id: 'action_create_template',
    category: 'Creation Privileges',
    label: 'Create New Master Service Scope Templates',
    description: 'Prevents drafting or adding new standardized service templates to the firm library.',
  },

  // 2. Deletion & Purge Controls
  {
    id: 'action_delete_engagement',
    category: 'Deletion & Purge Controls',
    label: 'Delete Engagement Letters & Charters',
    description: 'Disables and hides the trash/delete action on client engagement proposals.',
  },
  {
    id: 'action_delete_crm',
    category: 'Deletion & Purge Controls',
    label: 'Delete CRM Lead Records',
    description: 'Disables and hides delete actions on pipeline leads, contacts, and mandates in CRM.',
  },
  {
    id: 'action_delete_template',
    category: 'Deletion & Purge Controls',
    label: 'Delete Master Scope Templates',
    description: 'Prevents deleting master service templates from the organizational repository.',
  },
  {
    id: 'action_delete_trash',
    category: 'Deletion & Purge Controls',
    label: 'Purge / Empty Recycle Dustbin Permanently',
    description: 'Blocks permanent destruction and emptying of items inside the Recycle Dustbin.',
  },
  {
    id: 'action_delete',
    category: 'Deletion & Purge Controls',
    label: 'General Record Deletion (Master Fallback)',
    description: 'Broad fallback that disables all record deletion capabilities across the application.',
  },

  // 3. Editing & Modification
  {
    id: 'action_edit_engagement',
    category: 'Editing & Modification',
    label: 'Edit Existing Engagement Letters',
    description: 'Restricts opening the live charter editor or altering existing client engagement parameters.',
  },
  {
    id: 'action_edit_crm',
    category: 'Editing & Modification',
    label: 'Edit CRM Lead Statuses & Details',
    description: 'Prevents modifying CRM client details, pipeline stages, or follow-up notes.',
  },
  {
    id: 'action_template_edit',
    category: 'Editing & Modification',
    label: 'Master Scope & Clause Editing',
    description: 'Prevents modifying default deliverables, objectives, clauses, or standard fee templates.',
  },

  // 4. Financial & Commercials
  {
    id: 'commercial_values',
    category: 'Financial & Commercials',
    label: 'Total Commercial, Advance & Balance Amounts',
    description: 'Hides all commercial deal values, advance amounts, and post-delivery balances in CRM and Dashboard.',
  },
  {
    id: 'invoice_values',
    category: 'Financial & Commercials',
    label: 'Invoice Values & Billing Milestones',
    description: 'Hides invoice totals, GST calculations, and billing milestones across CRM and charters.',
  },
  {
    id: 'partner_commissions',
    category: 'Financial & Commercials',
    label: 'Partner Commissions & Payout Amounts',
    description: 'Hides commission percentages, net payouts, and partner margins in the LCE Commission Tracker.',
  },
  {
    id: 'engagement_pricing',
    category: 'Financial & Commercials',
    label: 'Service Engagement Pricing & Fee Schedules',
    description: 'Hides fee schedules, individual line item fees, and milestone payment splits in proposals.',
  },
  {
    id: 'kpi_revenue',
    category: 'Financial & Commercials',
    label: 'Dashboard KPI Revenue & Financial Cards',
    description: 'Hides top-line active revenue counters, collection metrics, and average ticket values.',
  },

  // 5. Client & Confidential Data
  {
    id: 'client_contacts',
    category: 'Client & Confidential Data',
    label: 'Client Phone Numbers & Personal Emails',
    description: 'Masks direct client phone numbers, WhatsApp links, and confidential contact email addresses.',
  },
  {
    id: 'private_remarks',
    category: 'Client & Confidential Data',
    label: 'Internal Remarks & Audit History Notes',
    description: 'Hides sensitive internal remarks, negotiation notes, and engagement audit timeline entries.',
  },
  {
    id: 'bank_details',
    category: 'Client & Confidential Data',
    label: 'Firm Bank Details & Payment QR Codes',
    description: 'Hides bank account numbers, IFSC codes, and payment QR codes from being viewed by this user.',
  },

  // 6. System Modules
  {
    id: 'module_crm',
    category: 'System Modules',
    label: 'Marketing CRM Module Access',
    description: 'Completely hides the Marketing CRM pipeline and lead directory from navigation.',
  },
  {
    id: 'module_lce',
    category: 'System Modules',
    label: 'LCE Commission Tracker Module Access',
    description: 'Completely hides the LCE Referral and Commission Tracker from navigation.',
  },
  {
    id: 'module_templates',
    category: 'System Modules',
    label: 'Master Templates Library Access',
    description: 'Hides the master service library, objectives, deliverables, and conditions manager.',
  },
  {
    id: 'module_trash',
    category: 'System Modules',
    label: 'Recycle Dustbin Access',
    description: 'Hides the recycle bin, preventing this person from seeing or restoring deleted items.',
  },
  {
    id: 'module_firm_settings',
    category: 'System Modules',
    label: 'Firm Settings & Letterhead Configuration',
    description: 'Prevents accessing firm configuration, letterhead styles, bank setup, and wallpapers.',
  },
  {
    id: 'module_taxonomies',
    category: 'System Modules',
    label: 'Custom Taxonomy Management',
    description: 'Prevents modifying custom stages, industries, status lists, and taxonomy values.',
  },
  {
    id: 'admin_user_management',
    category: 'System Modules',
    label: 'Admin User Management & Audit Security',
    description: 'Strictly restricts managing user accounts, passwords, security roles, and permission assignments.',
  },

  // 7. Export & Reporting
  {
    id: 'action_export',
    category: 'Export & Reporting',
    label: 'Excel & Word Data Export',
    description: 'Disables downloading or exporting client spreadsheets, CRM registries, and Word documents.',
  },
  {
    id: 'action_print',
    category: 'Export & Reporting',
    label: 'Print & PDF Export Capability',
    description: 'Disables printing or downloading client proposals as formatted PDF documents.',
  },
];

export interface PresetBundle {
  id: string;
  name: string;
  description: string;
  badge: string;
  restrictedItems: string[];
}

export const PRESET_RESTRICTION_BUNDLES: PresetBundle[] = [
  {
    id: 'full_admin',
    name: 'Full Unrestricted Access',
    description: 'Zero restrictions. Full control over creation, deletion, financials, and configurations.',
    badge: 'Admin',
    restrictedItems: [],
  },
  {
    id: 'associate_standard',
    name: 'Standard Associate (No Financials)',
    description: 'Can manage work and clients, but all commercial fees, revenue KPIs, and commissions are masked.',
    badge: 'Associate',
    restrictedItems: [
      'commercial_values',
      'invoice_values',
      'partner_commissions',
      'engagement_pricing',
      'kpi_revenue',
      'bank_details',
      'module_firm_settings',
      'module_taxonomies',
    ],
  },
  {
    id: 'safe_associate_no_delete',
    name: 'Restricted Associate (No Delete, No Financials, No Creation)',
    description: 'Work execution only. Cannot create new proposals, cannot delete any records, and cannot view financials.',
    badge: 'Restricted',
    restrictedItems: [
      'action_create_engagement',
      'action_create_crm_lead',
      'action_create_template',
      'action_delete',
      'action_delete_engagement',
      'action_delete_crm',
      'action_delete_template',
      'action_delete_trash',
      'commercial_values',
      'invoice_values',
      'partner_commissions',
      'engagement_pricing',
      'kpi_revenue',
      'bank_details',
      'module_firm_settings',
      'module_taxonomies',
      'action_export',
    ],
  },
  {
    id: 'viewer_readonly',
    name: 'Strict Read-Only Auditor',
    description: 'Zero modification. Cannot create, edit, delete, or export any records.',
    badge: 'Audit / Read-Only',
    restrictedItems: [
      'action_create_engagement',
      'action_create_crm_lead',
      'action_create_template',
      'action_delete',
      'action_delete_engagement',
      'action_delete_crm',
      'action_delete_template',
      'action_delete_trash',
      'action_edit_engagement',
      'action_edit_crm',
      'action_template_edit',
      'action_export',
      'module_firm_settings',
      'module_taxonomies',
      'commercial_values',
      'partner_commissions',
      'bank_details',
    ],
  },
];

/**
 * Check if a specific piece of information, module, or capability is restricted for a user.
 */
export function isRestricted(
  user: AppUser | null | undefined,
  itemKey: string,
  simulatedRole?: UserRole | string
): boolean {
  if (!user) return true;

  const role = simulatedRole || user.role;

  // STRICT SECURITY GUARD:
  // Admin user management is strictly for actual Admin users. A non-admin can NEVER access it.
  if (itemKey === 'admin_user_management' && role !== 'Admin') {
    return true;
  }

  // Check explicit individual user restriction list selected specifically by the Admin
  if (user.restrictedItems && Array.isArray(user.restrictedItems)) {
    if (user.restrictedItems.includes(itemKey)) {
      return true;
    }
    // Granular deletion fallback: if generic action_delete is restricted, all specific deletions are restricted
    if (
      user.restrictedItems.includes('action_delete') &&
      (itemKey === 'action_delete_engagement' ||
        itemKey === 'action_delete_crm' ||
        itemKey === 'action_delete_template' ||
        itemKey === 'action_delete_trash')
    ) {
      return true;
    }
    // Granular creation fallback
    if (
      user.restrictedItems.includes('action_create_engagement') &&
      itemKey === 'action_create_engagement'
    ) {
      return true;
    }
  }

  // If role is simulated or assigned as non-admin, apply role-based defaults for sensitive financial keys
  if (role !== 'Admin') {
    if (
      itemKey === 'commercial_values' ||
      itemKey === 'partner_commissions' ||
      itemKey === 'kpi_revenue'
    ) {
      return true;
    }
    if (itemKey === 'module_firm_settings' && role === 'Viewer') {
      return true;
    }
    if (role === 'Viewer') {
      if (
        itemKey === 'action_delete' ||
        itemKey === 'action_delete_engagement' ||
        itemKey === 'action_delete_crm' ||
        itemKey === 'action_delete_template' ||
        itemKey === 'action_delete_trash' ||
        itemKey === 'action_template_edit' ||
        itemKey === 'action_create_engagement' ||
        itemKey === 'action_create_crm_lead' ||
        itemKey === 'action_create_template' ||
        itemKey === 'action_edit_engagement' ||
        itemKey === 'action_edit_crm' ||
        itemKey === 'action_export'
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Helper to check if a user can see or execute a specific item/action
 */
export function canSee(
  user: AppUser | null | undefined,
  itemKey: string,
  simulatedRole?: UserRole | string
): boolean {
  return !isRestricted(user, itemKey, simulatedRole);
}
