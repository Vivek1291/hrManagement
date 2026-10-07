import { crudEndpoints, defineModule, options } from './helpers';

export const announcements = defineModule({
  key: 'announcements',
  label: 'Announcements',
  path: '/announcements',
  icon: 'megaphone',
  group: 'Organization',
  titleField: 'title',
  search: true,
  endpoints: crudEndpoints('/announcements'),
  columns: [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'audience', label: 'Audience' },
    { key: 'publishedAt', label: 'Published', type: 'date', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  detailFields: [
    { key: 'title', label: 'Title' },
    { key: 'audience', label: 'Audience' },
    { key: 'publishedAt', label: 'Published', type: 'datetime' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'message', label: 'Message' },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true, fullWidth: true },
    { name: 'audience', label: 'Audience', type: 'select', defaultValue: 'everyone', options: [{ label: 'Everyone', value: 'everyone' }, { label: 'Managers', value: 'managers' }] },
    { name: 'status', label: 'Status', type: 'select', defaultValue: 'published', options: options('draft', 'scheduled', 'published') },
    { name: 'publishedAt', label: 'Publish at', type: 'datetime-local' },
    { name: 'message', label: 'Message', type: 'textarea', required: true },
  ],
});
