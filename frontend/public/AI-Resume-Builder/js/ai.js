// ===================== AI HELPERS =====================
const GEMINI_API_KEY = 'AIzaSyAdnUaqAk8dnDYNhiGWS9v5k-zazWX4zCM';
function getApiKey() { return GEMINI_API_KEY; }

function showStatus(msg) {
  const el = document.getElementById('ai-status');
  el.querySelector('.ai-status-text').textContent = msg;
  el.classList.add('visible');
}
function hideStatus() { document.getElementById('ai-status').classList.remove('visible'); }

// ===================== LOCAL GENERATOR =====================
const SKILL_MAP = {
  developer:  ['JavaScript','TypeScript','React','Node.js','Python','Git','REST APIs','SQL','Docker','Agile/Scrum'],
  designer:   ['Figma','Adobe XD','UI/UX Design','Prototyping','User Research','Wireframing','Design Systems','Accessibility','Sketch','Illustrator'],
  manager:    ['Leadership','Strategic Planning','Stakeholder Management','Budgeting','Team Building','OKRs','Risk Management','Agile','Conflict Resolution','Communication'],
  marketing:  ['SEO/SEM','Google Analytics','Content Strategy','Social Media','Email Marketing','A/B Testing','Copywriting','Brand Management','HubSpot','Data Analysis'],
  data:       ['Python','SQL','Machine Learning','Tableau','Power BI','Statistics','Data Wrangling','Pandas','NumPy','Data Visualization'],
  sales:      ['CRM (Salesforce)','Lead Generation','Negotiation','Pipeline Management','Cold Outreach','Account Management','Closing','Forecasting','Relationship Building','Presentation Skills'],
  finance:    ['Financial Modeling','Excel','Budgeting','Forecasting','GAAP','QuickBooks','Risk Analysis','Reporting','Auditing','Compliance'],
  default:    ['Communication','Problem Solving','Team Collaboration','Time Management','Critical Thinking','Adaptability','Attention to Detail','Project Management'],
};

function pickSkillSet(role) {
  const r = (role || '').toLowerCase();
  if (/develop|engineer|program|software|frontend|backend|fullstack|web/.test(r)) return SKILL_MAP.developer;
  if (/design|ux|ui|graphic/.test(r)) return SKILL_MAP.designer;
  if (/manager|director|lead|head|vp|chief|coo|ceo/.test(r)) return SKILL_MAP.manager;
  if (/market|growth|seo|content|brand/.test(r)) return SKILL_MAP.marketing;
  if (/data|analyst|scientist|ml|ai|machine/.test(r)) return SKILL_MAP.data;
  if (/sales|account exec|business dev|bdr|sdr/.test(r)) return SKILL_MAP.sales;
  if (/financ|account|audit|tax|cfo/.test(r)) return SKILL_MAP.finance;
  return SKILL_MAP.default;
}

const SUMMARY_TEMPLATES = [
  (name, role, skills, exp) => `${name} is a results-driven ${role} with ${exp} of hands-on experience delivering high-impact solutions. Skilled in ${skills}, ${name.split(' ')[0]} excels at translating complex challenges into measurable outcomes. Passionate about continuous improvement and committed to driving excellence in every project.`,
  (name, role, skills, exp) => `Dynamic ${role} with ${exp} of proven expertise in ${skills}. ${name} brings a strategic mindset and a track record of exceeding goals through collaboration and innovation. Known for clear communication and the ability to thrive in fast-paced, high-growth environments.`,
  (name, role, skills, exp) => `Accomplished ${role} with ${exp} of experience specializing in ${skills}. ${name} combines deep technical knowledge with strong interpersonal skills to lead teams and deliver projects on time and within scope. Dedicated to building impactful solutions that create real business value.`,
];

function guessExp() {
  const count = window.experiences.filter(e => e.title || e.company).length;
  if (count >= 3) return 'over 5 years';
  if (count === 2) return '3+ years';
  if (count === 1) return '2+ years';
  return 'several years';
}

function generateLocalSummary(d) {
  const name = d.name || 'This professional';
  const role = d.role || 'professional';
  const skillList = window.skills.length ? window.skills.slice(0, 3).join(', ') : pickSkillSet(role).slice(0, 3).join(', ');
  return SUMMARY_TEMPLATES[Math.floor(Math.random() * SUMMARY_TEMPLATES.length)](name, role, skillList, guessExp());
}

