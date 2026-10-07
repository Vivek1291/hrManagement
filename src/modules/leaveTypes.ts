import { crudEndpoints, defineModule } from './helpers';

export const leaveTypes = defineModule({
  key: 'leaveTypes',
  label: 'Leave types',
  path: '/leave-types',
  icon: 'tag',
  group: 'Time & Attendance',
  disableDetail: true,
  endpoints: crudEndpoints('/leave-types'),
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code' },
    { key: 'daysPerYear', label: 'Days / year', type: 'number' },
    { key: 'paid', label: 'Paid', type: 'boolean' },
    { key: 'carryForward', label: 'Carry forward', type: 'boolean' },
  ],
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'code', label: 'Code', required: true },
    { name: 'daysPerYear', label: 'Days per year', type: 'number', min: 0, required: true },
    { name: 'maxConsecutiveDays', label: 'Max consecutive days', type: 'number', min: 0 },
    { name: 'paid', label: 'Paid leave', type: 'checkbox', defaultValue: true },
    { name: 'carryForward', label: 'Carry forward unused days', type: 'checkbox' },
  ],
});
