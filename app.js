'use strict';
// This concept has no network submission, analytics or browser storage.
// Answers exist only in the currently open document and are lost on reload.
const answers = { project: 'Bathroom', knowledge: null, intent: null, size: null, features: [], electrical: [] };
const guided = ['project', 'knowledge', 'intent', 'size', 'features', 'notes', 'contact', 'result'];
const advanced = ['project', 'knowledge', 'advanced', 'contact', 'result'];
let screen = 'project';
const form = document.querySelector('#estimate-form');
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const skip = document.querySelector('#skip');
const validation = document.querySelector('#validation');
const electrical = ['Extractor fan', 'Shaver socket', 'Electric shower', 'External light switch', 'Single light replacement', 'Dual fuel radiator', 'Safety certificate & building control'];
electrical.forEach(value => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'choice'; button.dataset.value = value;
  button.setAttribute('aria-pressed', 'false'); button.textContent = value;
  document.querySelector('.electrical-options').append(button);
});
function path() { return answers.knowledge === 'advanced' ? advanced : guided; }
function setSelected(group) {
  const selected = answers[group.dataset.key];
  group.querySelectorAll('.choice').forEach(button => {
    const active = Array.isArray(selected) ? selected.includes(button.dataset.value) : selected === button.dataset.value;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
document.querySelectorAll('.choice-group').forEach(group => {
  group.addEventListener('click', event => {
    const button = event.target.closest('.choice');
    if (!button || !group.contains(button)) return;
    const key = group.dataset.key; const value = button.dataset.value;
    if (group.dataset.mode === 'multiple') {
      if (value === 'Not sure yet') answers[key] = answers[key].includes(value) ? [] : [value];
      else {
        answers[key] = answers[key].filter(v => v !== 'Not sure yet');
        answers[key] = answers[key].includes(value) ? answers[key].filter(v => v !== value) : [...answers[key], value];
      }
    } else answers[key] = value;
    setSelected(group); validation.hidden = true;
    if (key === 'project') {
      const supported = value === 'Bathroom';
      document.querySelector('#project-notice').hidden = supported;
      next.disabled = !supported;
    }
  });
});
function summary(target) {
  const dl = document.createElement('dl');
  const rows = [['Project', 'Bathroom'], ['Starting point', answers.knowledge === 'advanced' ? 'Measured & ready' : 'A little guidance']];
  if (answers.knowledge === 'guided') {
    rows.push(['Plan', answers.intent || 'To confirm together'], ['Room size', answers.size || 'To confirm on site'], ['Including', answers.features.filter(v => v !== 'Not sure yet').join(', ') || 'To confirm together']);
  } else {
    const fields = {installation:['Scope',''], suite:['Suite & tiles',''], tiling:['Tiling',' m²'], plumbing:['Plumbing',''], pump:['Shower pump',''], spotlights:['Spotlights',''], plastering:['Plastering',' m²'], decoration:['Decoration',' m²'], waste:['Waste','']};
    const filled = [...document.querySelectorAll('.advanced-sections input, .advanced-sections select')].filter(el => !el.disabled && el.value);
    if (!filled.length) rows.push(['Details', 'To confirm during consultation']);
    filled.forEach(el => { const [label, unit] = fields[el.id]; rows.push([label, el.value + unit]); });
    const confirmations = [...document.querySelectorAll('details[data-help="true"]')].map(d => d.dataset.section);
    if (confirmations.length) rows.push(['JSS to confirm', confirmations.join(', ')]);
    if (answers.electrical.length && document.querySelector('details[data-section="Electrical"]').dataset.help !== 'true') rows.push(['Electrical', answers.electrical.join(', ')]);
  }
  if (answers.knowledge === 'guided' && document.querySelector('#notes').value.trim()) rows.push(['Your ideas', document.querySelector('#notes').value.trim()]);
  rows.forEach(([label, value]) => { const row = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; row.append(dt, dd); dl.append(row); });
  target.replaceChildren(dl);
}
function show(target, focus = true) {
  screen = target;
  document.querySelectorAll('.screen').forEach(el => { el.hidden = el.dataset.screen !== screen; });
  const stage = screen === 'project' ? 0 : screen === 'knowledge' ? 1 : screen === 'result' ? 3 : 2;
  document.querySelectorAll('.progress li').forEach((li, index) => {
    li.classList.toggle('current', index === stage); li.classList.toggle('complete', index < stage);
    if (index === stage) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  const progress = {project:25, knowledge:42, intent:52, size:59, features:67, notes:75, advanced:67, contact:85, result:100};
  document.querySelector('#progress-fill').style.width = `${progress[screen]}%`;
  document.querySelector('#step-count').textContent = `0${stage + 1} / 04`;
  back.hidden = screen === 'project'; next.hidden = screen === 'result';
  next.disabled = screen === 'project' && answers.project !== 'Bathroom';
  next.replaceChildren(document.createTextNode(screen === 'contact' ? 'View my estimate ' : 'Continue '));
  const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→'; next.append(arrow);
  skip.hidden = !['intent', 'size', 'features', 'notes', 'advanced'].includes(screen);
  skip.textContent = screen === 'notes' ? 'Skip this optional question →' : screen === 'advanced' ? 'Leave remaining details for the consultation →' : 'Not sure? Leave this for the consultation →';
  validation.hidden = true;
  if (screen === 'contact') summary(document.querySelector('#contact-summary'));
  if (screen === 'result') summary(document.querySelector('#result-summary'));
  if (focus) {
    const heading = document.querySelector(`.screen[data-screen="${screen}"] h2`);
    heading.focus({preventScroll:true});
    document.querySelector('#estimator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  }
}
function advance() {
  if (screen === 'project' && answers.project !== 'Bathroom') return;
  if (screen === 'knowledge' && !answers.knowledge) { validation.textContent = 'Choose a starting point. Either route is fine.'; validation.hidden = false; return; }
  if (screen === 'contact') {
    const email = document.querySelector('#email');
    if (email.value && !email.checkValidity()) { email.reportValidity(); return; }
  }
  if (screen === 'advanced') {
    const invalid = [...document.querySelectorAll('.advanced-sections input')].find(el => !el.disabled && !el.checkValidity());
    if (invalid) { invalid.closest('details').open = true; invalid.reportValidity(); return; }
  }
  if (screen === 'intent' && !answers.intent) { answers.intent = 'Not sure yet'; setSelected(document.querySelector('[data-key="intent"]')); }
  if (screen === 'size' && !answers.size) { answers.size = 'Not sure'; setSelected(document.querySelector('[data-key="size"]')); }
  if (screen === 'features' && !answers.features.length) { answers.features = ['Not sure yet']; setSelected(document.querySelector('[data-key="features"]')); }
  const screens = path(); show(screens[screens.indexOf(screen) + 1] || 'result');
}
next.addEventListener('click', advance);
back.addEventListener('click', () => { const screens = path(); show(screens[Math.max(0, screens.indexOf(screen) - 1)]); });
skip.addEventListener('click', () => {
  if (screen === 'advanced') document.querySelectorAll('.advanced-sections input').forEach(el => { if (!el.checkValidity()) el.value = ''; });
  if (screen === 'intent') { answers.intent = 'Not sure yet'; setSelected(document.querySelector('[data-key="intent"]')); }
  if (screen === 'size') { answers.size = 'Not sure'; setSelected(document.querySelector('[data-key="size"]')); }
  if (screen === 'features') { answers.features = ['Not sure yet']; setSelected(document.querySelector('[data-key="features"]')); }
  advance();
});
form.addEventListener('submit', event => { event.preventDefault(); if (screen !== 'result') advance(); });
document.querySelectorAll('.help-control').forEach(button => {
  button.addEventListener('click', () => {
    const details = button.closest('details'); const helping = details.dataset.help !== 'true'; details.dataset.help = String(helping);
    details.querySelector('.confirm-note').hidden = !helping;
    details.querySelectorAll('input,select').forEach(el => { el.disabled = helping; });
    details.querySelectorAll('.choice').forEach(el => { el.disabled = helping; });
    button.replaceChildren(document.createTextNode(helping ? 'JSS will help with this.' : 'Not sure about this? '));
    const label = document.createElement('span'); label.textContent = helping ? 'Enter the details myself ↗' : 'Let JSS help me with it ↗'; button.append(label);
  });
});
document.querySelector('.switch-route').addEventListener('click', () => { answers.knowledge = 'guided'; setSelected(document.querySelector('[data-key="knowledge"]')); show('intent'); });
document.querySelector('#request-consultation').addEventListener('click', () => {
  document.querySelector('#consultation-status').hidden = false;
  // Remove contact values immediately after the demonstration, never transmit them.
  document.querySelectorAll('.contact-grid input').forEach(input => { input.value = ''; });
});
show('project', false);
