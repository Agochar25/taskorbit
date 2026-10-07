import { LABELS } from '@taskorbit/shared';
import { healthColor } from './ui.jsx';

/** One ring per project: arc length = progress, colour = health. */
export default function OrbitMap({ projects, completionRate }) {
  const rings = projects.slice(0, 6);
  const size = 300; const c = size / 2;
  return (
    <div className="orbit">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Project progress rings">
        {rings.map((p, i) => {
          const r = 132 - i * 20;
          const circ = 2 * Math.PI * r;
          const angle = (p.progress / 100) * 2 * Math.PI - Math.PI / 2;
          return (
            <g key={p.id}>
              <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
              {p.progress > 0 && (
                <circle cx={c} cy={c} r={r} fill="none" stroke={healthColor[p.health]} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${(p.progress / 100) * circ} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
              )}
              <circle cx={c + r * Math.cos(angle)} cy={c + r * Math.sin(angle)} r="5.5" fill="var(--paper)" stroke={healthColor[p.health]} strokeWidth="3" />
            </g>
          );
        })}
        <text x={c} y={c - 2} textAnchor="middle" className="orbit-num">{completionRate}%</text>
        <text x={c} y={c + 20} textAnchor="middle" className="orbit-sub">of tasks done</text>
      </svg>
      <ul className="orbit-legend">
        {rings.map((p) => (
          <li key={p.id}>
            <i style={{ background: healthColor[p.health] }} />
            <span className="grow">{p.name}</span>
            <span className="muted">{p.progress}% · {LABELS[p.health]}</span>
          </li>
        ))}
        {rings.length === 0 && <li className="muted">Create a project to see its ring here.</li>}
      </ul>
    </div>
  );
}
