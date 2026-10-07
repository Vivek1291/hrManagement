import { crudEndpoints, defineModule, options } from './helpers';

export const holidays = defineModule({
  key: 'holidays',
  label: 'Holidays',
  path: '/holidays',
  icon: 'star',
  group: 'Time & Attendance',
  disableDetail: true,
  search: true,
  pagination: { mode: 'client', pageSize: 20 },
  endpoints: crudEndpoints('/holidays'),
  filters: [
    { name: 'year', label: 'Year', type: 'number', placeholder: String(new Date().getFullYear()) },
    { name: 'type', label: 'Type', type: 'select', placeholder: 'All', options: options('public', 'optional', 'company') },
  ],
  columns: [
    { key: 'name', label: 'Holiday', sortable: true },
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'date', label: 'Day', type: 'weekday' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'location', label: 'Location' },
  ],
  fields: [
    { name: 'name', label: 'Holiday name', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'type', label: 'Type', type: 'select', defaultValue: 'public', options: options('public', 'optional', 'company') },
    { name: 'location', label: 'Applies to location', placeholder: 'All locations' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
});
