/**
 * VERDANT Charting & Statistical Visualizer
 * Fully custom Chart.js implementations based on Khan et al. (2022) Heredity
 * with individual specimen highlights and population genomics figures.
 */

let pcaChartInstance = null;
let indivPcaChartInstance = null;
let admixtureChartInstance = null;
let indivAdmixChartInstance = null;
let missingnessChartInstance = null;
let aimAssignChartInstance = null;
let qcPhredChartInstance = null;
let qcCovChartInstance = null;
let cveChartInstance = null;

const ScientificPalette = {
  CenIndia: '#F8766D',      // Coral / Salmon for CenIndia
  NorEasIndia: '#B79F00',   // Olive for NorEasIndia
  NorIndia: '#00BA38',      // Green for NorIndia
  NorWesIndia: '#00BFC4',   // Cyan for NorWesIndia
  Soulndia: '#619CFF',      // Cornflower Blue for Soulndia
  Sunderban: '#F564E3',     // Magenta for Sunderban
  Highlight: '#FFC107',     // Amber Gold for Individual Highlight
  gridColor: 'rgba(220, 214, 200, 0.45)',
  fontFamily: "'Inter', sans-serif"
};

const VerdantCharts = {
  /** 1. Population PCA Scatter Plot */
  renderPCA(data, axis = '12') {
    const ctx = document.getElementById('chart-pca');
    if (!ctx) return;
    if (pcaChartInstance) {
      pcaChartInstance.destroy();
      pcaChartInstance = null;
    }

    const groups = {
      'CenIndia': { label: 'Central India (Kanha-Pench)', data: [], color: ScientificPalette.CenIndia },
      'NorEasIndia': { label: 'North-East (Kaziranga)', data: [], color: ScientificPalette.NorEasIndia },
      'NorIndia': { label: 'Terai (Corbett)', data: [], color: ScientificPalette.NorIndia },
      'NorWesIndia': { label: 'North-West (Ranthambore/Sariska)', data: [], color: ScientificPalette.NorWesIndia },
      'Soulndia': { label: 'South India (Western Ghats)', data: [], color: ScientificPalette.Soulndia },
      'Sunderban': { label: 'Sundarbans Delta', data: [], color: ScientificPalette.Sunderban }
    };

    if (data && data.points) {
      data.points.forEach(pt => {
        const reg = pt.region || 'CenIndia';
        if (groups[reg]) {
          const xVal = pt.pc1;
          const yVal = (axis === '13') ? pt.pc3 : pt.pc2;
          groups[reg].data.push({ x: xVal, y: yVal, sampleId: pt.sample_id, pop: pt.population_name });
        }
      });
    }

    const datasets = Object.keys(groups).map(k => ({
      label: groups[k].label,
      data: groups[k].data,
      backgroundColor: groups[k].color,
      borderColor: groups[k].color,
      pointRadius: 6,
      pointHoverRadius: 8
    }));

    const yTitle = (axis === '13') 
      ? `PC3 (${data && data.variance_explained ? data.variance_explained[2] : 8.4}% Variance)` 
      : `PC2 (${data && data.variance_explained ? data.variance_explained[1] : 12.0}% Variance)`;
    const xTitle = `PC1 (${data && data.variance_explained ? data.variance_explained[0] : 13.0}% Variance)`;

    pcaChartInstance = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: ScientificPalette.fontFamily, size: 11 }, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = ctx.raw;
                return `${raw.sampleId} (${raw.pop}): X=${raw.x.toFixed(3)}, Y=${raw.y.toFixed(3)}`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: xTitle, font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } },
          y: { title: { display: true, text: yTitle, font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 2. Individual Highlighted PCA Scatter Plot */
  renderIndividualPCA(pcaData, highlightedSampleId, axis = '12', canvasId = 'chart-indiv-pca') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (indivPcaChartInstance) {
      indivPcaChartInstance.destroy();
      indivPcaChartInstance = null;
    }

    const backgroundPoints = [];
    let highlightPoint = null;

    if (pcaData && pcaData.points) {
      pcaData.points.forEach(pt => {
        const xVal = pt.pc1;
        const yVal = (axis === '13') ? pt.pc3 : pt.pc2;
        const item = { x: xVal, y: yVal, sampleId: pt.sample_id, pop: pt.population_name };

        if (pt.sample_id === highlightedSampleId) {
          highlightPoint = item;
        } else {
          backgroundPoints.push(item);
        }
      });
    }

    const datasets = [
      {
        label: 'Reference Cohort Samples',
        data: backgroundPoints,
        backgroundColor: 'rgba(143, 165, 138, 0.45)',
        borderColor: 'rgba(83, 107, 69, 0.6)',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ];

    if (highlightPoint) {
      datasets.push({
        label: `Selected Specimen: ${highlightedSampleId}`,
        data: [highlightPoint],
        backgroundColor: ScientificPalette.Highlight,
        borderColor: '#16291F',
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 12,
        pointStyle: 'star'
      });
    }

    const yTitle = (axis === '13') ? 'PC3' : 'PC2';

    indivPcaChartInstance = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: ScientificPalette.fontFamily, size: 10 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw.sampleId} (${ctx.raw.pop}): X=${ctx.raw.x.toFixed(3)}, Y=${ctx.raw.y.toFixed(3)}`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'PC1', font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } },
          y: { title: { display: true, text: yTitle, font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 3. ADMIXTURE Stacked Barplot matching published K=3 plot */
  renderAdmixture(data) {
    const ctx = document.getElementById('chart-admixture');
    if (!ctx) return;
    if (admixtureChartInstance) {
      admixtureChartInstance.destroy();
      admixtureChartInstance = null;
    }

    if (!data || !data.sample_proportions) return;

    const sampleIds = Object.keys(data.sample_proportions);
    // Colors matching published ADMIXTURE plot: V1=Red (#D92525), V2=Blue (#2B70B3), V3=Green (#43A047)
    const kColors = data.k === 3 
      ? ['#D92525', '#2B70B3', '#43A047']
      : ['#D92525', '#2B70B3', '#43A047', '#984EA3', '#FF7F00'];

    const datasets = data.cluster_labels.map((label, idx) => ({
      label: label,
      data: sampleIds.map(sid => data.sample_proportions[sid][idx] || 0.0),
      backgroundColor: kColors[idx % kColors.length],
      borderWidth: 0.5,
      borderColor: '#FFFFFF'
    }));

    admixtureChartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: sampleIds, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: ScientificPalette.fontFamily, size: 10 } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%` } }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9, family: "'JetBrains Mono', monospace" } } },
          y: {
            stacked: true,
            max: 1.0,
            title: { display: true, text: 'Ancestry Proportion', font: { family: ScientificPalette.fontFamily, weight: '600' } },
            ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` },
            grid: { color: ScientificPalette.gridColor }
          }
        }
      }
    });
  },

  /** 4. Cross-Validation (CV) Error Curve */
  renderCVE() {
    const ctx = document.getElementById('chart-cve');
    if (!ctx) return;
    if (cveChartInstance) {
      cveChartInstance.destroy();
      cveChartInstance = null;
    }

    cveChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['K=2', 'K=3 (Optimal)', 'K=4', 'K=5'],
        datasets: [{
          label: 'Cross-Validation (CV) Error',
          data: [0.442, 0.365, 0.389, 0.412],
          borderColor: '#203A2D',
          backgroundColor: '#536B45',
          pointBackgroundColor: '#203A2D',
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, title: { display: true, text: 'K Ancestry Clusters', font: { family: ScientificPalette.fontFamily, weight: '600' } } },
          y: { title: { display: true, text: 'CV Error Value', font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 5. Individual Ancestry Proportions Bar */
  renderIndividualAdmixture(profile, canvasId = 'chart-indiv-admix') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (indivAdmixChartInstance) {
      indivAdmixChartInstance.destroy();
      indivAdmixChartInstance = null;
    }

    if (!profile || !profile.admixture_proportions) return;

    const labels = Object.keys(profile.admixture_proportions);
    const probs = Object.values(profile.admixture_proportions);

    indivAdmixChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ancestry Proportion',
          data: probs,
          backgroundColor: ['#2B70B3', '#43A047', '#D92525', '#984EA3'],
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `Proportion: ${(ctx.raw * 100).toFixed(1)}%` } }
        },
        scales: {
          x: { max: 1.0, ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` }, grid: { color: ScientificPalette.gridColor } },
          y: { grid: { display: false } }
        }
      }
    });
  },

  /** 6. Missingness Retention Curve */
  renderMissingness(summary) {
    const ctx = document.getElementById('chart-missingness');
    if (!ctx) return;
    if (missingnessChartInstance) {
      missingnessChartInstance.destroy();
      missingnessChartInstance = null;
    }

    if (!summary || !summary.missingness_curve) return;

    const labels = summary.missingness_curve.map(pt => `${pt.max_missingness_pct}%`);
    const counts = summary.missingness_curve.map(pt => pt.passed_variants_count);

    missingnessChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Retained Autosomal SNPs',
          data: counts,
          borderColor: '#203A2D',
          backgroundColor: 'rgba(32, 58, 45, 0.1)',
          pointBackgroundColor: '#536B45',
          pointRadius: 5,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Maximum Missingness Threshold (%)', font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } },
          y: { title: { display: true, text: 'Retained Variants Count', font: { family: ScientificPalette.fontFamily, weight: '600' } }, ticks: { callback: (v) => v.toLocaleString() }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 7. Pairwise FST Table */
  renderFSTMatrix(data) {
    const container = document.getElementById('fst-matrix-view');
    if (!container) return;

    if (!data || !data.populations || !data.matrix) {
      container.innerHTML = '<div style="padding: 12px; color: var(--color-text-muted);">FST data not available in this demo dataset</div>';
      return;
    }

    let html = '<table class="fst-table"><thead><tr><th>Population</th>';
    data.populations.forEach(p => { html += `<th>${p}</th>`; });
    html += '</tr></thead><tbody>';

    data.matrix.forEach((row, rIdx) => {
      html += `<tr><th>${data.populations[rIdx]}</th>`;
      row.forEach((val, cIdx) => {
        let cellClass = 'fst-cell-diag';
        if (rIdx !== cIdx) cellClass = val >= 0.12 ? 'fst-cell-high' : 'fst-cell-low';
        html += `<td class="${cellClass}">${val.toFixed(2)}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  /** 8. AIM Population Assignment Probabilities */
  renderAIMAssignment(resp) {
    const ctx = document.getElementById('chart-aim-assignment');
    if (!ctx) return;
    if (aimAssignChartInstance) {
      aimAssignChartInstance.destroy();
      aimAssignChartInstance = null;
    }

    if (!resp || !resp.assignment_probabilities) return;

    aimAssignChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(resp.assignment_probabilities),
        datasets: [{
          label: 'Assignment Probability',
          data: Object.values(resp.assignment_probabilities),
          backgroundColor: ['#2B70B3', '#43A047', '#D92525', '#984EA3'],
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { max: 1.0, ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` }, grid: { color: ScientificPalette.gridColor } }, y: { grid: { display: false } } }
      }
    });

    const confBadge = document.getElementById('aim-result-confidence');
    if (confBadge && resp.most_likely_population) {
      confBadge.textContent = `Assigned: ${resp.most_likely_population} (${(resp.confidence_score * 100).toFixed(1)}% Confidence)`;
    }
  },

  /** 9. Quality Control Charts */
  renderQCCharts() {
    const ctxPhred = document.getElementById('chart-qc-phred');
    if (ctxPhred) {
      if (qcPhredChartInstance) {
        qcPhredChartInstance.destroy();
        qcPhredChartInstance = null;
      }
      const pos = Array.from({ length: 30 }, (_, i) => `${(i + 1) * 5} bp`);
      const scores = pos.map(() => 34.0 + (Math.random() * 2.5 - 1.0));
      qcPhredChartInstance = new Chart(ctxPhred, {
        type: 'line',
        data: {
          labels: pos,
          datasets: [{ label: 'Mean Phred Score (Per-Base Quality)', data: scores, borderColor: '#203A2D', backgroundColor: 'rgba(32, 58, 45, 0.1)', borderWidth: 2, pointRadius: 2, fill: true }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { min: 20, max: 40, title: { display: true, text: 'Phred Quality Score' } }, x: { grid: { display: false } } }
        }
      });
    }

    const ctxCov = document.getElementById('chart-qc-coverage');
    if (ctxCov) {
      if (qcCovChartInstance) {
        qcCovChartInstance.destroy();
        qcCovChartInstance = null;
      }
      qcCovChartInstance = new Chart(ctxCov, {
        type: 'bar',
        data: {
          labels: ['North-West (18.2x)', 'Central India (21.3x)', 'South India (18.5x)', 'North-East (19.8x)', 'Terai (19.1x)'],
          datasets: [{ label: 'Mean Fold Coverage Depth', data: [18.2, 21.3, 18.5, 19.8, 19.1], backgroundColor: '#536B45', borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { min: 0, max: 30, title: { display: true, text: 'Mean Fold Coverage (x)' } }, x: { grid: { display: false } } }
        }
      });
    }
  }
};
