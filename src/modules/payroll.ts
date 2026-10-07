import { defineModule } from './helpers';

export const payroll = defineModule({
  key: 'payroll',
  label: 'Payroll runs',
  path: '/payroll',
  icon: 'money',
  group: 'Payroll',
  titleField: 'period',
  endpoints: { list: '/payroll-runs', get: '/payroll-runs/{id}' },
  columns: [
    { key: 'period', label: 'Period', sortable: true },
    { key: 'employeeCount', label: 'Employees', type: 'number' },
    { key: 'totalGross', label: 'Gross', type: 'currency' },
    { key: 'totalNet', label: 'Net', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  actions: [
    {
      key: 'run',
      label: 'Run payroll',
      scope: 'toolbar',
      variant: 'primary',
      icon: 'money',
      endpoint: { path: '/payroll-runs', method: 'POST' },
      fields: [{ name: 'period', label: 'Month', type: 'text', placeholder: 'YYYY-MM', pattern: '\\d{4}-\\d{2}', required: true }],
      successMessage: 'Payroll run created',
    },
    { key: 'finalize', label: 'Finalize', variant: 'primary', icon: 'check', endpoint: { path: '/payroll-runs/{id}/finalize', method: 'POST' }, when: { status: 'draft' }, confirm: 'Finalize payroll for {period}? Payslips will be generated.', successMessage: 'Payroll finalized' },
    { key: 'markPaid', label: 'Mark paid', endpoint: { path: '/payroll-runs/{id}/mark-paid', method: 'POST' }, when: { status: 'processed' }, confirm: 'Mark payroll for {period} as paid?', successMessage: 'Marked as paid' },
  ],
  tabs: [
    {
      key: 'payslips',
      label: 'Payslips',
      endpoint: '/payroll-runs/{id}/payslips',
      columns: [
        { key: 'employeeName', label: 'Employee' },
        { key: 'grossPay', label: 'Gross', type: 'currency' },
        { key: 'deductions', label: 'Deductions', type: 'currency' },
        { key: 'netPay', label: 'Net pay', type: 'currency' },
      ],
    },
  ],
});
