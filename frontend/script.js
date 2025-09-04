const form = document.getElementById('uploadForm');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const kpiTotal = document.getElementById('kpiTotal');
const kpiFinal = document.getElementById('kpiFinal');
const kpiReduction = document.getElementById('kpiReduction');
const linksEl = document.getElementById('links');
const cosine = document.getElementById('cosine');
const cosineVal = document.getElementById('cosineVal');
const fuzzy = document.getElementById('fuzzy');
const fuzzyVal = document.getElementById('fuzzyVal');

cosine.addEventListener('input', () => { cosineVal.textContent = Number(cosine.value).toFixed(2); });
fuzzy.addEventListener('input', () => { fuzzyVal.textContent = Number(fuzzy.value); });

let chart;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const textColumn = document.getElementById('textColumn').value.trim();
  const stopwords = document.getElementById('stopwords').checked;
  const model = document.getElementById('model').value.trim();
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a file.');
    return;
  }

  const fd = new FormData();
  fd.append('file', file);
  if (textColumn) fd.append('text_column', textColumn);
  fd.append('remove_stopwords', String(stopwords));
  fd.append('model', model);
  fd.append('annoy_trees', '50');
  fd.append('ann_k', '20');
  fd.append('cosine_threshold', cosine.value);
  fd.append('fuzzy_threshold', fuzzy.value);

  statusEl.textContent = 'Uploading and processing...';
  resultsEl.classList.add('hidden');

  try {
    const resp = await fetch(apiUrl + '/process', {
      method: 'POST',
      body: fd,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error('API error: ' + text);
    }
    const data = await resp.json();

    const total = data.total_records;
    const final = data.final_records;
    const exact = data.exact_duplicates_removed;
    const near = data.near_duplicates_removed;
    const reduction = Math.round((total - final) / Math.max(1, total) * 100);

    kpiTotal.textContent = String(total);
    kpiFinal.textContent = String(final);
    kpiReduction.textContent = reduction + '%';

    const ctx = document.getElementById('chart');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Exact dupes', 'Near dupes', 'Final'],
        datasets: [{
          label: 'Counts',
          data: [exact, near, final],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    linksEl.innerHTML = '';
    const files = data.files || {};
    for (const [key, path] of Object.entries(files)) {
      const a = document.createElement('a');
      a.href = apiUrl + '/download?path=' + encodeURIComponent(path);
      a.textContent = 'Download ' + key;
      a.target = '_blank';
      linksEl.appendChild(a);
    }

    resultsEl.classList.remove('hidden');
    statusEl.textContent = 'Done.';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error: ' + err.message;
  }
});


