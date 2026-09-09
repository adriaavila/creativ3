import Image from 'next/image';
import type { PortfolioProject } from '@/lib/projects';

export default function ProjectScreens({ project }: { project: PortfolioProject }) {
  const landscape = project.images.find(image => !image.width || !image.height || image.width >= image.height);
  const portrait = project.images.find(image => image.width && image.height && image.width < image.height);
  if (!landscape && !portrait) return (
    <div className="workflow-preview">
      <span className="mono">Workflow illustration</span>
      <div className="workflow-path"><span>01<br />{project.id === 'soapy' ? 'Receive' : 'Input'}</span><i aria-hidden>→</i><span>02<br />{project.id === 'soapy' ? 'Process' : 'Validate'}</span><i aria-hidden>→</i><span>03<br />{project.id === 'soapy' ? 'Deliver' : 'Act'}</span></div>
      <p>{project.kind}</p>
    </div>
  );
  return (
    <div className={`project-screens ${landscape ? '' : 'portrait-only'}`}>
      {landscape && <Image src={landscape.src} alt={landscape.alt} width={landscape.width ?? 1440} height={landscape.height ?? 900} sizes="(min-width: 1024px) 55vw, 90vw" className="desktop-screen" />}
      {portrait && <Image src={portrait.src} alt={portrait.alt} width={portrait.width ?? 390} height={portrait.height ?? 844} sizes="(min-width: 1024px) 16vw, 28vw" className="mobile-screen" />}
      {!landscape && project.images[1] && <Image src={project.images[1].src} alt={project.images[1].alt} width={project.images[1].width ?? 390} height={project.images[1].height ?? 844} sizes="(min-width: 1024px) 18vw, 30vw" className="companion-screen" />}
    </div>
  );
}
