import type { ModuleConfig } from './types';

/**
 * Ready-made HR modules. Use them as-is, override any part, or reference them from a
 * JSON config with `{ "preset": "employees", "endpoints": { "list": "/staff" } }`.
 */
export const presets = {
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    type: 'dashboard',
    widgets: [
      { key: 'employees', type: 'stat', label: 'Employees', endpoint: '/employees', icon: 'users', color: 'blue', link: '/employees' },
      { key: 'departments', type: 'stat', label: 'Departments', endpoint: '/departments', icon: 'building', color: 'purple', link: '/departments' },
      { key: 'pendingLeaves', type: 'stat', label: 'Pending leave requests', endpoint: { path: '/leaves', query: { status: 'pending' } }, icon: 'calendar', color: 'yellow', link: '/leaves' },
      {
        key: 'recentLeaves',
        type: 'list',
        label: 'Recent leave requests',
        endpoint: '/leaves',
        link: '/leaves',
        columns: [
          { key: 'employeeName', label: 'Employee' },
          { key: 'type', label: 'Type' },
          { key: 'status', label: 'Status', type: 'badge' },
        ],
      },
    ],
  },
  employees: {
    key: 'employees',
    label: 'Employees',
    path: '/employees',
    icon: 'users',
    titleField: 'name',
    search: true,
    endpoints: {
      list: '/employees',
      get: '/employees/{id}',
      create: { path: '/employees', method: 'POST' },
      update: { path: '/employees/{id}', method: 'PUT' },
      delete: { path: '/employees/{id}', method: 'DELETE' },
    },
    columns: [
      { key: 'employeeCode', label: 'Emp. ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'department', label: 'Department', sortable: true },
      { key: 'designation', label: 'Designation' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    detailFields: [
      { key: 'employeeCode', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'joiningDate', label: 'Joining date', type: 'date' },
      { key: 'salary', label: 'Annual salary', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    fields: [
      { name: 'employeeCode', label: 'Employee ID', required: true },
      { name: 'name', label: 'Full name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'department', label: 'Department', type: 'select', optionsEndpoint: '/departments', optionLabelKey: 'name', optionValueKey: 'name' },
      { name: 'designation', label: 'Designation' },
      { name: 'joiningDate', label: 'Joining date', type: 'date' },
      { name: 'salary', label: 'Annual salary', type: 'number', min: 0 },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        defaultValue: 'active',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'On leave', value: 'on_leave' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ],
    tabs: [
      {
        key: 'payslips',
        label: 'Payslips',
        endpoint: '/employees/{id}/payslips',
        columns: [
          { key: 'period', label: 'Period' },
          { key: 'netPay', label: 'Net pay', type: 'currency' },
          { key: 'status', label: 'Status', type: 'badge' },
        ],
        actions: [
          { key: 'download', label: 'PDF', endpoint: '/payslips/{id}/download', download: { filename: 'payslip-{period}.pdf' } },
        ],
      },
      {
        key: 'leaves',
        label: 'Leaves',
        endpoint: '/employees/{id}/leaves',
        columns: [
          { key: 'type', label: 'Type' },
          { key: 'from', label: 'From', type: 'date' },
          { key: 'to', label: 'To', type: 'date' },
          { key: 'status', label: 'Status', type: 'badge' },
        ],
      },
    ],
  },
  departments: {
    key: 'departments',
    label: 'Departments',
    path: '/departments',
    icon: 'building',
    search: true,
    endpoints: {
      list: '/departments',
      get: '/departments/{id}',
      create: '/departments',
      update: '/departments/{id}',
      delete: '/departments/{id}',
    },
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'head', label: 'Head' },
      { key: 'employeeCount', label: 'Employees', type: 'number', sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'head', label: 'Head of department' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  attendance: {
    key: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: 'clock',
    disableDetail: true,
    search: true,
    endpoints: { list: '/attendance' },
    filters: [
      { name: 'date', label: 'Date', type: 'date' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'All',
        options: [
          { label: 'Present', value: 'present' },
          { label: 'Absent', value: 'absent' },
          { label: 'Late', value: 'late' },
          { label: 'On leave', value: 'on_leave' },
        ],
      },
    ],
    columns: [
      { key: 'employeeName', label: 'Employee', sortable: true },
      { key: 'date', label: 'Date', type: 'date', sortable: true },
      { key: 'checkIn', label: 'Check in' },
      { key: 'checkOut', label: 'Check out' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
  },
  leaves: {
    key: 'leaves',
    label: 'Leave requests',
    path: '/leaves',
    icon: 'calendar',
    search: true,
    endpoints: {
      list: '/leaves',
      get: '/leaves/{id}',
      create: '/leaves',
    },
    filters: [
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'All',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    ],
    columns: [
      { key: 'employeeName', label: 'Employee', sortable: true },
      { key: 'type', label: 'Type' },
      { key: 'from', label: 'From', type: 'date', sortable: true },
      { key: 'to', label: 'To', type: 'date' },
      { key: 'days', label: 'Days', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    detailFields: [
      { key: 'employeeName', label: 'Employee' },
      { key: 'type', label: 'Type' },
      { key: 'from', label: 'From', type: 'date' },
      { key: 'to', label: 'To', type: 'date' },
      { key: 'days', label: 'Days', type: 'number' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'remarks', label: 'Remarks' },
    ],
    fields: [
      { name: 'employeeId', label: 'Employee', type: 'select', required: true, optionsEndpoint: '/employees' },
      {
        name: 'type',
        label: 'Leave type',
        type: 'select',
        required: true,
        options: [
          { label: 'Casual', value: 'casual' },
          { label: 'Sick', value: 'sick' },
          { label: 'Earned', value: 'earned' },
          { label: 'Unpaid', value: 'unpaid' },
        ],
      },
      { name: 'from', label: 'From', type: 'date', required: true },
      { name: 'to', label: 'To', type: 'date', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea' },
    ],
    actions: [
      { key: 'approve', label: 'Approve', variant: 'primary', icon: 'check', endpoint: { path: '/leaves/{id}/approve', method: 'POST' }, when: { status: 'pending' }, successMessage: 'Leave approved' },
      {
        key: 'reject',
        label: 'Reject',
        variant: 'danger',
        icon: 'x',
        endpoint: { path: '/leaves/{id}/reject', method: 'POST' },
        when: { status: 'pending' },
        fields: [{ name: 'remarks', label: 'Reason for rejection', type: 'textarea', required: true }],
        successMessage: 'Leave rejected',
      },
    ],
  },
  payslips: {
    key: 'payslips',
    label: 'Payslips',
    path: '/payslips',
    icon: 'file',
    search: true,
    titleField: 'period',
    endpoints: {
      list: '/payslips',
      get: '/payslips/{id}',
    },
    filters: [{ name: 'month', label: 'Month', type: 'text', placeholder: 'YYYY-MM' }],
    columns: [
      { key: 'employeeName', label: 'Employee', sortable: true },
      { key: 'period', label: 'Period', sortable: true },
      { key: 'grossPay', label: 'Gross', type: 'currency' },
      { key: 'deductions', label: 'Deductions', type: 'currency' },
      { key: 'netPay', label: 'Net pay', type: 'currency', sortable: true },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    actions: [
      { key: 'download', label: 'Download', endpoint: '/payslips/{id}/download', download: { filename: 'payslip-{employeeName}-{period}.pdf' } },
      { key: 'generate', label: 'Run payroll', scope: 'toolbar', variant: 'primary', icon: 'money', endpoint: { path: '/payroll/run', method: 'POST' }, fields: [{ name: 'month', label: 'Month', type: 'text', placeholder: 'YYYY-MM', required: true }], successMessage: 'Payroll started' },
    ],
  },
} satisfies Record<string, ModuleConfig>;

export type PresetName = keyof typeof presets;

/** Merge a preset with your overrides. `endpoints` are merged key by key; arrays are replaced. */
export function preset(name: PresetName, overrides: Partial<ModuleConfig> = {}): ModuleConfig {
  const base = presets[name] as ModuleConfig;
  if (!base) throw new Error(`Unknown HR preset "${name}"`);
  return {
    ...base,
    ...overrides,
    endpoints: { ...base.endpoints, ...overrides.endpoints },
  };
}
