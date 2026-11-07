const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const BRIDGE = path.join(__dirname, 'predict_cli.py');

const LEVEL = ['Low', 'Moderate', 'High'];
const QUALITY = ['Poor', 'Average', 'Good'];
const YES_NO = ['No', 'Yes'];
const CATEGORICAL = {
  Course: ['Medical', 'Law', 'Engineering', 'Computer Science', 'Business', 'Others'],
  Female: ['Male', 'Female'],
  Sleep_Quality: QUALITY,
  Physical_Activity: LEVEL,
  Diet_Quality: QUALITY,
  Social_Support: LEVEL,
  Relationship_Status: ['Single', 'Committed', 'Married'],
  Substance_Use: ['Frequently', 'Occasionally', 'Never'],
  Family_History: YES_NO,
  Chronic_Illness: YES_NO,
  Extracurricular_Activity: LEVEL,
  Residence_Type: ['On-Campus', 'Off-Campus', 'With Family'],
};

// Returns { input } or { error }. Keeps the exact 15 feature names the model expects.
function validate(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be JSON.' };
  const input = {};
  const age = Number(body.Age);
  const cgpa = Number(body.CGPA);
  const fin = Number(body.Financial_Stress);
  if (!Number.isInteger(age) || age < 15 || age > 60) return { error: 'Age must be a whole number between 15 and 60.' };
  if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 4) return { error: 'CGPA must be a number between 0 and 4.' };
  if (!Number.isInteger(fin) || fin < 0 || fin > 5) return { error: 'Financial_Stress must be a whole number from 0 to 5.' };
  input.Age = age;
  input.CGPA = cgpa;
  input.Financial_Stress = fin;
  for (const [field, allowed] of Object.entries(CATEGORICAL)) {
    if (!allowed.includes(body[field])) return { error: `Invalid or missing value for ${field}.` };
    input[field] = body[field];
  }
  return { input };
}

function runModel(input) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON, [BRIDGE], { cwd: __dirname });
    let out = '';
    let err = '';
    const timer = setTimeout(() => { py.kill(); reject(new Error('The model took too long to respond.')); }, 60000);
    py.stdout.on('data', (d) => (out += d));
    py.stderr.on('data', (d) => (err += d));
    py.on('error', (e) => { clearTimeout(timer); reject(new Error(`Could not start Python (${PYTHON}): ${e.message}`)); });
    py.on('close', (code) => {
      clearTimeout(timer);
      let parsed;
      try { parsed = JSON.parse(out.trim().split('\n').pop()); } catch (e) { /* handled below */ }
      if (code !== 0 || !parsed || parsed.error) {
        console.error(err || out);
        return reject(new Error((parsed && parsed.error) || 'The model could not produce a prediction.'));
      }
      resolve(parsed);
    });
    py.stdin.write(JSON.stringify(input));
    py.stdin.end();
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/predict', async (req, res) => {
  const { input, error } = validate(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const raw = await runModel(input);
    // Python returns parallel lists; reshape to { stress: {...}, anxiety: {...}, depression: {...} }
    const result = {};
    raw.Condition.forEach((name, i) => {
      result[name] = {
        severity: raw.Prediction[i],
        confidence: raw.Confidence[i],
        score: (raw.Prediction_Score || raw.Score) ? (raw.Prediction_Score || raw.Score)[i] : null,
      };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use((err, req, res, next) => res.status(400).json({ error: 'Invalid request.' }));

app.listen(PORT, () => console.log(`MindCare running at http://localhost:${PORT}`));
