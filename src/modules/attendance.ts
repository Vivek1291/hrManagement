import { defineModule, options } from './helpers';

export const attendance = defineModule({
  key: 'attendance',
  label: 'Attendance',
  path: '/attendance',
  icon: 'clock',
  group: 'Time & Attendance',
  disableDetail: true,
  search: true,
  endpoints: { list: '/attendance' },
  filters: [
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', placeholder: 'All', options: options('present', 'absent', 'late', 'half_day', 'on_leave') },
  ],
  columns: [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'checkIn', label: 'Check in' },
    { key: 'checkOut', label: 'Check out' },
    { key: 'workHours', label: 'Hours', type: 'number' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  actions: [
    { key: 'checkIn', label: 'Check in', scope: 'toolbar', variant: 'primary', icon: 'check', endpoint: { path: '/attendance/check-in', method: 'POST' }, successMessage: 'Checked in' },
    { key: 'checkOut', label: 'Check out', scope: 'toolbar', icon: 'logout', endpoint: { path: '/attendance/check-out', method: 'POST' }, successMessage: 'Checked out' },
    {
      key: 'regularize',
      label: 'Regularize',
      endpoint: { path: '/attendance/{id}/regularize', method: 'POST' },
      when: { status: ['absent', 'late', 'half_day'] },
      fields: [
        { name: 'checkIn', label: 'Actual check in', type: 'time', required: true },
        { name: 'checkOut', label: 'Actual check out', type: 'time', required: true },
        { name: 'reason', label: 'Reason', type: 'textarea', required: true },
      ],
      successMessage: 'Regularization request sent',
    },
  ],
});
