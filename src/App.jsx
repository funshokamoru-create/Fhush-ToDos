import { useEffect, useMemo, useState } from 'react';
import {
  createTask, updateTask, toggleTask, deleteTask, clearCompleted,
  filterTasks, sortTasks, summarize, todayString,
} from './lib/tasks.js';
import { loadState, saveState } from './lib/storage.js';
import TaskForm from './components/TaskForm.jsx';
import TaskItem from './components/TaskItem.jsx';
import Toolbar from './components/Toolbar.jsx';

const initial = loadState();

export default function App() {
  const [tasks, setTasks] = useState(initial.tasks);
  const [theme, setTheme] = useState(initial.theme);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', query: '' });
  const [sortBy, setSortBy] = useState('created');
  const [toast, setToast] = useState('');

  useEffect(() => { saveState({ tasks, theme }); }, [tasks, theme]);

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const today = todayString();
  const stats = summarize(tasks, today);
  const visible = useMemo(
    () => sortTasks(filterTasks(tasks, filters, today), sortBy),
    [tasks, filters, sortBy, today]
  );

  const isDark = theme !== 'light';

  function handleAdd(input) {
    const res = createTask(tasks, input);
    if (res.task) { setTasks(res.tasks); setToast('Task added'); }
    return res.errors;
  }
  function handleUpdate(id, changes) {
    const res = updateTask(tasks, id, changes);
    if (res.task) { setTasks(res.tasks); setToast('Changes saved'); }
    return res.errors;
  }
  function handleToggle(id) { setTasks(toggleTask(tasks, id).tasks); }
  function handleDelete(id) { setTasks(deleteTask(tasks, id).tasks); setToast('Task deleted'); }
  function handleClearDone() {
    if (!stats.done) return;
    if (window.confirm(`Delete ${stats.done} completed task${stats.done > 1 ? 's' : ''}?`)) {
      setTasks(clearCompleted(tasks)); setToast('Completed tasks cleared');
    }
  }

  const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <h1 className="wordmark"><span className="w1">Fhush</span> <span>Todos</span></h1>
          <p className="tagline">Tasks, with room for your thoughts.</p>
        </div>

        <section className="stats" aria-label="Progress">
          <div className="ring" style={{ '--p': progress }} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" aria-label="Tasks completed">
            <span>{progress}%</span>
          </div>
          <dl className="stat-list">
            <div><dt>To do</dt><dd>{stats.active}</dd></div>
            <div><dt>Done</dt><dd>{stats.done}</dd></div>
            <div className={stats.overdue ? 'late' : ''}><dt>Overdue</dt><dd>{stats.overdue}</dd></div>
          </dl>
        </section>

        <Toolbar
          filters={filters}
          setFilters={setFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          stats={stats}
          onClearDone={handleClearDone}
        />

        <button
          className="theme-toggle"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? 'Switch to ivory' : 'Switch to black'}
        </button>
      </aside>

      <main className="main">
        <TaskForm onAdd={handleAdd} />

        <ul className="task-list">
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              today={today}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </ul>

        {visible.length === 0 && (
          <p className="empty">
            {tasks.length === 0
              ? 'No tasks yet. Add your first one above.'
              : 'Nothing matches these filters. Try clearing the search or picking "All".'}
          </p>
        )}

        <footer className="foot">Saved in this browser · Built with AI for HNG Stage 1</footer>
      </main>

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
