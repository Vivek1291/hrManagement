import { crudEndpoints, defineModule } from './helpers';

export const shifts = defineModule({
  key: 'shifts',
  label: 'Shifts',
  path: '/shifts',
  icon: 'sun',
  group: 'Time & Attendance',
  disableDetail: true,
  endpoints: crudEndpoints('/shifts'),
  columns: [
    { key: 'name', label: 'Shift', sortable: true },
    { key: 'startTime', label: 'Starts' },
    { key: 'endTime', label: 'Ends' },
    { key: 'graceMinutes', label: 'Grace (min)', type: 'number' },
    { key: 'workingDays', label: 'Working days' },
  ],
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'startTime', label: 'Start time', type: 'time', required: true },
    { name: 'endTime', label: 'End time', type: 'time', required: true },
    { name: 'graceMinutes', label: 'Grace period (minutes)', type: 'number', min: 0, defaultValue: 15 },
    { name: 'workingDays', label: 'Working days', placeholder: 'Mon-Fri', fullWidth: true },
  ],
});
