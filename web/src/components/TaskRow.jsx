import { Link } from 'react-router-dom';
import { LABELS, TASK_STATUS, dueState, formatDate } from '@taskorbit/shared';
import { PriorityBadge } from './ui.jsx';

const dueText = { overdue: 'Overdue', today: 'Due today', tomorrow: 'Due tomorrow' };

export default function TaskRow({ task, showProject, onToggle, onStatus, onEdit, onDelete }) {
  const done = task.status === 'COMPLETED';
  const due = dueState(task.dueDate, task.status);
  return (
    <li className={`task p-${task.priority} ${done ? 'task-done' : ''}`}>
      <input type="checkbox" className="check" checked={done} onChange={() => onToggle(task)} aria-label={done ? `Reopen ${task.name}` : `Mark ${task.name} as completed`} />
      <div className="task-main">
        <strong>{task.name}</strong>
        {task.description && <p className="muted clamp">{task.description}</p>}
        <div className="task-meta">
          <PriorityBadge value={task.priority} />
          {task.dueDate && <span className={`due due-${due}`}>{dueText[due] ? `${dueText[due]} · ` : 'Due '}{formatDate(task.dueDate)}</span>}
          {showProject && <Link className="muted" to={`/projects/${task.project.id}`}>{task.project.name}</Link>}
        </div>
      </div>
      <select className="select-sm" value={task.status} onChange={(e) => onStatus(task, e.target.value)} aria-label={`Status for ${task.name}`}>
        {TASK_STATUS.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
      </select>
      <div className="row-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn btn-ghost btn-sm danger-text" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </li>
  );
}
