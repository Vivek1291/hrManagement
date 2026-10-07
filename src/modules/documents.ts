import { defineModule, options } from './helpers';

export const documents = defineModule({
  key: 'documents',
  label: 'Documents',
  path: '/documents',
  icon: 'folder',
  group: 'People',
  disableDetail: true,
  search: true,
  endpoints: {
    list: '/documents',
    create: { path: '/documents', method: 'POST' },
    delete: { path: '/documents/{id}', method: 'DELETE' },
  },
  filters: [{ name: 'category', label: 'Category', type: 'select', placeholder: 'All', options: options('policy', 'contract', 'id_proof', 'certificate', 'other') }],
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'employeeName', label: 'Employee' },
    { key: 'uploadedAt', label: 'Uploaded', type: 'date', sortable: true },
  ],
  fields: [
    { name: 'name', label: 'Document name', required: true },
    { name: 'category', label: 'Category', type: 'select', required: true, options: options('policy', 'contract', 'id_proof', 'certificate', 'other') },
    { name: 'employeeId', label: 'Employee', type: 'select', optionsEndpoint: '/employees', helpText: 'Leave empty for company-wide documents' },
    { name: 'file', label: 'File', type: 'file', required: true, fullWidth: true },
  ],
  actions: [{ key: 'download', label: 'Download', endpoint: '/documents/{id}/download', download: { filename: '{name}' } }],
});
