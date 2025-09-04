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
const tabs = document.querySelectorAll('.tab');
const compareForm = document.getElementById('compareForm');
const cosineCompare = document.getElementById('cosineCompare');
const cosineCompareVal = document.getElementById('cosineCompareVal');
const fuzzyCompare = document.getElementById('fuzzyCompare');
const fuzzyCompareVal = document.getElementById('fuzzyCompareVal');
const compareDirBtn = document.getElementById('compareDirBtn');

cosine.addEventListener('input', () => { cosineVal.textContent = Number(cosine.value).toFixed(2); });
fuzzy.addEventListener('input', () => { fuzzyVal.textContent = Number(fuzzy.value); });

let chart;
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    if (target === 'dedupe') {
      form.classList.remove('hidden');
      compareForm.classList.add('hidden');
    } else {
      form.classList.add('hidden');
      compareForm.classList.remove('hidden');
    }
  });
});

cosineCompare.addEventListener('input', () => { cosineCompareVal.textContent = Number(cosineCompare.value).toFixed(2); });
fuzzyCompare.addEventListener('input', () => { fuzzyCompareVal.textContent = Number(fuzzyCompare.value); });


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

compareDirBtn.addEventListener('click', async () => {
  const apiUrl = document.getElementById('apiUrlCompare').value.trim();
  const stopwords = document.getElementById('stopwordsCompare').checked;
  const model = document.getElementById('modelCompare').value.trim();
  const queryFile = document.getElementById('queryFile').files[0];
  const targetZip = document.getElementById('targetZip').files[0];
  const statusCompareDir = document.getElementById('statusCompareDir');
  const tableWrap = document.getElementById('compareTableWrap');
  const table = document.getElementById('compareTable').querySelector('tbody');

  if (!queryFile || !targetZip) {
    alert('Select a query file and a target ZIP.');
    return;
  }

  statusCompareDir.textContent = 'Comparing against directory...';
  tableWrap.classList.add('hidden');
  table.innerHTML = '';

  const fd = new FormData();
  fd.append('query', queryFile);
  fd.append('target_zip', targetZip);
  fd.append('remove_stopwords', String(stopwords));
  fd.append('model', model);
  fd.append('cosine_threshold', cosineCompare.value);
  fd.append('fuzzy_threshold', fuzzyCompare.value);
  fd.append('top_k', '50');

  try {
    const resp = await fetch(apiUrl + '/compare_dir', { method: 'POST', body: fd });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    (data.matches || []).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border-bottom:1px solid #f0f0f0; padding:6px;">${row.filename}</td>
        <td style="border-bottom:1px solid #f0f0f0; padding:6px; text-align:right;">${row.cosine_similarity.toFixed(3)}</td>
        <td style="border-bottom:1px solid #f0f0f0; padding:6px; text-align:right;">${row.levenshtein_ratio}</td>
        <td style="border-bottom:1px solid #f0f0f0; padding:6px; text-align:center;">${row.is_duplicate ? 'Yes' : 'No'}</td>
      `;
      table.appendChild(tr);
    });
    tableWrap.classList.remove('hidden');
    statusCompareDir.textContent = `Found ${data.matches ? data.matches.length : 0} matches (top 50).`;
  } catch (err) {
    console.error(err);
    statusCompareDir.textContent = 'Error: ' + err.message;
  }
});

compareForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiUrl = document.getElementById('apiUrlCompare').value.trim();
  const stopwords = document.getElementById('stopwordsCompare').checked;
  const model = document.getElementById('modelCompare').value.trim();
  const queryFile = document.getElementById('queryFile').files[0];
  const targetFile = document.getElementById('targetFile').files[0];
  const statusCompare = document.getElementById('statusCompare');

  if (!queryFile || !targetFile) {
    alert('Select both query and target files.');
    return;
  }

  const fd = new FormData();
  fd.append('query', queryFile);
  fd.append('target', targetFile);
  fd.append('remove_stopwords', String(stopwords));
  fd.append('model', model);
  fd.append('cosine_threshold', cosineCompare.value);
  fd.append('fuzzy_threshold', fuzzyCompare.value);

  statusCompare.textContent = 'Comparing...';

  try {
    const resp = await fetch(apiUrl + '/compare', { method: 'POST', body: fd });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    statusCompare.textContent = `Cosine: ${data.cosine_similarity.toFixed(3)}, Levenshtein: ${data.levenshtein_ratio}, Duplicate: ${data.is_duplicate}`;
  } catch (err) {
    console.error(err);
    statusCompare.textContent = 'Error: ' + err.message;
  }
});


