const form = document.getElementById('form');
const submitBtn = document.getElementById('submit');
const resetBtn = document.getElementById('reset');
const errBox = document.getElementById('err');
const fs = document.getElementById('Financial_Stress');
const fsOut = document.getElementById('fs-out');
const FS_LABELS = ['No Financial Stress', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];

// Build dropdowns and radio groups from their data-options so the allowed values live in one place.
document.querySelectorAll('select[data-options]').forEach((s) => {
  s.innerHTML = '<option value="" selected disabled>Select an option</option>' +
    s.dataset.options.split(',').map((o) => `<option>${o}</option>`).join('');
});
document.querySelectorAll('[data-radio]').forEach((g) => {
  g.innerHTML = g.dataset.options.split(',').map((o, i) =>
    `<label><input type="radio" name="${g.dataset.radio}" value="${o}"${i === 0 ? ' required' : ''}>${o}</label>`).join('');
});

const showFs = () => { fsOut.textContent = `${fs.value} – ${FS_LABELS[fs.value]}`; };
fs.addEventListener('input', showFs);
showFs();

const showErr = (m) => { errBox.textContent = m; errBox.hidden = false; errBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
const setLoading = (on) => {
  submitBtn.disabled = resetBtn.disabled = on;
  submitBtn.innerHTML = on ? '<span class="spin"></span>Generating results…' : 'Submit Assessment';
  form.setAttribute('aria-busy', on);
};

form.addEventListener('reset', () => setTimeout(() => { showFs(); errBox.hidden = true; }, 0));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  errBox.hidden = true;
  const data = Object.fromEntries(new FormData(form));
  data.Age = parseInt(data.Age, 10);
  data.CGPA = parseFloat(data.CGPA);
  data.Financial_Stress = parseInt(data.Financial_Stress, 10);
  setLoading(true);
  try {
    const res = await fetch('api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'The prediction service did not respond. Please try again.');
    sessionStorage.setItem('mindcare_result', JSON.stringify({ input: data, result: body, at: new Date().toISOString() }));
    location.href = 'results.html';
  } catch (err) {
    showErr(err.message);
    setLoading(false);
  }
});
