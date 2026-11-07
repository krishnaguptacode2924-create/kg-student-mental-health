(function () {
  const NAMES = { stress: 'Stress', anxiety: 'Anxiety', depression: 'Depression' };
  const ORDER = ['stress', 'anxiety', 'depression'];
  const CLS = { Mild: 'mild', Moderate: 'mod', Severe: 'sev' };
  const MID = { Mild: 30, Moderate: 90, Severe: 150 }; // needle angle when the model returns no numeric score
  const EXPLAIN = {
    stress: {
      Mild: 'Your answers point to a manageable level of stress. Everyday pressures seem to be within what you can handle.',
      Moderate: 'Your answers point to a noticeable level of stress. It may weigh on some days more than others.',
      Severe: 'Your answers point to a high level of stress. It is worth taking seriously and talking through with someone you trust.',
    },
    anxiety: {
      Mild: 'Your answers suggest only mild worry or tension. This is common and often eases with good routines.',
      Moderate: 'Your answers suggest a noticeable level of anxiety. Regular habits that calm your mind can help.',
      Severe: 'Your answers suggest a high level of anxiety. Support from a counsellor or doctor could make a real difference.',
    },
    depression: {
      Mild: 'Your answers suggest low-mood symptoms are mild at the moment. Keep an eye on how you feel over time.',
      Moderate: 'Your answers suggest a noticeable level of low mood. Reaching out to others can help.',
      Severe: 'Your answers suggest a high level of low mood. Please consider talking to a professional soon.',
    },
  };

  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('mindcare_result')); } catch (e) { /* no stored result */ }
  if (!saved || !saved.result) {
    document.getElementById('main').innerHTML =
      '<div class="empty"><h1>No results yet</h1><p>Complete the assessment to see your results here.</p><a class="btn" href="assess.html">Start Assessment</a></div>';
    return;
  }
  const R = saved.result;

  // ---- Gauge geometry: 180° meter, three equal zones, six score steps (0–5) ----
  const CX = 120, CY = 118, RAD = 90;
  const pt = (deg, r = RAD) => { const a = deg * Math.PI / 180; return [CX - r * Math.cos(a), CY - r * Math.sin(a)]; };
  const arc = (a, b) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${RAD} ${RAD} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };

  function gauge(key) {
    const r = R[key];
    const hasScore = Number.isInteger(r.score);
    const deg = hasScore ? (r.score + 0.5) / 6 * 180 : MID[r.severity];
    const zones = [[0, 58.5, 'mild'], [61.5, 118.5, 'mod'], [121.5, 180, 'sev']]
      .map(([a, b, z]) => `<path class="z-${z}" d="${arc(a, b)}"/>`).join('');
    const nums = [0, 1, 2, 3, 4, 5].map((i) => {
      const [x, y] = pt((i + 0.5) / 6 * 180, RAD - 24);
      return `<text class="tk" x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}">${i}</text>`;
    }).join('');
    const caps = [['Mild', 30], ['Moderate', 90], ['Severe', 150]].map(([t, a]) => {
      const [x, y] = pt(a, RAD + 17);
      return `<text class="cp" x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}">${t}</text>`;
    }).join('');
    const value = hasScore ? `${r.score}<tspan class="of">/5</tspan>` : `${Math.round(r.confidence)}<tspan class="of">%</tspan>`;
    const label = `${NAMES[key]} level: ${r.severity}${hasScore ? `, ${r.score} out of 5` : ''}`;
    return `<article class="gauge-card"><h3>${NAMES[key]} Level</h3>
      <svg viewBox="0 0 240 158" role="img" aria-label="${label}">${zones}${nums}${caps}
        <g class="needle" data-deg="${deg}"><path d="M${CX - 52} ${CY}L${CX} ${CY - 4}L${CX} ${CY + 4}Z"/></g>
        <circle class="hub" cx="${CX}" cy="${CY}" r="7"/><text class="val" x="${CX}" y="152">${value}</text></svg>
      <p class="sev sev-${CLS[r.severity]}">${r.severity}</p>
      <p class="conf">Model confidence: ${r.confidence}%</p></article>`;
  }

  document.getElementById('gauges').innerHTML = ORDER.map(gauge).join('');
  requestAnimationFrame(() => requestAnimationFrame(() =>
    document.querySelectorAll('.needle').forEach((n) => { n.style.transform = `rotate(${n.dataset.deg}deg)`; })));

  document.getElementById('cards').innerHTML = ORDER.map((k) => {
    const c = CLS[R[k].severity];
    return `<article class="card res res-${c}"><h3>${NAMES[k]}: <span class="sev-${c}">${R[k].severity}</span></h3><p>${EXPLAIN[k][R[k].severity]}</p></article>`;
  }).join('');

  // ---- Recommendations tailored to the predicted severities ----
  const sev = ORDER.map((k) => R[k].severity);
  const has = (s) => sev.includes(s);
  const recs = [
    ['Protect your sleep', 'Keep regular bed and wake times, and give yourself a screen-free wind-down before bed.'],
    ['Keep moving', 'A short daily walk or any activity you enjoy can lift your mood and ease tension.'],
    ['Settle your mind', 'Try slow breathing, a few minutes of mindfulness, or stretching between study sessions.'],
    ['Stay connected', 'Spend time with friends, family, or a study group, even when you feel like withdrawing.'],
    has('Moderate') || has('Severe')
      ? ['Reach out for support', 'Talk with someone you trust, such as a friend, a family member, or your campus counselling service. A qualified mental health professional can offer guidance that fits you.']
      : ['Keep checking in with yourself', 'Notice changes in your mood, sleep, or energy. Support is there whenever you want it.'],
  ];
  if (has('Severe')) {
    recs.unshift(['Please consider talking to someone soon', 'Your results include a high level. Booking a conversation with a counsellor or doctor is a good next step. If you ever feel unsafe or in crisis, contact your local emergency number or a crisis helpline right away.']);
  }
  document.getElementById('recs').innerHTML = recs.map(([t, d]) => `<li><b>${t}</b>${d}</li>`).join('');

  // ---- Download a plain-text summary ----
  document.getElementById('dl').addEventListener('click', () => {
    const lines = [
      'MindCare – Student Mental Health Assessment',
      `Date: ${new Date(saved.at).toLocaleString()}`, '', 'RESULTS',
      ...ORDER.map((k) => `${NAMES[k]}: ${R[k].severity}${Number.isInteger(R[k].score) ? ` (score ${R[k].score}/5)` : ''}, model confidence ${R[k].confidence}%`),
      '', 'ANSWERS SUBMITTED', ...Object.entries(saved.input).map(([a, b]) => `${a}: ${b}`),
      '', 'These predictions are not a clinical diagnosis. If you are feeling distressed, please consider speaking with a qualified mental health professional.',
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    a.download = 'mindcare-results.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
