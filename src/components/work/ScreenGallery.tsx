'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ProjectImage } from '@/lib/projects';

export default function ScreenGallery({ images, name }: { images: ProjectImage[]; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const savedOverflow = useRef<string | null>(null);
  useEffect(() => () => { if (savedOverflow.current !== null) document.body.style.overflow = savedOverflow.current; }, []);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [active, setActive] = useState(0);
  const current = images[active];
  const restore = () => { if (savedOverflow.current !== null) document.body.style.overflow = savedOverflow.current; savedOverflow.current = null; trigger.current?.focus(); };
  const move = (step: number) => setActive(index => (index + step + images.length) % images.length);
  if (!current) return null;
  return <>
    <div className="screen-gallery">{images.map((image, index) => <figure key={image.src} className={image.width && image.height && image.width < image.height ? 'portrait-figure' : ''}>
      <button type="button" className="screen-open" aria-label={`Enlarge ${image.label} — ${name}`} onClick={event => { trigger.current = event.currentTarget; setActive(index); savedOverflow.current = document.body.style.overflow; dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }}>
        <Image src={image.src} alt={image.alt} width={image.width ?? 1440} height={image.height ?? 900} sizes="(min-width: 1024px) 75vw, 90vw" /><span className="mono">Expand ↗</span>
      </button><figcaption><span className="mono">{String(index + 1).padStart(2, '0')} /</span> {image.label}</figcaption>
    </figure>)}</div>
    <dialog ref={dialog} className="screen-dialog" aria-label={`${name} screen viewer`} onClose={restore} onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } }}>
      <div className="viewer-bar"><p className="mono" aria-live="polite">{name} / {current.label} · {active + 1} of {images.length}</p><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close screen viewer">Close ×</button></div>
      <div className="viewer-image"><Image key={current.src} src={current.src} alt={current.alt} width={current.width ?? 1440} height={current.height ?? 900} sizes="95vw" /></div>
      <div className="viewer-bottom"><button type="button" onClick={() => move(-1)} aria-label="Previous screen" disabled={images.length < 2}>←</button><div className="viewer-thumbs">{images.map((image, index) => <button key={image.src} type="button" aria-label={`Show ${image.label}`} aria-pressed={active === index} onClick={() => setActive(index)}><Image src={image.src} alt="" width={80} height={60} className="object-contain" /></button>)}</div><button type="button" onClick={() => move(1)} aria-label="Next screen" disabled={images.length < 2}>→</button></div>
    </dialog>
  </>;
}
