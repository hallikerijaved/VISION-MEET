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

function renderStitchModern(d, skills, experiences, educations, accent) {
  const expHtml = experiences.filter(e => e.title || e.company).map(e => `
    <div class="rsm-item">
      <div class="rsm-item-head">
        <div class="rsm-item-title">${e.title || ''}</div>
        <div class="rsm-item-date">${e.dates || ''}</div>
      </div>
      <div class="rsm-item-sub">${e.company || ''}</div>
      <div class="rsm-item-desc">${e.description || ''}</div>
    </div>`).join('');

  const eduHtml = educations.filter(e => e.degree || e.school).map(e => `
    <div class="rsm-item">
      <div class="rsm-item-head">
        <div class="rsm-item-title">${e.degree || ''}</div>
        <div class="rsm-item-date">${e.dates || ''}</div>
      </div>
      <div class="rsm-item-sub">${e.school || ''}</div>
    </div>`).join('');

  const skillsHtml = skills.map(s => `<div class="rsm-skill">${s}</div>`).join('');

  return `
    <div class="resume-stitch-modern">
      <header class="rsm-header">
        <div class="rsm-name">${d.name || 'Your Name'}</div>
        <div class="rsm-role">${d.role || ''}</div>
        <div class="rsm-contact">
          ${d.email ? `<div class="rsm-contact-item">✉ ${d.email}</div>` : ''}
          ${d.phone ? `<div class="rsm-contact-item">✆ ${d.phone}</div>` : ''}
          ${d.location ? `<div class="rsm-contact-item">⌖ ${d.location}</div>` : ''}
          ${d.website ? `<div class="rsm-contact-item">⇗ ${d.website}</div>` : ''}
        </div>
      </header>

      ${d.summary ? `
      <div class="rsm-summary-box">
        <p>${d.summary}</p>
      </div>` : ''}

      <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
        ${expHtml ? `
        <section class="rsm-section">
          <div class="rsm-section-title">Experience</div>
          ${expHtml}
        </section>` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          ${eduHtml ? `
          <section class="rsm-section">
            <div class="rsm-section-title">Education</div>
            ${eduHtml}
          </section>` : ''}

          ${skillsHtml ? `
          <section class="rsm-section">
            <div class="rsm-section-title">Expertise</div>
            <div class="rsm-skills">${skillsHtml}</div>
          </section>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderStitchExecutive(d, skills, experiences, educations, accent) {
  const expHtml = experiences.filter(e => e.title || e.company).map(e => `
    <div class="rse-exp">
      <div class="rse-exp-head">
        <div class="rse-exp-title">${e.title || ''}</div>
        <div class="rse-exp-date">${e.dates || ''}</div>
      </div>
      <div class="rse-exp-company">${e.company || ''}</div>
      <div class="rse-exp-desc">${e.description || ''}</div>
    </div>`).join('');

  const eduHtml = educations.filter(e => e.degree || e.school).map(e => `
    <div class="rse-edu-item">
      <div class="rse-edu-degree">${e.degree || ''}</div>
      <div class="rse-edu-school">${e.school || ''}</div>
    </div>`).join('');

  const skillsHtml = skills.map((s, i) => `
    <div class="rse-skill-item">
      <div class="rse-skill-name">${s}</div>
      <div class="rse-skill-bar"><div class="rse-skill-fill" style="width:${95 - i * 5}%"></div></div>
    </div>`).join('');

  return `
    <div class="resume-stitch-executive">
      <aside class="rse-sidebar">
        <section>
          <div class="rse-side-section-title">Contact Info</div>
          ${d.email ? `<div class="rse-contact-item"><div class="rse-contact-label">Email</div><div class="rse-contact-val">${d.email}</div></div>` : ''}
          ${d.phone ? `<div class="rse-contact-item"><div class="rse-contact-label">Phone</div><div class="rse-contact-val">${d.phone}</div></div>` : ''}
          ${d.location ? `<div class="rse-contact-item"><div class="rse-contact-label">Location</div><div class="rse-contact-val">${d.location}</div></div>` : ''}
          ${d.website ? `<div class="rse-contact-item"><div class="rse-contact-label">Link</div><div class="rse-contact-val">${d.website}</div></div>` : ''}
        </section>

        ${skillsHtml ? `
        <section>
          <div class="rse-side-section-title">Core Skills</div>
          ${skillsHtml}
        </section>` : ''}

        ${eduHtml ? `
        <section>
          <div class="rse-side-section-title">Academic History</div>
          ${eduHtml}
        </section>` : ''}
      </aside>

      <main class="rse-main">
        <div class="rse-name">${d.name || 'Your Name'}</div>
        <div class="rse-role">${d.role || ''}</div>

        ${d.summary ? `
        <div class="rse-summary">
          ${d.summary}
        </div>` : ''}

        ${expHtml ? `
        <section class="rse-section">
          <div class="rse-section-title">Professional Experience</div>
          ${expHtml}
        </section>` : ''}
      </main>
    </div>
  `;
}

