// Freelance actions — timers, todos, expenses
export default [
  {
    type: 'timer-start',
    title: 'Start Timer',
    desc: 'Start a task timer and save state in memory',
    icon: 'play-circle',
    color: '#32D74B',
    outputType: 'text',
    defaults: { taskName: '{{result}}' },
    params: [
      { name: 'taskName', label: 'Task Name', kind: 'text', placeholder: 'Project Development', acceptsVars: true },
    ],
  },
  {
    type: 'timer-stop',
    title: 'Stop Timer',
    desc: 'Stop the active timer and return the duration',
    icon: 'stop-circle',
    color: '#FF453A',
    outputType: 'text',
    defaults: {},
    params: [],
  },
  {
    type: 'todo-add',
    title: 'Add To-Do',
    desc: 'Add a task to your local freelance to-do list',
    icon: 'check-square',
    color: '#0A84FF',
    outputType: 'text',
    defaults: { task: '{{result}}', priority: 'medium' },
    params: [
      { name: 'task', label: 'Task description', kind: 'text', placeholder: 'Send invoice', acceptsVars: true },
      {
        name: 'priority',
        label: 'Priority',
        kind: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
    ],
  },
  {
    type: 'todo-list',
    title: 'List To-Dos',
    desc: 'Returns the current to-do list as text',
    icon: 'list-todo',
    color: '#0A84FF',
    outputType: 'text',
    defaults: { status: 'pending' },
    params: [
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'completed', label: 'Completed' },
          { value: 'all', label: 'All' },
        ],
      },
    ],
  },
  {
    type: 'expense-log',
    title: 'Log Expense',
    desc: 'Record a business expense',
    icon: 'dollar-sign',
    color: '#FF9F0A',
    outputType: 'text',
    defaults: { amount: '{{result}}', category: 'Software', description: '' },
    params: [
      { name: 'amount', label: 'Amount', kind: 'text', placeholder: '19.99', acceptsVars: true },
      { name: 'category', label: 'Category', kind: 'text', placeholder: 'Subcription', acceptsVars: true },
      { name: 'description', label: 'Description', kind: 'text', placeholder: 'ChatGPT Plus', acceptsVars: true },
    ],
  },
]
