import { crudEndpoints, defineModule, options } from './helpers';

export const performance = defineModule({
  key: 'performance',
  label: 'Performance reviews',
  path: '/performance',
  icon: 'target',
  group: 'Talent',
  titleField: 'employeeName',
  search: true,
  endpoints: crudEndpoints('/reviews'),
  filters: [{ name: 'cycle', label: 'Cycle', placeholder: 'e.g. 2026-H1' }],
  columns: [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'cycle', label: 'Cycle' },
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'rating', label: 'Rating', type: 'number', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  detailFields: [
    { key: 'employeeName', label: 'Employee' },
    { key: 'cycle', label: 'Cycle' },
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'strengths', label: 'Strengths' },
    { key: 'improvements', label: 'Areas to improve' },
  ],
  fields: [
    { name: 'employeeId', label: 'Employee', type: 'select', required: true, optionsEndpoint: '/employees' },
    { name: 'cycle', label: 'Cycle', required: true, placeholder: 'e.g. 2026-H1' },
    { name: 'reviewer', label: 'Reviewer', type: 'select', optionsEndpoint: '/employees', optionLabelKey: 'name', optionValueKey: 'name' },
    { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5 },
    { name: 'status', label: 'Status', type: 'select', defaultValue: 'draft', options: options('draft', 'submitted', 'completed') },
    { name: 'strengths', label: 'Strengths', type: 'textarea' },
    { name: 'improvements', label: 'Areas to improve', type: 'textarea' },
  ],
});