function generateLocalExpDesc(exp) {
  const role = exp.title || 'professional';
  const co = exp.company ? ` at ${exp.company}` : '';
  return [
    `Led key initiatives as ${role}${co}, driving measurable improvements in team productivity and project delivery timelines.`,
    `Collaborated cross-functionally to design and implement solutions that reduced operational inefficiencies and improved overall performance.`,
    `Consistently exceeded performance targets by leveraging data-driven insights and best practices in ${role.toLowerCase()} workflows.`,
  ].join('\n');
}

// ===================== GEMINI API =====================
async function callAI(prompt) {
  const key = getApiKey();
  if (!key) throw new Error('no-key');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gemini API error ' + res.status);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ===================== SUMMARY =====================
async function enhanceSummary() {
  const d = getData();
  if (!d.name && !d.role) { alert('Please fill in your name and role first.'); return; }
  const btn = document.getElementById('ai-summary-btn');
  btn.disabled = true;
  showStatus('Generating your professional summary…');
  try {
    let text;
    try {
      text = await callAI(`Write a compelling 3-sentence professional resume summary for ${d.name || 'a professional'} who is a ${d.role || 'professional'}. ${d.summary ? 'Improve this draft: ' + d.summary : ''} Skills include: ${window.skills.join(', ') || 'various skills'}. Be concise, impactful, achievement-oriented. Return only the summary text, no labels or extra formatting.`);
    } catch (_) {
      await new Promise(r => setTimeout(r, 700));
      text = generateLocalSummary(d);
    }
    document.getElementById('summary').value = text.trim();
    updatePreview(); updateProgress(); saveSnapshot(); autoSave();
  } catch (e) { alert('Generation failed. Please try again.'); }
  btn.disabled = false;
  hideStatus();
}

// ===================== SKILLS =====================
async function suggestSkills() {
  const d = getData();
  if (!d.role) { alert('Please fill in your job title first.'); return; }
  const btn = document.getElementById('ai-skills-btn');
  btn.disabled = true;
  showStatus('Suggesting relevant skills…');
  try {
    let suggested;
    try {
      const text = await callAI(`List 8 highly relevant technical and soft skills for a ${d.role}. Return ONLY a comma-separated list with no extra text, no numbering, no bullet points.`);
      suggested = text.split(',').map(s => s.trim().replace(/^[-•*\d.]+\s*/, '')).filter(Boolean);
    } catch (_) {
      await new Promise(r => setTimeout(r, 600));
      suggested = pickSkillSet(d.role);
    }
    suggested.forEach(s => { if (!window.skills.includes(s)) window.skills.push(s); });
    renderSkillTags(); updatePreview(); updateProgress(); saveSnapshot(); autoSave();
  } catch (e) { alert('Generation failed. Please try again.'); }
  btn.disabled = false;
  hideStatus();
}

// ===================== EXPERIENCE DESC =====================
async function enhanceExpDesc(id) {
  const exp = window.experiences.find(e => e.id === id);
  if (!exp || !exp.title) { alert('Please fill in the job title first.'); return; }
  showStatus(`Enhancing description for ${exp.title}…`);
  try {
    let text;
    try {
      text = await callAI(`Write 2-3 strong bullet-point achievement sentences for a resume. Role: ${exp.title} at ${exp.company || 'a company'}. ${exp.description ? 'Improve this: ' + exp.description : 'Write fresh impact-focused bullets.'} Use action verbs, quantify where possible. Return only the bullet text without bullet symbols.`);
    } catch (_) {
      await new Promise(r => setTimeout(r, 700));
      text = generateLocalExpDesc(exp);
    }
    exp.description = text.trim();
    renderExperiences(); updatePreview(); saveSnapshot(); autoSave();
  } catch (e) { alert('Generation failed. Please try again.'); }
  hideStatus();
}

// ===================== RESUME SCORE =====================
async function runResumeScore() {
  const d = getData();
  const btn = document.getElementById('score-btn');
  btn.disabled = true;
  showStatus('Analyzing your resume…');
  const resultEl = document.getElementById('score-result');
  resultEl.innerHTML = '<div class="ai-spinner" style="margin:0 auto;"></div>';

  try {
    const resumeText = `Name: ${d.name}, Role: ${d.role}, Email: ${d.email}, Phone: ${d.phone}, Location: ${d.location}, Summary: ${d.summary}, Skills: ${window.skills.join(', ')}, Experience: ${window.experiences.map(e => e.title + ' at ' + e.company + ': ' + e.description).join(' | ')}, Education: ${window.educations.map(e => e.degree + ' at ' + e.school).join(' | ')}`;
    let text;
    try {
      text = await callAI(`Analyze this resume and give a score from 0-100. Resume: ${resumeText}. Return ONLY valid JSON in this exact format: {"score": 85, "strengths": ["strength1","strength2"], "missing": ["missing1","missing2"], "tips": ["tip1","tip2"]}`);
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const score = json.score || 0;
      const color = score >= 80 ? '#34d399' : score >= 60 ? '#f59e0b' : '#f87171';
      resultEl.innerHTML = `
        <div class="score-circle" style="border-color:${color}">
          <div class="score-num" style="color:${color}">${score}</div>
          <div class="score-sub">/ 100</div>
        </div>
        ${json.strengths?.length ? `<div class="score-section"><div class="score-section-title" style="color:#34d399">✓ Strengths</div>${json.strengths.map(s => `<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}
        ${json.missing?.length ? `<div class="score-section"><div class="score-section-title" style="color:#f87171">✗ Missing</div>${json.missing.map(s => `<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}
        ${json.tips?.length ? `<div class="score-section"><div class="score-section-title" style="color:#f59e0b">💡 Tips</div>${json.tips.map(s => `<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}`;
    } catch (_) {
      // local scoring
      const checks = [!!d.name,!!d.role,!!d.email,!!d.phone,!!d.location,!!d.summary&&d.summary.length>50,window.skills.length>=3,window.experiences.some(e=>e.title&&e.description),window.educations.some(e=>e.degree)];
      const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
      const missing = [];
      if (!d.name) missing.push('Full name');
      if (!d.summary || d.summary.length < 50) missing.push('Professional summary (min 50 chars)');
      if (window.skills.length < 3) missing.push('At least 3 skills');
      if (!window.experiences.some(e => e.description)) missing.push('Experience descriptions');
      const color = score >= 80 ? '#34d399' : score >= 60 ? '#f59e0b' : '#f87171';
      resultEl.innerHTML = `
        <div class="score-circle" style="border-color:${color}">
          <div class="score-num" style="color:${color}">${score}</div>
          <div class="score-sub">/ 100</div>
        </div>
        ${missing.length ? `<div class="score-section"><div class="score-section-title" style="color:#f87171">✗ Missing</div>${missing.map(s => `<div class="score-item">• ${s}</div>`).join('')}</div>` : '<div style="color:#34d399;text-align:center;margin-top:12px;">Great resume!</div>'}`;
    }
  } catch (e) { resultEl.innerHTML = '<div style="color:var(--danger)">Analysis failed.</div>'; }
  btn.disabled = false;
  hideStatus();
}

// ===================== ATS CHECKER =====================
async function runATSCheck() {
  const d = getData();
  const btn = document.getElementById('ats-btn');
  btn.disabled = true;
  showStatus('Running ATS check…');
  const resultEl = document.getElementById('ats-result');
  resultEl.innerHTML = '<div class="ai-spinner" style="margin:0 auto;"></div>';

  try {
    const resumeText = `Role: ${d.role}, Summary: ${d.summary}, Skills: ${window.skills.join(', ')}, Experience: ${window.experiences.map(e => e.title + ' ' + e.description).join(' ')}`;
    let text;
    try {
      text = await callAI(`Check if this resume is ATS-friendly. Resume: ${resumeText}. Return ONLY valid JSON: {"ats_score": 78, "passed": ["check1","check2"], "failed": ["issue1","issue2"], "keywords_missing": ["kw1","kw2"]}`);
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const score = json.ats_score || 0;
      const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f87171';
      resultEl.innerHTML = `
        <div class="score-circle" style="border-color:${color}">
          <div class="score-num" style="color:${color}">${score}</div>
          <div class="score-sub">ATS Score</div>
        </div>
        ${json.passed?.length ? `<div class="score-section"><div class="score-section-title" style="color:#34d399">✓ Passed</div>${json.passed.map(s=>`<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}
        ${json.failed?.length ? `<div class="score-section"><div class="score-section-title" style="color:#f87171">✗ Issues</div>${json.failed.map(s=>`<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}
        ${json.keywords_missing?.length ? `<div class="score-section"><div class="score-section-title" style="color:#f59e0b">Keywords to Add</div>${json.keywords_missing.map(s=>`<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}`;
    } catch (_) {
      const issues = [];
      const passed = [];
      if (d.name) passed.push('Name present'); else issues.push('Missing name');
      if (d.email) passed.push('Email present'); else issues.push('Missing email');
      if (d.phone) passed.push('Phone present'); else issues.push('Missing phone');
      if (window.skills.length >= 5) passed.push('Good skill count'); else issues.push('Add more skills (5+)');
      if (d.summary) passed.push('Summary present'); else issues.push('Missing summary');
      if (window.experiences.some(e => e.description && e.description.length > 50)) passed.push('Detailed experience'); else issues.push('Add detailed experience descriptions');
      const score = Math.round((passed.length / (passed.length + issues.length)) * 100);
      const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f87171';
      resultEl.innerHTML = `
        <div class="score-circle" style="border-color:${color}">
          <div class="score-num" style="color:${color}">${score}</div>
          <div class="score-sub">ATS Score</div>
        </div>
        <div class="score-section"><div class="score-section-title" style="color:#34d399">✓ Passed</div>${passed.map(s=>`<div class="score-item">• ${s}</div>`).join('')}</div>
        ${issues.length ? `<div class="score-section"><div class="score-section-title" style="color:#f87171">✗ Issues</div>${issues.map(s=>`<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}`;
    }
  } catch (e) { resultEl.innerHTML = '<div style="color:var(--danger)">Check failed.</div>'; }
  btn.disabled = false;
  hideStatus();
}

// ===================== COVER LETTER =====================
async function generateCoverLetter() {
  const d = getData();
  if (!d.name || !d.role) { alert('Please fill in your name and role first.'); return; }
  const btn = document.getElementById('cover-btn');
  btn.disabled = true;
  showStatus('Writing your cover letter…');
  const resultEl = document.getElementById('cover-result');
  resultEl.value = '';

  try {
    const jobDesc = document.getElementById('cover-job-desc')?.value || '';
    let text;
    try {
      text = await callAI(`Write a professional cover letter for ${d.name} applying for a ${d.role} position. ${jobDesc ? 'Job description: ' + jobDesc : ''} Their summary: ${d.summary || 'experienced professional'}. Skills: ${window.skills.slice(0,5).join(', ')}. Experience: ${window.experiences.filter(e=>e.title).map(e=>e.title+' at '+e.company).join(', ')}. Write 3 paragraphs: opening, skills/experience match, closing. Professional tone. No placeholders.`);
    } catch (_) {
      const exp = window.experiences.find(e => e.title) || {};
      text = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${d.role} position. With my background in ${window.skills.slice(0,3).join(', ')}, I am confident in my ability to make a meaningful contribution to your team.\n\n${exp.title ? `In my previous role as ${exp.title}${exp.company ? ' at ' + exp.company : ''}, I ${exp.description ? exp.description.split('\n')[0].toLowerCase() : 'delivered impactful results and consistently exceeded expectations'}.` : `I bring a strong foundation of skills including ${window.skills.slice(0,4).join(', ')}, and a proven track record of delivering results.`} I am passionate about ${d.role.toLowerCase()} and thrive in collaborative, fast-paced environments.\n\nI would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your time and consideration.\n\nSincerely,\n${d.name}`;
    }
    resultEl.value = text.trim();
    document.getElementById('cover-output-wrap').style.display = 'block';
  } catch (e) { alert('Generation failed. Please try again.'); }
  btn.disabled = false;
  hideStatus();
}

function copyCoverLetter() {
  const el = document.getElementById('cover-result');
  navigator.clipboard.writeText(el.value).then(() => showToast('Cover letter copied!'));
}

// ===================== JOB DESCRIPTION MATCH =====================
async function runJobMatch() {
  const jobDesc = document.getElementById('jd-input')?.value?.trim();
  if (!jobDesc) { alert('Please paste a job description first.'); return; }
  const d = getData();
  const btn = document.getElementById('jd-btn');
  btn.disabled = true;
  showStatus('Matching resume to job description…');
  const resultEl = document.getElementById('jd-result');
  resultEl.innerHTML = '<div class="ai-spinner" style="margin:0 auto;"></div>';

  try {
    let text;
    try {
      text = await callAI(`Compare this resume to the job description and suggest improvements. Resume: Name: ${d.name}, Role: ${d.role}, Summary: ${d.summary}, Skills: ${window.skills.join(', ')}, Experience: ${window.experiences.map(e=>e.title+' '+e.description).join(' ')}. Job Description: ${jobDesc}. Return ONLY valid JSON: {"match_score": 72, "matched_keywords": ["kw1","kw2"], "missing_keywords": ["kw1","kw2"], "suggestions": ["suggestion1","suggestion2"]}`);
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const score = json.match_score || 0;
      const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f87171';
      resultEl.innerHTML = `
        <div class="score-circle" style="border-color:${color}">
          <div class="score-num" style="color:${color}">${score}</div>
          <div class="score-sub">Match %</div>
        </div>
        ${json.matched_keywords?.length ? `<div class="score-section"><div class="score-section-title" style="color:#34d399">✓ Matched Keywords</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${json.matched_keywords.map(k=>`<span class="skill-tag">${k}</span>`).join('')}</div></div>` : ''}
        ${json.missing_keywords?.length ? `<div class="score-section"><div class="score-section-title" style="color:#f87171">✗ Missing Keywords</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${json.missing_keywords.map(k=>`<span class="skill-tag" style="border-color:rgba(248,113,113,0.3);color:#f87171;">${k}</span>`).join('')}</div></div>` : ''}
        ${json.suggestions?.length ? `<div class="score-section"><div class="score-section-title" style="color:#f59e0b">💡 Suggestions</div>${json.suggestions.map(s=>`<div class="score-item">• ${s}</div>`).join('')}</div>` : ''}
        <button class="ai-btn mt-8" onclick="applyJobKeywords(${JSON.stringify(json.missing_keywords||[]).replace(/"/g,'&quot;')})">✦ Add Missing Keywords to Skills</button>`;
    } catch (_) {
      const jdWords = jobDesc.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      const myWords = (window.skills.join(' ') + ' ' + d.summary + ' ' + window.experiences.map(e=>e.description).join(' ')).toLowerCase();
      const matched = [...new Set(jdWords.filter(w => myWords.includes(w)))].slice(0, 8);
      const missing = [...new Set(jdWords.filter(w => !myWords.includes(w) && w.length > 5))].slice(0, 6);
      const score = Math.min(95, Math.round((matched.length / Math.max(matched.length + missing.length, 1)) * 100));
      const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f87171';
      resultEl.innerHTML = `
        <div class="score-circle" style="border-color:${color}">
          <div class="score-num" style="color:${color}">${score}</div>
          <div class="score-sub">Match %</div>
        </div>
        ${matched.length ? `<div class="score-section"><div class="score-section-title" style="color:#34d399">✓ Matched</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${matched.map(k=>`<span class="skill-tag">${k}</span>`).join('')}</div></div>` : ''}
        ${missing.length ? `<div class="score-section"><div class="score-section-title" style="color:#f87171">✗ Missing</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${missing.map(k=>`<span class="skill-tag" style="border-color:rgba(248,113,113,0.3);color:#f87171;">${k}</span>`).join('')}</div></div>` : ''}`;
    }
  } catch (e) { resultEl.innerHTML = '<div style="color:var(--danger)">Match failed.</div>'; }
  btn.disabled = false;
  hideStatus();
}

function applyJobKeywords(keywords) {
  if (!keywords || !keywords.length) return;
  keywords.forEach(k => { if (!window.skills.includes(k)) window.skills.push(k); });
  renderSkillTags(); updatePreview(); saveSnapshot(); autoSave();
  showToast(keywords.length + ' keywords added to skills!');
}
