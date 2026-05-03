// ===================== STATE =====================
window.currentTemplate = 'classic';
window.accentColor = '#6366f1';
window.skills = [];
window.experiences = [{ id: 1, title: '', company: '', dates: '', description: '' }];
window.educations = [{ id: 1, degree: '', school: '', dates: '', description: '' }];
window.isDark = true;
window._history = [];
window._historyIndex = -1;
window._skipHistory = false;

// ===================== VALIDATION =====================
const VALIDATORS = {
  name:    { required: true,  test: v => v.trim().length >= 2,                                      msg: 'Full name must be at least 2 characters.' },
  role:    { required: true,  test: v => v.trim().length >= 2,                                      msg: 'Job title must be at least 2 characters.' },
  email:   { required: true,  test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),              msg: 'Please enter a valid email address.' },
  phone:   { required: false, test: v => !v.trim() || /^[\d\s\+\-\(\)]{6,20}$/.test(v.trim()),    msg: 'Please enter a valid phone number.' },
  location:{ required: false, test: v => !v.trim() || v.trim().length >= 2,                        msg: 'Location seems too short.' },
  website: { required: false, test: v => !v.trim() || v.trim().length >= 4,                        msg: 'Please enter a valid URL or LinkedIn profile.' },
  summary: { required: false, test: v => !v.trim() || v.trim().length >= 30,                       msg: 'Summary should be at least 30 characters.' },
};

function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const rule = VALIDATORS[id];
  if (!rule) return true;
  const val = el.value;
  const isEmpty = !val.trim();
  let errMsg = '';
  if (isEmpty && rule.required) errMsg = rule.msg;
  else if (!isEmpty && !rule.test(val)) errMsg = rule.msg;
  setFieldError(id, errMsg);
  return !errMsg;
}

function setFieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const wrap = el.closest('.field');
  if (!wrap) return;
  let errEl = wrap.querySelector('.field-error');
  if (msg) {
    el.classList.add('input-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'field-error';
      wrap.appendChild(errEl);
    }
    errEl.textContent = msg;
  } else {
    el.classList.remove('input-error');
    if (errEl) errEl.remove();
  }
}

function validateAll() {
  return Object.keys(VALIDATORS).map(id => validateField(id)).every(Boolean);
}

// ===================== UNDO / REDO =====================
function saveSnapshot() {
  if (window._skipHistory) return;
  const snap = JSON.stringify(getFullState());
  if (window._history[window._historyIndex] === snap) return;
  window._history = window._history.slice(0, window._historyIndex + 1);
  window._history.push(snap);
  if (window._history.length > 60) window._history.shift();
  window._historyIndex = window._history.length - 1;
  updateUndoRedoBtns();
}

function undo() {
  if (window._historyIndex <= 0) return;
  window._historyIndex--;
  window._skipHistory = true;
  restoreState(JSON.parse(window._history[window._historyIndex]));
  window._skipHistory = false;
  updateUndoRedoBtns();
}

function redo() {
  if (window._historyIndex >= window._history.length - 1) return;
  window._historyIndex++;
  window._skipHistory = true;
  restoreState(JSON.parse(window._history[window._historyIndex]));
  window._skipHistory = false;
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  const u = document.getElementById('undo-btn');
  const r = document.getElementById('redo-btn');
  if (u) u.disabled = window._historyIndex <= 0;
  if (r) r.disabled = window._historyIndex >= window._history.length - 1;
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
});

// ===================== FULL STATE =====================
function getFullState() {
  return {
    name: document.getElementById('name')?.value || '',
    role: document.getElementById('role')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    location: document.getElementById('location')?.value || '',
    website: document.getElementById('website')?.value || '',
    summary: document.getElementById('summary')?.value || '',
    skills: [...window.skills],
    experiences: JSON.parse(JSON.stringify(window.experiences)),
    educations: JSON.parse(JSON.stringify(window.educations)),
    template: window.currentTemplate,
    accent: window.accentColor,
  };
}

function restoreState(s) {
  window._skipHistory = true;
  ['name','role','email','phone','location','website','summary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = s[id] || '';
  });
  window.skills = s.skills || [];
  window.experiences = s.experiences?.length ? s.experiences : [{ id: 1, title: '', company: '', dates: '', description: '' }];
  window.educations = s.educations?.length ? s.educations : [{ id: 1, degree: '', school: '', dates: '', description: '' }];
  window.currentTemplate = s.template || 'classic';
  window.accentColor = s.accent || '#6366f1';
  document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
  const tplEl = document.getElementById('tpl-' + window.currentTemplate);
  if (tplEl) tplEl.classList.add('selected');
  renderSkillTags();
  renderExperiences();
  renderEducations();
  updatePreview();
  updateProgress();
  window._skipHistory = false;
}

