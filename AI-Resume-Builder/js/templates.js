// ===================== TEMPLATE RENDERERS =====================

function getInitials(name) {
  return (name || 'YN').split(' ').map(p => p[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'YN';
}

function renderClassic(d, skills, experiences, educations, accent) {
  const expHtml = experiences.filter(e => e.title || e.company).map(e => `
    <div class="rc-exp">
      <div class="rc-exp-row">
        <div class="rc-exp-title">${e.title || ''}</div>
        <div class="rc-exp-date">${e.dates || ''}</div>
      </div>
      <div class="rc-exp-company">${e.company || ''}</div>
      <div class="rc-exp-desc">${e.description || ''}</div>
    </div>`).join('');
  const eduHtml = educations.filter(e => e.degree || e.school).map(e => `
    <div class="rc-exp">
      <div class="rc-exp-row">
        <div class="rc-exp-title">${e.degree || ''}</div>
        <div class="rc-exp-date">${e.dates || ''}</div>
      </div>
      <div class="rc-exp-company">${e.school || ''}</div>
    </div>`).join('');
  const skillsHtml = skills.map(s => `<div class="rc-skill">${s}</div>`).join('');
  return `<div class="resume-classic">
    <div class="rc-header">
      <div class="rc-name" style="color:${accent}">${d.name || 'Your Name'}</div>
      <div class="rc-role">${d.role || ''}</div>
      <div class="rc-contact">${[d.email, d.phone, d.location, d.website].filter(Boolean).join(' · ')}</div>
    </div>
    ${d.summary ? `<div class="rc-section"><div class="rc-section-title" style="color:${accent}">Summary</div><div class="rc-summary">${d.summary}</div></div>` : ''}
    ${expHtml ? `<div class="rc-section"><div class="rc-section-title" style="color:${accent}">Experience</div>${expHtml}</div>` : ''}
    ${eduHtml ? `<div class="rc-section"><div class="rc-section-title" style="color:${accent}">Education</div>${eduHtml}</div>` : ''}
    ${skillsHtml ? `<div class="rc-section"><div class="rc-section-title" style="color:${accent}">Skills</div><div class="rc-skills">${skillsHtml}</div></div>` : ''}
  </div>`;
}

function renderModern(d, skills, experiences, educations, accent) {
  const expHtml = experiences.filter(e => e.title || e.company).map(e => `
    <div class="rm-exp">
      <div class="rm-exp-dot" style="background:${accent}"></div>
      <div>
        <div class="rm-exp-title">${e.title || ''}</div>
        <div class="rm-exp-meta">${e.company || ''}${e.dates ? ' · ' + e.dates : ''}</div>
        <div class="rm-exp-desc">${e.description || ''}</div>
      </div>
    </div>`).join('');
  const eduHtml = educations.filter(e => e.degree || e.school).map(e => `
    <div class="rm-exp">
      <div class="rm-exp-dot" style="background:${accent}"></div>
      <div>
        <div class="rm-exp-title">${e.degree || ''}</div>
        <div class="rm-exp-meta">${e.school || ''}${e.dates ? ' · ' + e.dates : ''}</div>
      </div>
    </div>`).join('');
  const skillBars = skills.slice(0, 7).map((s, i) => `
    <div class="rm-skill-bar">
      <div class="rm-skill-name">${s}</div>
      <div class="rm-skill-track"><div class="rm-skill-fill" style="width:${88 - i * 7}%;background:${accent}"></div></div>
    </div>`).join('');
  return `<div class="resume-modern">
    <div class="rm-left">
      <div class="rm-avatar" style="background:${accent}">${getInitials(d.name)}</div>
      <div class="rm-name">${d.name || 'Your Name'}</div>
      <div class="rm-role">${d.role || ''}</div>
      ${d.email || d.phone || d.location || d.website ? `<div class="rm-sec">
        <div class="rm-sec-title" style="color:${accent}">Contact</div>
        ${d.email ? `<div class="rm-contact-item">✉ ${d.email}</div>` : ''}
        ${d.phone ? `<div class="rm-contact-item">✆ ${d.phone}</div>` : ''}
        ${d.location ? `<div class="rm-contact-item">⌖ ${d.location}</div>` : ''}
        ${d.website ? `<div class="rm-contact-item">⇗ ${d.website}</div>` : ''}
      </div>` : ''}
      ${skillBars ? `<div class="rm-sec"><div class="rm-sec-title" style="color:${accent}">Skills</div>${skillBars}</div>` : ''}
    </div>
    <div class="rm-right">
      <div class="rm-greeting">Hello, I'm ${d.name ? d.name.split(' ')[0] : 'there'}.</div>
      ${d.summary ? `<div class="rm-summary">${d.summary}</div>` : ''}
      ${expHtml ? `<div class="rm-section"><div class="rm-section-title" style="color:${accent}">Experience</div>${expHtml}</div>` : ''}
      ${eduHtml ? `<div class="rm-section"><div class="rm-section-title" style="color:${accent}">Education</div>${eduHtml}</div>` : ''}
    </div>
  </div>`;
}

function renderMinimal(d, skills, experiences, educations, accent) {
  const expHtml = experiences.filter(e => e.title || e.company).map(e => `
    <div class="rmin-exp">
      <div class="rmin-exp-date">${e.dates || ''}</div>
      <div>
        <div class="rmin-exp-title">${e.title || ''}</div>
        <div class="rmin-exp-company">${e.company || ''}</div>
        <div class="rmin-exp-desc">${e.description || ''}</div>
      </div>
    </div>`).join('');
  const eduHtml = educations.filter(e => e.degree || e.school).map(e => `
    <div class="rmin-exp">
      <div class="rmin-exp-date">${e.dates || ''}</div>
      <div>
        <div class="rmin-exp-title">${e.degree || ''}</div>
        <div class="rmin-exp-company">${e.school || ''}</div>
      </div>
    </div>`).join('');
  const skillsHtml = skills.map(s => `<div class="rmin-skill">${s}</div>`).join('');
  return `<div class="resume-minimal">
    <div class="rmin-name" style="color:${accent}">${d.name || 'Your Name'}</div>
    <div class="rmin-role">${d.role || ''}</div>
    <div class="rmin-contact">${[d.email, d.phone, d.location, d.website].filter(Boolean).join(' · ')}</div>
    ${d.summary ? `<div class="rmin-section"><div class="rmin-section-title">About</div><div class="rmin-summary">${d.summary}</div></div>` : ''}
    ${expHtml ? `<div class="rmin-section"><div class="rmin-section-title">Experience</div>${expHtml}</div>` : ''}
    ${eduHtml ? `<div class="rmin-section"><div class="rmin-section-title">Education</div>${eduHtml}</div>` : ''}
    ${skillsHtml ? `<div class="rmin-section"><div class="rmin-section-title">Skills</div><div class="rmin-skills">${skillsHtml}</div></div>` : ''}
  </div>`;
}

function renderCreative(d, skills, experiences, educations, accent) {
  const expHtml = experiences.filter(e => e.title || e.company).map(e => `
    <div class="rcr-exp" style="border-color:${accent}">
      <div class="rcr-exp-title">${e.title || ''}</div>
      <div class="rcr-exp-meta">${e.company || ''}${e.dates ? ' | ' + e.dates : ''}</div>
      <div class="rcr-exp-desc">${e.description || ''}</div>
    </div>`).join('');
  const eduHtml = educations.filter(e => e.degree || e.school).map(e => `
    <div class="rcr-exp" style="border-color:${accent}">
      <div class="rcr-exp-title">${e.degree || ''}</div>
      <div class="rcr-exp-meta">${e.school || ''}${e.dates ? ' | ' + e.dates : ''}</div>
    </div>`).join('');
  const skillBars = skills.slice(0, 7).map((s, i) => `
    <div class="rcr-skill">
      <div class="rcr-skill-name">${s}</div>
      <div class="rcr-skill-track"><div class="rcr-skill-fill" style="width:${92 - i * 8}%;background:${accent}"></div></div>
    </div>`).join('');
  return `<div class="resume-creative">
    <div class="rcr-top" style="background:${accent}">
      <div class="rcr-name">${d.name || 'Your Name'}</div>
      <div class="rcr-role">${d.role || ''}</div>
      <div class="rcr-contacts">
        ${d.email ? `<div class="rcr-contact-item">✉ ${d.email}</div>` : ''}
        ${d.phone ? `<div class="rcr-contact-item">✆ ${d.phone}</div>` : ''}
        ${d.location ? `<div class="rcr-contact-item">⌖ ${d.location}</div>` : ''}
        ${d.website ? `<div class="rcr-contact-item">⇗ ${d.website}</div>` : ''}
      </div>
    </div>
    <div class="rcr-body">
      <div>
        ${d.summary ? `<div class="rcr-section"><div class="rcr-section-title" style="color:${accent}">About Me</div><div class="rcr-summary">${d.summary}</div></div>` : ''}
        ${expHtml ? `<div class="rcr-section"><div class="rcr-section-title" style="color:${accent}">Experience</div>${expHtml}</div>` : ''}
        ${eduHtml ? `<div class="rcr-section"><div class="rcr-section-title" style="color:${accent}">Education</div>${eduHtml}</div>` : ''}
      </div>
      ${skillBars ? `<div><div class="rcr-section-title" style="color:${accent}">Skills</div>${skillBars}</div>` : ''}
    </div>
  </div>`;
}
