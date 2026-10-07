import { crudEndpoints, defineModule } from './helpers';

export const designations = defineModule({
  key: 'designations',
  label: 'Designations',
  path: '/designations',
  icon: 'award',
  group: 'Organization',
  titleField: 'title',
  search: true,
  endpoints: crudEndpoints('/designations'),
  columns: [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'level', label: 'Level', sortable: true },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'department', label: 'Department', type: 'select', optionsEndpoint: '/departments', optionLabelKey: 'name', optionValueKey: 'name' },
    { name: 'level', label: 'Level', placeholder: 'e.g. L3' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
});
