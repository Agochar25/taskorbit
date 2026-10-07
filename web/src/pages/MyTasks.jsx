import TasksPanel from '../components/TasksPanel.jsx';

export default function MyTasks() {
  return (
    <div className="page">
      <header className="page-head"><div><h1>My tasks</h1><p className="muted">Every task across all your projects.</p></div></header>
      <TasksPanel />
    </div>
  );
}
