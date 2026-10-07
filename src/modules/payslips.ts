import { defineModule } from './helpers';

export const payslips = defineModule({
  key: 'payslips',
  label: 'Payslips',
  path: '/payslips',
  icon: 'file',
  group: 'Payroll',
  search: true,
  titleField: 'period',
  endpoints: { list: '/payslips', get: '/payslips/{id}' },
  filters: [{ name: 'period', label: 'Month', type: 'text', placeholder: 'YYYY-MM' }],
  columns: [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'grossPay', label: 'Gross', type: 'currency' },
    { key: 'deductions', label: 'Deductions', type: 'currency' },
    { key: 'netPay', label: 'Net pay', type: 'currency', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  detailFields: [
    { key: 'employeeName', label: 'Employee' },
    { key: 'period', label: 'Period' },
    { key: 'basic', label: 'Basic', type: 'currency' },
    { key: 'allowances', label: 'Allowances', type: 'currency' },
    { key: 'grossPay', label: 'Gross pay', type: 'currency' },
    { key: 'tax', label: 'Tax', type: 'currency' },
    { key: 'deductions', label: 'Total deductions', type: 'currency' },
    { key: 'netPay', label: 'Net pay', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  actions: [{ key: 'download', label: 'Download', endpoint: '/payslips/{id}/download', download: { filename: 'payslip-{employeeName}-{period}.pdf' } }],
});
