import { useState } from 'react';
import { LABELS, TASK_STATUS, dueState, formatDate } from '@taskorbit/shared';
import { PriorityBadge } from './ui.jsx';

/** Drag a card to another column to change its status (HTML5 drag & drop). */
export default function KanbanBoard({ tasks, onStatus, onEdit }) {
  const [over, setOver] = useState(null);
  return (
    <div className="board">
      {TASK_STATUS.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className={`column col-${status} ${over === status ? 'column-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(status); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault(); setOver(null);
              const task = tasks.find((t) => t.id === e.dataTransfer.getData('text/plain'));
              if (task && task.status !== status) onStatus(task, status);
            }}>
            <h3><i className="col-dot" />{LABELS[status]} <span className="count">{items.length}</span></h3>
            {items.map((t) => (
              <article key={t.id} className="card-task" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)} onClick={() => onEdit(t)}>
                <strong>{t.name}</strong>
                <div className="task-meta">
                  <PriorityBadge value={t.priority} />
                  {t.dueDate && <span className={`due due-${dueState(t.dueDate, t.status)}`}>{formatDate(t.dueDate)}</span>}
                </div>
              </article>
            ))}
            {items.length === 0 && <p className="muted small">Drop tasks here</p>}
          </section>
        );
      })}
    </div>
  );
}
