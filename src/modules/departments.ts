import { crudEndpoints, defineModule } from './helpers';

export const departments = defineModule({
  key: 'departments',
  label: 'Departments',
  path: '/departments',
  icon: 'building',
  group: 'Organization',
  search: true,
  endpoints: crudEndpoints('/departments'),
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code' },
    { key: 'head', label: 'Head' },
    { key: 'employeeCount', label: 'Employees', type: 'number', sortable: true },
  ],
  detailFields: [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'head', label: 'Head' },
    { key: 'employeeCount', label: 'Employees', type: 'number' },
    { key: 'description', label: 'Description' },
  ],
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'code', label: 'Code' },
    { name: 'head', label: 'Head of department', type: 'select', optionsEndpoint: '/employees', optionLabelKey: 'name', optionValueKey: 'name' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  tabs: [
    {
      key: 'members',
      label: 'Members',
      endpoint: '/departments/{id}/employees',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
    },
  ],
});
