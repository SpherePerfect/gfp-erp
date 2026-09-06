import { CustomTaxonomyConfig } from '../types';

const TAXONOMY_STORAGE_KEY = 'ca_crm_custom_taxonomy_v1';

export const DEFAULT_TAXONOMY: CustomTaxonomyConfig = {
  assignmentStatuses: [
    'Lead Identified',
    'In Discussion',
    'Proposal / EL Sent',
    'EL Signed & Active',
    'Data Collection',
    'Under Execution',
    'Draft Review',
    'Final Delivery',
    'Closed Won',
    'On Hold',
    'Dropped / Lost',
  ],
  priorities: ['Urgent', 'High', 'Medium', 'Low'],
  advanceStatuses: ['Received', 'Partially Received', 'Pending', 'Overdue', 'Waived'],
  postDeliveryStatuses: ['Pending', 'Invoiced', 'Partially Received', 'Fully Received', 'Not Due Yet'],
  finalStatuses: [
    'Active / In Progress',
    'Successfully Completed',
    'Converted to Retainer',
    'Delayed',
    'Terminated',
  ],
  postCompletionStatuses: [
    'Pending Completion',
    'Pitched',
    'In Discussion',
    'Closed Won',
    'Not Interested',
  ],
  whatsappGroupStatuses: ['Yes', 'No', 'Pending'],
  elStatuses: ['Draft', 'Sent', 'Signed', 'Not Required'],
};

export function getStoredTaxonomy(): CustomTaxonomyConfig {
  try {
    const raw = localStorage.getItem(TAXONOMY_STORAGE_KEY);
    if (!raw) return DEFAULT_TAXONOMY;
    const parsed = JSON.parse(raw);
    return {
      assignmentStatuses: parsed.assignmentStatuses?.length ? parsed.assignmentStatuses : DEFAULT_TAXONOMY.assignmentStatuses,
      priorities: parsed.priorities?.length ? parsed.priorities : DEFAULT_TAXONOMY.priorities,
      advanceStatuses: parsed.advanceStatuses?.length ? parsed.advanceStatuses : DEFAULT_TAXONOMY.advanceStatuses,
      postDeliveryStatuses: parsed.postDeliveryStatuses?.length ? parsed.postDeliveryStatuses : DEFAULT_TAXONOMY.postDeliveryStatuses,
      finalStatuses: parsed.finalStatuses?.length ? parsed.finalStatuses : DEFAULT_TAXONOMY.finalStatuses,
      postCompletionStatuses: parsed.postCompletionStatuses?.length ? parsed.postCompletionStatuses : DEFAULT_TAXONOMY.postCompletionStatuses,
      whatsappGroupStatuses: parsed.whatsappGroupStatuses?.length ? parsed.whatsappGroupStatuses : DEFAULT_TAXONOMY.whatsappGroupStatuses,
      elStatuses: parsed.elStatuses?.length ? parsed.elStatuses : DEFAULT_TAXONOMY.elStatuses,
    };
  } catch (err) {
    console.error('Error reading taxonomy from localStorage:', err);
    return DEFAULT_TAXONOMY;
  }
}

export function saveTaxonomy(config: CustomTaxonomyConfig): void {
  try {
    localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving taxonomy to localStorage:', err);
  }
}
