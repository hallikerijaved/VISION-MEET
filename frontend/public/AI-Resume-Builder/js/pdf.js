// ===================== PDF EXPORT =====================

function _doExportPDF() {
  const el = document.getElementById('resume-output');
  const name = document.getElementById('name')?.value.trim() || 'resume';
  const btn = document.getElementById('export-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="ai-spinner" style="border-top-color:#fff;display:inline-block;"></span> Generating…';

  const opt = {
    margin: 0,
    filename: `${name.replace(/\s+/g, '_')}_resume.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'px', format: [680, 960], orientation: 'portrait' }
  };

  html2pdf().set(opt).from(el).save().then(() => {
    btn.disabled = false;
    btn.innerHTML = '⬇ Export PDF';
  }).catch(() => {
    btn.disabled = false;
    btn.innerHTML = '⬇ Export PDF';
    alert('PDF export failed. Please try again.');
  });
}
