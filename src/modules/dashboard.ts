import { defineModule } from './helpers';

export const dashboard = defineModule({
  key: 'dashboard',
  label: 'Dashboard',
  path: '/dashboard',
  icon: 'dashboard',
  type: 'dashboard',
  widgets: [
    { key: 'employees', type: 'stat', label: 'Employees', endpoint: '/employees', icon: 'users', color: 'blue', link: '/employees' },
    { key: 'presentToday', type: 'stat', label: 'Present today', endpoint: { path: '/attendance', query: { date: 'today', status: 'present' } }, icon: 'clock', color: 'green', link: '/attendance' },
    { key: 'pendingLeaves', type: 'stat', label: 'Pending leave requests', endpoint: { path: '/leaves', query: { status: 'pending' } }, icon: 'calendar', color: 'yellow', link: '/leaves' },
    { key: 'openJobs', type: 'stat', label: 'Open positions', endpoint: { path: '/jobs', query: { status: 'open' } }, icon: 'user-plus', color: 'purple', link: '/recruitment' },
    {
      key: 'recentLeaves',
      type: 'list',
      label: 'Recent leave requests',
      endpoint: '/leaves',
      link: '/leaves',
      columns: [
        { key: 'employeeName', label: 'Employee' },
        { key: 'type', label: 'Type' },
        { key: 'from', label: 'From', type: 'date' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
    },
    {
      key: 'upcomingHolidays',
      type: 'list',
      label: 'Upcoming holidays',
      endpoint: { path: '/holidays', query: { upcoming: true } },
      link: '/holidays',
      columns: [
        { key: 'name', label: 'Holiday' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'date', label: 'Day', type: 'weekday' },
      ],
    },
    {
      key: 'announcements',
      type: 'list',
      label: 'Announcements',
      endpoint: '/announcements',
      link: '/announcements',
      limit: 3,
      columns: [
        { key: 'title', label: 'Title' },
        { key: 'publishedAt', label: 'Published', type: 'date' },
      ],
    },
  ],
});
