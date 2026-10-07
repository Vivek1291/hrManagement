import { crudEndpoints, defineModule, options } from './helpers';

export const recruitment = defineModule({
  key: 'recruitment',
  label: 'Job openings',
  path: '/recruitment',
  icon: 'user-plus',
  group: 'Talent',
  titleField: 'title',
  search: true,
  endpoints: crudEndpoints('/jobs'),
  filters: [{ name: 'status', label: 'Status', type: 'select', placeholder: 'All', options: options('open', 'on_hold', 'closed') }],
  columns: [
    { key: 'title', label: 'Position', sortable: true },
    { key: 'department', label: 'Department' },
    { key: 'location', label: 'Location' },
    { key: 'openings', label: 'Openings', type: 'number' },
    { key: 'candidateCount', label: 'Candidates', type: 'number' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { name: 'title', label: 'Position', required: true },
    { name: 'department', label: 'Department', type: 'select', optionsEndpoint: '/departments', optionLabelKey: 'name', optionValueKey: 'name' },
    { name: 'location', label: 'Location' },
    { name: 'employmentType', label: 'Employment type', type: 'select', options: options('full_time', 'part_time', 'contract', 'intern') },
    { name: 'openings', label: 'Openings', type: 'number', min: 1, defaultValue: 1 },
    { name: 'status', label: 'Status', type: 'select', defaultValue: 'open', options: options('open', 'on_hold', 'closed') },
    { name: 'description', label: 'Job description', type: 'textarea' },
  ],
  tabs: [
    {
      key: 'candidates',
      label: 'Candidates',
      endpoint: '/jobs/{id}/candidates',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'stage', label: 'Stage', type: 'badge' },
      ],
    },
  ],
});

export const candidates = defineModule({
  key: 'candidates',
  label: 'Candidates',
  path: '/candidates',
  icon: 'users',
  group: 'Talent',
  search: true,
  endpoints: crudEndpoints('/candidates'),
  filters: [{ name: 'stage', label: 'Stage', type: 'select', placeholder: 'All', options: options('applied', 'screening', 'interview', 'offer', 'hired', 'rejected') }],
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'jobTitle', label: 'Applied for' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'appliedAt', label: 'Applied', type: 'date', sortable: true },
    { key: 'stage', label: 'Stage', type: 'badge' },
  ],
  fields: [
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'jobId', label: 'Position', type: 'select', required: true, optionsEndpoint: '/jobs', optionLabelKey: 'title' },
    { name: 'stage', label: 'Stage', type: 'select', defaultValue: 'applied', options: options('applied', 'screening', 'interview', 'offer', 'hired', 'rejected') },
    { name: 'resume', label: 'Resume', type: 'file', showIn: ['create'] },
  ],
  actions: [
    {
      key: 'moveStage',
      label: 'Move stage',
      endpoint: { path: '/candidates/{id}/stage', method: 'POST' },
      when: { stage: ['applied', 'screening', 'interview', 'offer'] },
      fields: [{ name: 'stage', label: 'New stage', type: 'select', required: true, options: options('screening', 'interview', 'offer', 'hired', 'rejected') }],
      successMessage: 'Stage updated',
    },
  ],
});
