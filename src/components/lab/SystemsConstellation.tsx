'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PORTFOLIO_PROJECTS } from '@/lib/projects';
import { chronologicalProjects } from '@/lib/project-editorial';
import { skyPalette } from '@/lib/sky';

const PROJECTS = chronologicalProjects(PORTFOLIO_PROJECTS);
const GROUPS = ['Web', 'Applications', 'Automation'];
const nodes = PROJECTS.map((project, i) => {
  const group = project.categories.includes('automation') ? 2 : project.categories.includes('webapp') ? 1 : 0;
  const angle = i * 2.399963;
  const radius = .23 + (i % 5) * .065;
  return { x: Math.cos(angle) * radius + (group - 1) * .52, y: Math.sin(angle) * radius, z: Math.sin(i * 1.7) * .38, group };
});

export default function SystemsConstellation({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef({ rotation: -.2, tilt: .18, velocity: 0, selected: 0, pointer: null as { x: number; y: number; moved: number } | null, points: [] as { x: number; y: number; index: number }[], redraw: () => {} });
  const select = (index: number) => { setActive(index); scene.current.selected = index; scene.current.redraw(); };
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const state = scene.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, visible = false, width = 0, height = 0;
    const paint = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const reduced = motion.matches;
      if (!state.pointer && !reduced && Math.abs(state.velocity) > .0001) { state.rotation += state.velocity; state.velocity *= .93; }
      const t = Number(getComputedStyle(document.documentElement).getPropertyValue('--sky-t')) || 0;
      const palette = skyPalette(t);
      ctx.clearRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, width * .55);
      glow.addColorStop(0, `rgba(${palette.mid.join(',')},.38)`); glow.addColorStop(1, 'rgba(8,12,20,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      const scale = Math.min(width * .39, height * .92);
      // ponytail: 720 deterministic dust points, rendered only on interaction; use WebGL if this becomes a continuously animated scene.
      for (let i = 0; i < 720; i++) {
        const group = i % 3;
        const radius = Math.sqrt(((i * 73) % 719) / 719) * .48;
        const angle = i * 2.399963 + radius * 5;
        const nx = (group - 1) * .52 + Math.cos(angle) * radius;
        const ny = Math.sin(angle) * radius * .65;
        const nz = Math.sin(i * 13.7) * radius * .35;
        const x = nx * Math.cos(state.rotation) - nz * Math.sin(state.rotation);
        const z = nx * Math.sin(state.rotation) + nz * Math.cos(state.rotation);
        const y = ny * Math.cos(state.tilt) - z * Math.sin(state.tilt);
        const depth = 1 / (1.8 - z * .45);
        const px = width / 2 + x * scale * depth * 1.5;
        const py = height / 2 + y * scale * depth * 1.5;
        ctx.fillStyle = `rgba(${i % 5 ? palette.cloudLit.join(',') : '218,229,255'},${.12 + (1 - radius / .48) * .5})`;
        ctx.beginPath(); ctx.arc(px, py, i % 13 === 0 ? 1.5 : .65, 0, Math.PI * 2); ctx.fill();
      }
      const projected = nodes.map((node, index) => {
        const x = node.x * Math.cos(state.rotation) - node.z * Math.sin(state.rotation);
        const z = node.x * Math.sin(state.rotation) + node.z * Math.cos(state.rotation);
        const y = node.y * Math.cos(state.tilt) - z * Math.sin(state.tilt);
        const depth = 1 / (1.8 - z * .45);
        return { x: width / 2 + x * scale * depth * 1.5, y: height / 2 + y * scale * depth * 1.5, depth, index, group: node.group };
      });
      // Decorative stars are deterministic; the only interactive dots are the labelled projects.
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(240,235,228,${.12 + (i % 4) * .055})`;
        ctx.fillRect(((i * 137.51) % 997) / 997 * width, ((i * 79.13) % 487) / 487 * height, i % 9 === 0 ? 2 : 1, 1);
      }
      projected.forEach((point, i) => {
        const previous = projected.slice(0, i).reverse().find(p => p.group === point.group);
        if (previous) { ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(point.x, point.y); ctx.strokeStyle = `rgba(${palette.cloudLit.join(',')},.16)`; ctx.lineWidth = .6; ctx.stroke(); }
      });
      projected.sort((a, b) => a.depth - b.depth).forEach(point => {
        const selected = point.index === state.selected;
        const r = selected ? 6 : 2.5 + point.depth * 2;
        ctx.shadowColor = `rgb(${palette.cloudLit.join(',')})`; ctx.shadowBlur = selected ? 25 : 10;
        ctx.fillStyle = selected ? '#fff9ee' : `rgba(${palette.cloudLit.join(',')},${Math.min(1, point.depth + .25)})`;
        ctx.beginPath(); ctx.arc(point.x, point.y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        if (selected) {
          ctx.beginPath(); ctx.arc(point.x, point.y, 15, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,249,238,.65)'; ctx.stroke();
          ctx.fillStyle = '#fff9ee'; ctx.font = '12px monospace';
          const text = PROJECTS[point.index].name;
          const textWidth = ctx.measureText(text).width;
          ctx.fillText(text, Math.max(12, Math.min(width - textWidth - 12, point.x + 22)), Math.max(22, point.y - 18));
        }
      });
      state.points = projected;
      el.dataset.renderState = reduced ? 'static' : 'settled';
      if (!reduced && !state.pointer && Math.abs(state.velocity) > .0001) { frame = requestAnimationFrame(paint); el.dataset.renderState = 'settling'; }
    };
    const redraw = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(paint); };
    state.redraw = redraw;
    const resize = new ResizeObserver(() => {
      const box = el.getBoundingClientRect(); width = box.width; height = box.height;
      const dpr = Math.min(devicePixelRatio, 2); el.width = Math.round(width * dpr); el.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
    });
    resize.observe(el);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) redraw(); else { cancelAnimationFrame(frame); frame = 0; el.dataset.renderState = 'paused'; } });
    observer.observe(el);
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; el.dataset.renderState = 'paused'; } else redraw(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('scroll', redraw, { passive: true });
    motion.addEventListener('change', redraw);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('scroll', redraw); motion.removeEventListener('change', redraw); state.redraw = () => {}; };
  }, []);
  const project = PROJECTS[active];
  return <div className={`constellation ${compact ? 'is-compact' : ''}`}>
    <div className="constellation-universe">
      <div className="constellation-heading mono"><span>Field / {PROJECTS.length} connected systems</span><span>Dawn → dusk</span></div>
      <canvas ref={canvas} aria-label="Systems constellation. Drag to rotate, use arrow keys to select a project, Enter to focus its case-study link." tabIndex={0}
        onKeyDown={event => { if (event.key.startsWith('Arrow')) { event.preventDefault(); select((active + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + PROJECTS.length) % PROJECTS.length); } if (event.key === 'Enter') document.getElementById(`constellation-link-${compact ? 'compact' : 'full'}`)?.focus(); }}
        onPointerDown={event => { scene.current.pointer = { x: event.clientX, y: event.clientY, moved: 0 }; scene.current.velocity = 0; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { const p = scene.current.pointer; if (!p) return; const dx = event.clientX - p.x; const dy = event.clientY - p.y; p.moved += Math.abs(dx) + Math.abs(dy); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { scene.current.rotation += dx * .006; scene.current.tilt = Math.max(-.7, Math.min(.7, scene.current.tilt + dy * .004)); scene.current.velocity = dx * .003; } p.x = event.clientX; p.y = event.clientY; scene.current.redraw(); }}
        onPointerUp={event => { const p = scene.current.pointer; if (p && p.moved < 8) { const box = event.currentTarget.getBoundingClientRect(); const near = scene.current.points.map(point => ({ ...point, distance: Math.hypot(point.x - (event.clientX - box.left), point.y - (event.clientY - box.top)) })).sort((a, b) => a.distance - b.distance)[0]; if (near && near.distance < 28) select(near.index); } scene.current.pointer = null; scene.current.redraw(); }}
        onPointerCancel={() => { scene.current.pointer = null; scene.current.velocity = 0; }} />
      <div className="constellation-caption mono"><span>Drag to explore · select a star</span><button type="button" onClick={() => { scene.current.rotation = -.2; scene.current.tilt = .18; scene.current.velocity = 0; select(0); }}>Reset ↺</button></div>
    </div>
    <div className="constellation-details">
      <div className="constellation-selection" aria-live="polite"><span className="mono">{GROUPS[nodes[active].group]} / {String(active + 1).padStart(2, '0')}</span><h3>{project.name}</h3><p>{project.kind}</p><Link id={`constellation-link-${compact ? 'compact' : 'full'}`} className="mono" href={`/work/${project.id}`}>Explore this system ↗</Link></div>
      <div className="constellation-list" role="group" aria-label="Select a project">{GROUPS.map((group, index) => <div key={group}><p className="mono">{group}</p>{PROJECTS.map((p, i) => nodes[i].group === index && <button key={p.id} type="button" aria-pressed={i === active} onClick={() => select(i)}>{p.name}<span aria-hidden>↗</span></button>)}</div>)}</div>
    </div>
  </div>;
}