// ===================== AUTO-SAVE =====================
let _saveTimer;
function autoSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const state = getFullState();
    state.isDark = window.isDark;
    localStorage.setItem('resumeBuilder_current', JSON.stringify(state));
    updateResumeList();
  }, 400);
}

function loadSaved() {
  const raw = localStorage.getItem('resumeBuilder_current');
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    restoreState(s);
    if (s.isDark !== undefined) { window.isDark = s.isDark; applyTheme(); }
  } catch (e) {}
}

// ===================== MULTIPLE RESUMES =====================
function getSavedResumes() {
  try { return JSON.parse(localStorage.getItem('resumeBuilder_list') || '[]'); } catch { return []; }
}

function saveResumeAs() {
  const defaultName = document.getElementById('name')?.value?.trim() || 'My Resume';
  const name = prompt('Name this resume:', defaultName);
  if (!name) return;
  const list = getSavedResumes();
  list.unshift({ id: Date.now(), name, data: getFullState(), savedAt: new Date().toLocaleDateString() });
  if (list.length > 10) list.pop();
  localStorage.setItem('resumeBuilder_list', JSON.stringify(list));
  updateResumeList();
  showToast('✓ Saved: ' + name);
}

function loadResume(id) {
  const item = getSavedResumes().find(r => r.id === id);
  if (!item) return;
  restoreState(item.data);
  saveSnapshot();
  showToast('✓ Loaded: ' + item.name);
}

function deleteResume(id, e) {
  e.stopPropagation();
  const list = getSavedResumes().filter(r => r.id !== id);
  localStorage.setItem('resumeBuilder_list', JSON.stringify(list));
  updateResumeList();
}

function updateResumeList() {
  const container = document.getElementById('resume-list');
  if (!container) return;
  const list = getSavedResumes();
  if (!list.length) {
    container.innerHTML = '<div style="font-size:11px;color:var(--text3);text-align:center;padding:10px 0;">No saved resumes yet.<br>Click 💾 Save to save one.</div>';
    return;
  }
  container.innerHTML = list.map(r => `
    <div class="resume-list-item">
      <div class="resume-list-info" onclick="loadResume(${r.id})">
        <div class="resume-list-name">${r.name}</div>
        <div class="resume-list-date">${r.savedAt}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteResume(${r.id},event)">✕</button>
    </div>`).join('');
}

