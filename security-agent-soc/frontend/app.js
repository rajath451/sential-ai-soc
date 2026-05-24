const input = document.getElementById('log-input');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const resultsBody = document.getElementById('results-body');
const summary = document.getElementById('summary');
const alertStatus = document.getElementById('alert-status');
const sendAlertsCheckbox = document.getElementById('send-alerts');

function renderResults(assessments) {
  resultsBody.innerHTML = '';
  assessments.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="priority-${item.priority}">${item.priority}</td>
      <td>${item.score}</td>
      <td>${item.event.src_ip || '-'}</td>
      <td>${item.event.username || '-'}</td>
      <td>${item.event.event_type}</td>
      <td><code>${item.event.raw}</code></td>
      <td>${item.explanation || '-'}</td>
    `;
    resultsBody.appendChild(row);
  });
}

async function analyze() {
  if (window.location.protocol === 'file:') {
    summary.textContent = 'Please run the local server and open http://localhost:8000 instead of opening the file directly.';
    alertStatus.textContent = 'Server mode required.';
    resultsBody.innerHTML = '';
    return;
  }

  const logText = input.value.trim();
  if (!logText) {
    summary.textContent = 'Paste log lines before analyzing.';
    alertStatus.textContent = '';
    resultsBody.innerHTML = '';
    return;
  }

  const payload = {
    log_text: logText,
    send_alerts: sendAlertsCheckbox.checked,
  };

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    const data = await res.json();
    const assessments = data.results;
    const counts = assessments.reduce(
      (acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );

    summary.innerHTML = `<strong>${assessments.length}</strong> events analyzed — ` +
      `<span class="summary-critical">critical: ${counts.critical}</span>, ` +
      `<span class="summary-high">high: ${counts.high}</span>, ` +
      `<span class="summary-low">low: ${counts.low}</span>`;

    if (sendAlertsCheckbox.checked) {
      const alertMessages = data.alerts.map(alert => `${alert.type}: ${alert.ok ? 'sent' : 'failed'} (${alert.info})`);
      alertStatus.textContent = alertMessages.join(' | ');
    } else {
      alertStatus.textContent = 'Alerts not sent. Enable "Send alerts" to push notifications.';
    }

    renderResults(assessments);
  } catch (error) {
    summary.textContent = 'Analysis failed.';
    alertStatus.textContent = error.message;
    resultsBody.innerHTML = '';
  }
}

analyzeBtn.addEventListener('click', analyze);
clearBtn.addEventListener('click', () => {
  input.value = '';
  resultsBody.innerHTML = '';
  summary.textContent = '';
  alertStatus.textContent = '';
  sendAlertsCheckbox.checked = false;
});
