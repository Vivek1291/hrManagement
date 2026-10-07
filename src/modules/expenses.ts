import { defineModule, options } from './helpers';

export const expenses = defineModule({
  key: 'expenses',
  label: 'Expenses',
  path: '/expenses',
  icon: 'receipt',
  group: 'Payroll',
  titleField: 'title',
  search: true,
  endpoints: {
    list: '/expenses',
    get: '/expenses/{id}',
    create: { path: '/expenses', method: 'POST' },
  },
  filters: [{ name: 'status', label: 'Status', type: 'select', placeholder: 'All', options: options('submitted', 'approved', 'rejected', 'reimbursed') }],
  columns: [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'amount', label: 'Amount', type: 'currency', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { name: 'employeeId', label: 'Employee', type: 'select', required: true, optionsEndpoint: '/employees' },
    { name: 'title', label: 'Title', required: true },
    { name: 'category', label: 'Category', type: 'select', required: true, options: options('travel', 'meals', 'equipment', 'training', 'other') },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'amount', label: 'Amount', type: 'number', min: 0, required: true },
    { name: 'receipt', label: 'Receipt', type: 'file', showIn: ['create'] },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  actions: [
    { key: 'approve', label: 'Approve', variant: 'primary', icon: 'check', endpoint: { path: '/expenses/{id}/approve', method: 'POST' }, when: { status: 'submitted' }, successMessage: 'Expense approved' },
    { key: 'reject', label: 'Reject', variant: 'danger', icon: 'x', endpoint: { path: '/expenses/{id}/reject', method: 'POST' }, when: { status: 'submitted' }, fields: [{ name: 'remarks', label: 'Reason', type: 'textarea', required: true }] },
    { key: 'reimburse', label: 'Mark reimbursed', endpoint: { path: '/expenses/{id}/reimburse', method: 'POST' }, when: { status: 'approved' }, successMessage: 'Marked as reimbursed' },
  ],
});