// ===================== PROGRESS BAR =====================
function updateProgress() {
  const d = getData();
  const checks = [
    !!d.name, !!d.role, !!d.email, !!d.phone, !!d.location,
    !!(d.summary && d.summary.length > 40),
    window.skills.length >= 3,
    window.experiences.some(e => e.title && e.company),
    window.experiences.some(e => e.description && e.description.length > 30),
    window.educations.some(e => e.degree && e.school),
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const bar = document.getElementById('progress-bar');
  const lbl = document.getElementById('progress-label');
  if (bar) { bar.style.width = pct + '%'; bar.style.background = pct >= 80 ? 'var(--success)' : pct >= 50 ? '#f59e0b' : 'var(--accent)'; }
  if (lbl) lbl.textContent = pct + '%';
}

// ===================== DARK / LIGHT MODE =====================
function toggleTheme() {
  window.isDark = !window.isDark;
  applyTheme();
  autoSave();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', window.isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = window.isDark ? '☀' : '☾';
}

// ===================== TABS =====================
function switchTab(tab, el) {
  document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(t => t.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';
  if (el) el.classList.add('active');
}

// ===================== TEMPLATE =====================
function selectTemplate(tpl) {
  window.currentTemplate = tpl;
  document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('tpl-' + tpl)?.classList.add('selected');
  updatePreview(); saveSnapshot(); autoSave();
}

// ===================== SKILLS =====================
function addSkill() {
  const input = document.getElementById('skill-input');
  const val = input.value.trim();
  if (!val || window.skills.includes(val)) { input.value = ''; return; }
  window.skills.push(val);
  input.value = '';
  renderSkillTags(); updatePreview(); updateProgress(); saveSnapshot(); autoSave();
}

function removeSkill(i) {
  window.skills.splice(i, 1);
  renderSkillTags(); updatePreview(); updateProgress(); saveSnapshot(); autoSave();
}

function renderSkillTags() {
  document.getElementById('skills-tags').innerHTML = window.skills.map((s, i) =>
    `<div class="skill-tag">${s}<span class="rm" onclick="removeSkill(${i})">✕</span></div>`
  ).join('');
}

// ===================== EXPERIENCE =====================
function addExperience() {
  window.experiences.push({ id: Date.now(), title: '', company: '', dates: '', description: '' });
  renderExperiences(); saveSnapshot(); autoSave();
}

function removeExperience(id) {
  window.experiences = window.experiences.filter(e => e.id !== id);
  renderExperiences(); updatePreview(); updateProgress(); saveSnapshot(); autoSave();
}

function updateExp(id, field, val) {
  const exp = window.experiences.find(e => e.id === id);
  if (exp) { exp[field] = val; updatePreview(); updateProgress(); autoSave(); }
}

function renderExperiences() {
  document.getElementById('exp-list').innerHTML = window.experiences.map((e, i) => `
    <div class="card" draggable="true" data-id="${e.id}" data-type="exp"
      ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropCard(event)" ondragleave="dragLeave(event)" ondragend="dragEnd(event)">
      <div class="card-head">
        <div class="card-title">⠿ Experience ${i + 1}</div>
        <button class="btn btn-danger btn-sm" onclick="removeExperience(${e.id})">✕</button>
      </div>
      <div class="field">
        <label class="label">Job Title <span class="req">*</span></label>
        <input type="text" value="${e.title}" oninput="updateExp(${e.id},'title',this.value);expValidate(this,'Job title is required.')" placeholder="Software Engineer" />
      </div>
      <div class="field-row">
        <div class="field">
          <label class="label">Company <span class="req">*</span></label>
          <input type="text" value="${e.company}" oninput="updateExp(${e.id},'company',this.value);expValidate(this,'Company is required.')" placeholder="Acme Corp" />
        </div>
        <div class="field">
          <label class="label">Dates</label>
          <input type="text" value="${e.dates}" oninput="updateExp(${e.id},'dates',this.value)" placeholder="2022 – Present" />
        </div>
      </div>
      <div class="field"><label class="label">Description</label><textarea oninput="updateExp(${e.id},'description',this.value)" placeholder="Key responsibilities and achievements…">${e.description}</textarea></div>
      <button class="ai-btn mt-8" onclick="enhanceExpDesc(${e.id})"><span class="spark">✦</span> Enhance with AI</button>
    </div>`).join('');
}

function expValidate(el, msg) {
  const wrap = el.closest('.field');
  if (!wrap) return;
  let errEl = wrap.querySelector('.field-error');
  if (!el.value.trim()) {
    el.classList.add('input-error');
    if (!errEl) { errEl = document.createElement('div'); errEl.className = 'field-error'; wrap.appendChild(errEl); }
    errEl.textContent = msg;
  } else {
    el.classList.remove('input-error');
    if (errEl) errEl.remove();
  }
}

// ===================== EDUCATION =====================
function addEducation() {
  window.educations.push({ id: Date.now(), degree: '', school: '', dates: '', description: '' });
  renderEducations(); saveSnapshot(); autoSave();
}

function removeEducation(id) {
  window.educations = window.educations.filter(e => e.id !== id);
  renderEducations(); updatePreview(); updateProgress(); saveSnapshot(); autoSave();
}

function updateEdu(id, field, val) {
  const edu = window.educations.find(e => e.id === id);
  if (edu) { edu[field] = val; updatePreview(); updateProgress(); autoSave(); }
}

function renderEducations() {
  document.getElementById('edu-list').innerHTML = window.educations.map((e, i) => `
    <div class="card" draggable="true" data-id="${e.id}" data-type="edu"
      ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropCard(event)" ondragleave="dragLeave(event)" ondragend="dragEnd(event)">
      <div class="card-head">
        <div class="card-title">⠿ Education ${i + 1}</div>
        <button class="btn btn-danger btn-sm" onclick="removeEducation(${e.id})">✕</button>
      </div>
      <div class="field">
        <label class="label">Degree <span class="req">*</span></label>
        <input type="text" value="${e.degree}" oninput="updateEdu(${e.id},'degree',this.value);expValidate(this,'Degree is required.')" placeholder="B.S. Computer Science" />
      </div>
      <div class="field-row">
        <div class="field">
          <label class="label">School <span class="req">*</span></label>
          <input type="text" value="${e.school}" oninput="updateEdu(${e.id},'school',this.value);expValidate(this,'School is required.')" placeholder="MIT" />
        </div>
        <div class="field">
          <label class="label">Dates</label>
          <input type="text" value="${e.dates}" oninput="updateEdu(${e.id},'dates',this.value)" placeholder="2016 – 2020" />
        </div>
      </div>
    </div>`).join('');
}

// ===================== DRAG & DROP =====================
let _dragId = null, _dragType = null;

function dragStart(e) {
  _dragId = parseInt(e.currentTarget.dataset.id);
  _dragType = e.currentTarget.dataset.type;
  e.currentTarget.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}
function dragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function dragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function dragEnd(e) { e.currentTarget.style.opacity = '1'; document.querySelectorAll('.card').forEach(c => c.classList.remove('drag-over')); }

function dropCard(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const targetId = parseInt(e.currentTarget.dataset.id);
  if (_dragId === targetId) return;
  const arr = _dragType === 'exp' ? window.experiences : window.educations;
  const from = arr.findIndex(x => x.id === _dragId);
  const to = arr.findIndex(x => x.id === targetId);
  if (from < 0 || to < 0) return;
  arr.splice(to, 0, arr.splice(from, 1)[0]);
  _dragType === 'exp' ? renderExperiences() : renderEducations();
  updatePreview(); saveSnapshot(); autoSave();
}

// ===================== DATA =====================
function getData() {
  return {
    name: document.getElementById('name')?.value || '',
    role: document.getElementById('role')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    location: document.getElementById('location')?.value || '',
    website: document.getElementById('website')?.value || '',
    summary: document.getElementById('summary')?.value || '',
  };
}

// ===================== PREVIEW =====================
function updatePreview() {
  const d = getData();
  const output = document.getElementById('resume-output');
  if (!output) return;
  const t = window.currentTemplate, a = window.accentColor;
  if (t === 'classic') output.innerHTML = renderClassic(d, window.skills, window.experiences, window.educations, a);
  else if (t === 'modern') output.innerHTML = renderModern(d, window.skills, window.experiences, window.educations, a);
  else if (t === 'minimal') output.innerHTML = renderMinimal(d, window.skills, window.experiences, window.educations, a);
  else if (t === 'creative') output.innerHTML = renderCreative(d, window.skills, window.experiences, window.educations, a);
}

// ===================== EXPORT WITH VALIDATION =====================
function exportResume() {
  if (!validateAll()) {
    // switch to info tab to show errors
    document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(t => t.style.display = 'none');
    document.getElementById('tab-info').style.display = 'block';
    document.querySelector('.stab').classList.add('active');
    showToast('⚠ Fix the errors before exporting.');
    return;
  }
  _doExportPDF();
}

// ===================== CLEAR =====================
function clearAll() {
  if (!confirm('Clear all resume data?')) return;
  ['name','role','email','phone','location','website','summary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; setFieldError(id, ''); }
  });
  window.skills = [];
  window.experiences = [{ id: 1, title: '', company: '', dates: '', description: '' }];
  window.educations = [{ id: 1, degree: '', school: '', dates: '', description: '' }];
  renderSkillTags(); renderExperiences(); renderEducations();
  updatePreview(); updateProgress(); saveSnapshot(); autoSave();
}

// ===================== TOAST =====================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ===================== COVER LETTER COPY =====================
function copyCoverLetter() {
  const el = document.getElementById('cover-result');
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => showToast('📋 Cover letter copied!'));
}

// ===================== MOBILE SIDEBAR =====================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
  document.getElementById('mobile-toggle').textContent = sidebar.classList.contains('open') ? '✕' : '☰';
}

document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('mobile-toggle');
  if (window.innerWidth <= 900 && sidebar?.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
      toggle.textContent = '☰';
    }
  }
});

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadSaved();
  if (window._history.length === 0) saveSnapshot();
  renderExperiences();
  renderEducations();
  updatePreview();
  updateProgress();
  updateResumeList();
  applyTheme();

  document.getElementById('skill-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addSkill();
  });

  // Attach validation on blur + clear on input
  Object.keys(VALIDATORS).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => validateField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('input-error')) validateField(id);
      saveSnapshot(); autoSave();
    });
  });
});
