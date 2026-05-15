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
  showStatus('Analyzing resume impact & structure…');
  const resultEl = document.getElementById('score-result');
  resultEl.innerHTML = '<div class="ai-spinner" style="margin:0 auto;"></div>';

  try {
    const resumeText = `Name: ${d.name}, Role: ${d.role}, Email: ${d.email}, Phone: ${d.phone}, Location: ${d.location}, Summary: ${d.summary}, Skills: ${window.skills.join(', ')}, Experience: ${window.experiences.map(e => e.title + ' at ' + e.company + ': ' + e.description).join(' | ')}, Education: ${window.educations.map(e => e.degree + ' at ' + e.school).join(' | ')}`;
    
    let text;
    try {
      const prompt = `Act as an expert career coach and professional resume reviewer.
      Analyze this resume data and provide a rigorous evaluation based on modern recruitment standards (impact, quantifying results, skill relevance, and clarity).
      
      Resume Data: ${resumeText}
      
      Return ONLY a JSON object with this structure:
      {
        "score": number (0-100),
        "strengths": ["string", "string"],
        "missing": ["string", "string"],
        "tips": ["specific actionable advice", "specific actionable advice"]
      }
      Do not include any other text or explanation.`;
      
      text = await callAI(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const json = JSON.parse(jsonMatch[0]);
      
      const score = json.score || 0;
      const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
      
      resultEl.innerHTML = `
        <div class="score-card">
          <div class="score-circle" style="border-color:${color}44; background:${color}08">
            <div class="score-num" style="color:${color}">${score}</div>
            <div class="score-sub">Overall Score</div>
          </div>
          <div class="score-metrics">
            ${json.strengths?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#10b981">✦ Top Strengths</div>
              ${json.strengths.map(s => `<div class="score-item"><span>✓</span> ${s}</div>`).join('')}
            </div>` : ''}
            ${json.missing?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#ef4444">⚠ Critical Gaps</div>
              ${json.missing.map(s => `<div class="score-item"><span>×</span> ${s}</div>`).join('')}
            </div>` : ''}
            ${json.tips?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#3b82f6">💡 Expert Advice</div>
              ${json.tips.map(s => `<div class="score-item"><span>→</span> ${s}</div>`).join('')}
            </div>` : ''}
          </div>
        </div>`;
    } catch (err) {
      console.error('Score Parse Error:', err);
      // Enhanced weighted local scoring
      let score = 0;
      const missing = [];
      
      if (d.name) score += 10; else missing.push('Full contact information');
      if (d.role) score += 10;
      if (d.summary && d.summary.length > 100) score += 20; else if (d.summary) score += 10; else missing.push('Professional summary (impact-focused)');
      if (window.skills.length >= 8) score += 20; else if (window.skills.length >= 4) score += 10; else missing.push('Technical & soft skill variety');
      if (window.experiences.length >= 2) score += 20; else if (window.experiences.length >= 1) score += 10;
      if (window.experiences.some(e => e.description && e.description.length > 100)) score += 20; else missing.push('Quantified achievements in experience');
      
      const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
      resultEl.innerHTML = `
        <div class="score-card">
          <div class="score-circle" style="border-color:${color}44; background:${color}08">
            <div class="score-num" style="color:${color}">${score}</div>
            <div class="score-sub">Draft Score</div>
          </div>
          <div class="score-metrics">
            <div class="score-section">
              <div class="score-section-title" style="color:#ef4444">Areas for Improvement</div>
              ${missing.map(s => `<div class="score-item"><span>×</span> ${s}</div>`).join('')}
              <div class="score-item" style="margin-top:8px; opacity:0.8; font-style:italic; font-size:11px;">Note: Complete your profile for a more accurate AI analysis.</div>
            </div>
          </div>
        </div>`;
    }
  } catch (e) { 
    resultEl.innerHTML = '<div class="alert alert-error">Analysis service temporarily unavailable.</div>'; 
  }
  btn.disabled = false;
  hideStatus();
}

// ===================== ATS CHECKER =====================
async function runATSCheck() {
  const d = getData();
  const btn = document.getElementById('ats-btn');
  btn.disabled = true;
  showStatus('Simulating ATS parsing engine…');
  const resultEl = document.getElementById('ats-result');
  resultEl.innerHTML = '<div class="ai-spinner" style="margin:0 auto;"></div>';

  try {
    const resumeText = `Role: ${d.role}, Summary: ${d.summary}, Skills: ${window.skills.join(', ')}, Experience: ${window.experiences.map(e => e.title + ' ' + e.description).join(' ')}`;
    
    let text;
    try {
      const prompt = `Act as an ATS (Applicant Tracking System) parser.
      Review the following resume for parseability, keyword density, and formatting issues that usually cause resumes to be rejected by automated systems.
      
      Resume Data: ${resumeText}
      
      Return ONLY a JSON object:
      {
        "ats_score": number (0-100),
        "passed": ["string", "string"],
        "failed": ["formatting or content issue", "formatting or content issue"],
        "keywords_missing": ["industry keyword 1", "industry keyword 2"]
      }
      Do not include any other text.`;
      
      text = await callAI(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const json = JSON.parse(jsonMatch[0]);
      
      const score = json.ats_score || 0;
      const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
      
      resultEl.innerHTML = `
        <div class="score-card">
          <div class="score-circle" style="border-color:${color}44; background:${color}08">
            <div class="score-num" style="color:${color}">${score}</div>
            <div class="score-sub">ATS Compatibility</div>
          </div>
          <div class="score-metrics">
            ${json.passed?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#10b981">✓ ATS Optimized</div>
              ${json.passed.map(s => `<div class="score-item"><span>✓</span> ${s}</div>`).join('')}
            </div>` : ''}
            ${json.failed?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#ef4444">✗ Parse Issues</div>
              ${json.failed.map(s => `<div class="score-item"><span>!</span> ${s}</div>`).join('')}
            </div>` : ''}
            ${json.keywords_missing?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#f59e0b">Suggested Keywords</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
                ${json.keywords_missing.map(s => `<span class="skill-tag" style="font-size:10px; padding:2px 6px;">${s}</span>`).join('')}
              </div>
            </div>` : ''}
          </div>
        </div>`;
    } catch (err) {
      console.error('ATS Parse Error:', err);
      // Local ATS heuristic check
      const issues = [];
      const passed = [];
      
      if (d.role) passed.push('Job title clarity'); else issues.push('Missing targeted job title');
      if (window.skills.length >= 6) passed.push('Keyword density'); else issues.push('Low keyword count (aim for 10+)');
      if (window.experiences.every(e => e.description && e.description.length > 30)) passed.push('Standard formatting'); else issues.push('Experience descriptions too short for parsing');
      if (!d.summary?.includes('placeholder')) passed.push('Unique content'); else issues.push('Generic summary detected');
      
      const score = Math.round((passed.length / (passed.length + issues.length)) * 100);
      const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
      
      resultEl.innerHTML = `
        <div class="score-card">
          <div class="score-circle" style="border-color:${color}44; background:${color}08">
            <div class="score-num" style="color:${color}">${score}</div>
            <div class="score-sub">ATS Heuristic</div>
          </div>
          <div class="score-metrics">
            <div class="score-section">
              <div class="score-section-title" style="color:#10b981">Heuristic Success</div>
              ${passed.map(s => `<div class="score-item"><span>✓</span> ${s}</div>`).join('')}
            </div>
            ${issues.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#ef4444">Potential Dealbreakers</div>
              ${issues.map(s => `<div class="score-item"><span>!</span> ${s}</div>`).join('')}
            </div>` : ''}
          </div>
        </div>`;
    }
  } catch (e) { 
    resultEl.innerHTML = '<div class="alert alert-error">ATS engine failed to initialize.</div>'; 
  }
  btn.disabled = false;
  hideStatus();
}

// ===================== COVER LETTER =====================
async function generateCoverLetter() {
  const d = getData();
  if (!d.name || !d.role) { alert('Please fill in your name and role first.'); return; }
  const btn = document.getElementById('cover-btn');
  btn.disabled = true;
  showStatus('Writing your premium cover letter…');
  const resultEl = document.getElementById('cover-result');
  resultEl.value = '';

  try {
    const jobDesc = document.getElementById('cover-job-desc')?.value || '';
    let text;
    try {
      const prompt = `Act as an executive career coach. Write a high-impact, consultative cover letter for ${d.name} for a ${d.role} role.
      ${jobDesc ? 'Tailor the letter specifically to these requirements: ' + jobDesc : ''}
      
      Candidate Profile:
      - Summary: ${d.summary}
      - Core Competencies: ${window.skills.join(', ')}
      - Latest Experience: ${window.experiences[0]?.title || 'Professional'} at ${window.experiences[0]?.company || 'Current Company'}
      
      Requirements:
      - Tone: Professional, persuasive, and results-oriented.
      - Length: ~250-300 words.
      - Structure: Compelling hook, evidence-based value proposition, and professional call to action.
      - Strictly NO placeholders or brackets like [Company Name]. If details are missing, write naturally.`;
      
      text = await callAI(prompt);
      text = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    } catch (_) {
      const exp = window.experiences.find(e => e.title) || {};
      text = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${d.role} position. With my background in ${window.skills.slice(0,3).join(', ')}, I am confident in my ability to make a meaningful contribution to your team.\n\n${exp.title ? `In my previous role as ${exp.title}${exp.company ? ' at ' + exp.company : ''}, I ${exp.description ? exp.description.split('\n')[0].toLowerCase() : 'delivered impactful results and consistently exceeded expectations'}.` : `I bring a strong foundation of skills including ${window.skills.slice(0,4).join(', ')}, and a proven track record of delivering results.`} I am passionate about ${d.role.toLowerCase()} and thrive in collaborative, fast-paced environments.\n\nI would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your time and consideration.\n\nSincerely,\n${d.name}`;
    }
    resultEl.value = text;
    document.getElementById('cover-output-wrap').style.display = 'block';
  } catch (e) { 
    alert('Cover letter generation failed. Please check your connection.'); 
  }
  btn.disabled = false;
  hideStatus();
}

