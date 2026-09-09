import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_PORTFOLIO_PROJECTS, HIDDEN_PROJECT_IDS, PORTFOLIO_PROJECTS, type PortfolioProject } from './projects';
import { chronologicalProjects, projectDate, dateLabel, projectStory, CURATED_IMAGES } from './project-editorial';
import { WRITING } from './writing';

test('chronology is stable, newest-first, and independent of later GitHub pushes', () => {
  const projects = chronologicalProjects(PORTFOLIO_PROJECTS);
  assert.equal(projects[0].id, 'vocero-crm');
  const original = PORTFOLIO_PROJECTS.map(p => p.id);
  const changed = PORTFOLIO_PROJECTS.map(p => ({ ...p, githubPushedAt: '2099-01-01T00:00:00Z' }));
  assert.deepEqual(chronologicalProjects(changed).map(p => p.id), projects.map(p => p.id));
  assert.deepEqual(PORTFOLIO_PROJECTS.map(p => p.id), original);
  for (let i = 1; i < projects.length; i++) assert.ok(projectDate(projects[i - 1]).value >= projectDate(projects[i]).value);
  const yearOnly: PortfolioProject = { ...projects[0], chronology: { value: '2026', precision: 'year', source: 'portfolio' } };
  const launch: PortfolioProject = { ...yearOnly, chronology: { value: '2026-09-01', precision: 'day', source: 'launch' } };
  assert.equal(chronologicalProjects([yearOnly, launch])[0], launch);
  assert.match(dateLabel(yearOnly), /2026 · project year/);
  assert.match(dateLabel(launch), /launched/);
  assert.match(dateLabel(projects[0]), /repository began/);
  assert.deepEqual(chronologicalProjects([yearOnly, { ...yearOnly, id: 'tie' }]).map(p => p.id), [yearOnly.id, 'tie']);
});

test('curated stories, media and source credit remain distinct from sync data', () => {
  for (const id of HIDDEN_PROJECT_IDS) {
    assert.ok(ALL_PORTFOLIO_PROJECTS.some(project => project.id === id));
    assert.equal(PORTFOLIO_PROJECTS.some(project => project.id === id), false);
  }
  const ids = new Set(PORTFOLIO_PROJECTS.map(p => p.id));
  assert.equal(ids.size, PORTFOLIO_PROJECTS.length);
  for (const project of PORTFOLIO_PROJECTS) {
    const story = projectStory(project);
    assert.ok(story.problem && story.contribution && story.outcome);
    if (project.id in CURATED_IMAGES) assert.deepEqual(project.images.map(i => i.src), CURATED_IMAGES[project.id].map(i => i.src));
    for (const image of project.images) {
      assert.ok(existsSync(join(process.cwd(), 'public', image.src)), image.src);
      assert.ok(image.width && image.height, `Dimensions: ${image.src}`);
    }
  }
  assert.equal(PORTFOLIO_PROJECTS.find(p => p.id === 'soapy')?.images.length, 5);
  assert.ok(PORTFOLIO_PROJECTS.find(p => p.id === 'vocero-crm')?.attribution?.url.includes('kevinrivm'));
  for (const note of WRITING) if (note.project) assert.ok(ids.has(note.project));
  const sync = readFileSync(join(process.cwd(), 'scripts/sync-projects.ts'), 'utf8');
  assert.ok(sync.includes('!(project.id in CURATED_IMAGES)'));
});