function copyCoverLetter() {
  const el = document.getElementById('cover-result');
  if (!el.value) return;
  navigator.clipboard.writeText(el.value).then(() => {
    const btn = document.querySelector('.btn-ghost.btn-sm[onclick="copyCoverLetter()"]');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<span>✓</span> Copied!';
    setTimeout(() => btn.innerHTML = oldHtml, 2000);
  });
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
      const prompt = `Act as a recruitment specialist. Compare this candidate's resume against the provided Job Description.
      Identify keyword matches, missing critical keywords, and provide a match percentage.
      
      Resume Data: Summary: ${d.summary}, Skills: ${window.skills.join(', ')}, Experience: ${window.experiences.map(e=>e.title+' '+e.description).join(' ')}
      Job Description: ${jobDesc}
      
      Return ONLY a JSON object:
      {
        "match_score": number (0-100),
        "matched_keywords": ["string", "string"],
        "missing_keywords": ["string", "string"],
        "suggestions": ["how to better align the resume", "how to better align the resume"]
      }
      Do not include any other text.`;
      
      text = await callAI(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const json = JSON.parse(jsonMatch[0]);
      
      const score = json.match_score || 0;
      const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
      
      resultEl.innerHTML = `
        <div class="score-card">
          <div class="score-circle" style="border-color:${color}44; background:${color}08">
            <div class="score-num" style="color:${color}">${score}</div>
            <div class="score-sub">Match Rate</div>
          </div>
          <div class="score-metrics">
            ${json.matched_keywords?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#10b981">✓ Matched Keywords</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
                ${json.matched_keywords.map(k => `<span class="skill-tag" style="background:rgba(16,185,129,0.1); color:#10b981; border-color:rgba(16,185,129,0.2)">${k}</span>`).join('')}
              </div>
            </div>` : ''}
            ${json.missing_keywords?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#ef4444">✗ Missing Keywords</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
                ${json.missing_keywords.map(k => `<span class="skill-tag" style="background:rgba(239,68,68,0.05); color:#ef4444; border-color:rgba(239,68,68,0.15)">${k}</span>`).join('')}
              </div>
            </div>` : ''}
            ${json.suggestions?.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#3b82f6">💡 Tailoring Tips</div>
              ${json.suggestions.map(s => `<div class="score-item"><span>→</span> ${s}</div>`).join('')}
            </div>` : ''}
            <button class="ai-btn mt-12" onclick="applyJobKeywords(${JSON.stringify(json.missing_keywords || []).replace(/"/g, '&quot;')})">✦ Auto-Apply Missing Skills</button>
          </div>
        </div>`;
    } catch (err) {
      console.error('Job Match Error:', err);
      // Smarter local matching
      const jdWords = jobDesc.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      const myContent = (window.skills.join(' ') + ' ' + d.summary + ' ' + window.experiences.map(e=>e.description).join(' ')).toLowerCase();
      
      const matched = [...new Set(jdWords.filter(w => myContent.includes(w)))].slice(0, 10);
      const missing = [...new Set(jdWords.filter(w => !myContent.includes(w)))].slice(0, 8);
      
      const score = Math.min(95, Math.round((matched.length / Math.max(matched.length + missing.length, 1)) * 100));
      const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
      
      resultEl.innerHTML = `
        <div class="score-card">
          <div class="score-circle" style="border-color:${color}44; background:${color}08">
            <div class="score-num" style="color:${color}">${score}</div>
            <div class="score-sub">Keyword Match</div>
          </div>
          <div class="score-metrics">
            <div class="score-section">
              <div class="score-section-title" style="color:#10b981">Found in JD</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${matched.map(k => `<span class="skill-tag">${k}</span>`).join('')}
              </div>
            </div>
            ${missing.length ? `<div class="score-section">
              <div class="score-section-title" style="color:#ef4444">Gaps Detected</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${missing.map(k => `<span class="skill-tag" style="color:#ef4444; border-color:rgba(239,68,68,0.2)">${k}</span>`).join('')}
              </div>
            </div>` : ''}
          </div>
        </div>`;
    }
  } catch (e) { 
    resultEl.innerHTML = '<div class="alert alert-error">Matching service failed.</div>'; 
  }
  btn.disabled = false;
  hideStatus();
}

function applyJobKeywords(keywords) {
  if (!keywords || !keywords.length) return;
  keywords.forEach(k => { if (!window.skills.includes(k)) window.skills.push(k); });
  renderSkillTags(); updatePreview(); saveSnapshot(); autoSave();
  showToast(keywords.length + ' keywords added to skills!');
}
