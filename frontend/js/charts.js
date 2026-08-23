/**
 * VERDANT Charting & Statistical Visualizer
 * Fully custom Chart.js implementations matching published research figures,
 * with individual specimen highlights and population genomics figures.
 */

let pcaChartInstance = null;
let indivPcaChartInstance = null;
let admixtureChartInstance = null;
let indivAdmixChartInstance = null;
let missingnessChartInstance = null;
let rohChartInstance = null;
let indivRohChartInstance = null;
let mutationLoadChartInstance = null;
let heterozygosityChartInstance = null;
let sfsChartInstance = null;
let cveChartInstance = null;
let aimAssignChartInstance = null;
let rescueChartInstance = null;
let qcPhredChartInstance = null;
let qcCovChartInstance = null;

const ScientificPalette = {
  CenIndia: '#F8766D',      // Coral for Central India
  NorEasIndia: '#B79F00',   // Olive for North-East (Kaziranga)
  NorIndia: '#00BA38',      // Green for Terai / Corbett
  NorWesIndia: '#00BFC4',   // Cyan for North-West (Ranthambore / Sariska)
  Soulndia: '#619CFF',      // Blue for South India (Western Ghats)
  Sunderban: '#F564E3',     // Magenta for Sundarbans
  Highlight: '#C87D32',     // Gold/Amber accent for Individual Highlight
  gridColor: 'rgba(220, 214, 200, 0.45)',
  fontFamily: "'Inter', sans-serif"
};

const VerdantCharts = {
  /** 1. Population PCA Scatter Plot */
  renderPCA(data, axis = '12') {
    const ctx = document.getElementById('chart-pca');
    if (!ctx) return;
    if (pcaChartInstance) pcaChartInstance.destroy();

    const groups = {
      'CenIndia': { label: 'CenIndia', data: [], color: ScientificPalette.CenIndia },
      'NorEasIndia': { label: 'NorEasIndia', data: [], color: ScientificPalette.NorEasIndia },
      'NorIndia': { label: 'NorIndia', data: [], color: ScientificPalette.NorIndia },
      'NorWesIndia': { label: 'NorWesIndia', data: [], color: ScientificPalette.NorWesIndia },
      'Soulndia': { label: 'Soulndia', data: [], color: ScientificPalette.Soulndia },
      'Sunderban': { label: 'Sunderban', data: [], color: ScientificPalette.Sunderban }
    };

    data.points.forEach(pt => {
      const reg = pt.region || 'CenIndia';
      if (groups[reg]) {
        const xVal = pt.pc1;
        const yVal = (axis === '13') ? pt.pc3 : (axis === '23' ? pt.pc3 : pt.pc2);
        const xLabel = axis === '23' ? 'PC2' : 'PC1';
        const finalX = axis === '23' ? pt.pc2 : xVal;
        groups[reg].data.push({ x: finalX, y: yVal, sampleId: pt.sample_id, pop: pt.population_name });
      }
    });

    const datasets = Object.keys(groups).map(k => ({
      label: groups[k].label,
      data: groups[k].data,
      backgroundColor: groups[k].color,
      borderColor: groups[k].color,
      pointRadius: 6.5,
      pointHoverRadius: 8.5
    }));

    const yTitle = (axis === '13' || axis === '23') 
      ? `PC3 (${data.variance_explained[2] || 8.4}% Variance)` 
      : `PC2 (${data.variance_explained[1] || 12.0}% Variance)`;
    const xTitle = axis === '23'
      ? `PC2 (${data.variance_explained[1] || 12.0}% Variance)`
      : `PC1 (${data.variance_explained[0] || 13.0}% Variance)`;

    pcaChartInstance = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { family: ScientificPalette.fontFamily, size: 11 }, usePointStyle: true } },
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
    if (indivPcaChartInstance) indivPcaChartInstance.destroy();

    const backgroundPoints = [];
    let highlightPoint = null;

    pcaData.points.forEach(pt => {
      const xVal = axis === '23' ? pt.pc2 : pt.pc1;
      const yVal = (axis === '13' || axis === '23') ? pt.pc3 : pt.pc2;
      const item = { x: xVal, y: yVal, sampleId: pt.sample_id, pop: pt.population_name };

      if (pt.sample_id === highlightedSampleId) {
        highlightPoint = item;
      } else {
        backgroundPoints.push(item);
      }
    });

    const datasets = [
      {
        label: 'Reference Population Samples',
        data: backgroundPoints,
        backgroundColor: 'rgba(143, 165, 138, 0.45)',
        borderColor: 'rgba(83, 107, 69, 0.6)',
        pointRadius: 5.5,
        pointHoverRadius: 7
      }
    ];

    if (highlightPoint) {
      datasets.push({
        label: `Selected Individual: ${highlightedSampleId}`,
        data: [highlightPoint],
        backgroundColor: ScientificPalette.Highlight,
        borderColor: '#17291F',
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 12,
        pointStyle: 'star'
      });
    }

    const yTitle = (axis === '13' || axis === '23') ? 'PC3' : 'PC2';
    const xTitle = axis === '23' ? 'PC2' : 'PC1';

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
          x: { title: { display: true, text: xTitle, font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } },
          y: { title: { display: true, text: yTitle, font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 3. ADMIXTURE Stacked Barplot */
  renderAdmixture(data) {
    const ctx = document.getElementById('chart-admixture');
    if (!ctx) return;
    if (admixtureChartInstance) admixtureChartInstance.destroy();

    const sampleIds = Object.keys(data.sample_proportions);
    const kColors = ['#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00', '#FFFF33'];

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
            title: { display: true, text: 'Ancestry Proportion (Q)', font: { family: ScientificPalette.fontFamily, weight: '600' } },
            ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` },
            grid: { color: ScientificPalette.gridColor }
          }
        }
      }
    });
  },

  /** 4. Individual Ancestry Proportions Bar */
  renderIndividualAdmixture(profile, canvasId = 'chart-indiv-admix') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (indivAdmixChartInstance) indivAdmixChartInstance.destroy();

    const labels = Object.keys(profile.admixture_proportions);
    const probs = Object.values(profile.admixture_proportions);

    indivAdmixChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ancestry Proportion',
          data: probs,
          backgroundColor: ['#00BFC4', '#F8766D', '#619CFF', '#B79F00'],
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

  /** 5. Missingness Retention Curve */
  renderMissingness(summary) {
    const ctx = document.getElementById('chart-missingness');
    if (!ctx) return;
    if (missingnessChartInstance) missingnessChartInstance.destroy();

    const labels = summary.missingness_curve.map(pt => `${pt.max_missingness_pct}%`);
    const counts = summary.missingness_curve.map(pt => pt.passed_variants_count);

    missingnessChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Passed Variants',
          data: counts,
          borderColor: '#0000FF',
          backgroundColor: '#FF0000',
          pointBackgroundColor: '#FF0000',
          pointRadius: 5,
          borderWidth: 2,
          tension: 0.35,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Max Missingness (%)', font: { family: ScientificPalette.fontFamily, weight: '600' } }, grid: { color: ScientificPalette.gridColor } },
          y: { title: { display: true, text: 'Number of Variants', font: { family: ScientificPalette.fontFamily, weight: '600' } }, ticks: { callback: (v) => v.toLocaleString() }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 6. Pairwise FST Table */
  renderFSTMatrix(data) {
    const container = document.getElementById('fst-matrix-view');
    if (!container) return;

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

  /** 7. ROH Inbreeding Stacked Barplot */
  renderROH(data) {
    const ctx = document.getElementById('chart-roh');
    if (!ctx) return;
    if (rohChartInstance) rohChartInstance.destroy();

    const sampleIds = data.map(d => d.sample_id);
    const froh100k = data.map(d => d.froh_100kb - d.froh_1mb);
    const froh1m = data.map(d => d.froh_1mb - d.froh_5mb);
    const froh5m = data.map(d => d.froh_5mb - d.froh_10mb);
    const froh10m = data.map(d => d.froh_10mb);

    rohChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sampleIds,
        datasets: [
          { label: '>100kb (Ancient, <=263 gen)', data: froh100k, backgroundColor: '#D8C9AA' },
          { label: '>1Mb (Historical, <=26 gen)', data: froh1m, backgroundColor: '#8FA58A' },
          { label: '>5Mb (Recent, <=5 gen)', data: froh5m, backgroundColor: '#536B45' },
          { label: '>10Mb (Immediate consanguinity, <=3 gen)', data: froh10m, backgroundColor: '#8A6A4A' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: ScientificPalette.fontFamily, size: 10 } } } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, max: 0.70, title: { display: true, text: 'Genomic Inbreeding (F_ROH)', font: { family: ScientificPalette.fontFamily, weight: '600' } }, ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 8. Individual ROH Length Breakdown */
  renderIndividualROH(profile, canvasId = 'chart-indiv-roh') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (indivRohChartInstance) indivRohChartInstance.destroy();

    const f100k = profile.froh_100kb - profile.froh_1mb;
    const f1m = profile.froh_1mb - profile.froh_5mb;
    const f5m = profile.froh_5mb - profile.froh_10mb;
    const f10m = profile.froh_10mb;

    indivRohChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['>100kb (Ancient)', '>1Mb (Historical)', '>5Mb (Recent <=5 gen)', '>10Mb (Immediate <=3 gen)'],
        datasets: [{
          label: 'F_ROH Proportion',
          data: [f100k, f1m, f5m, f10m],
          backgroundColor: ['#D8C9AA', '#8FA58A', '#536B45', '#8A6A4A'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { max: 0.40, ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` }, title: { display: true, text: 'Genome Proportion' }, grid: { color: ScientificPalette.gridColor } }
        }
      }
    });
  },

  /** 9. Mutation Load */
  renderMutationLoad(loadData) {
    const ctx = document.getElementById('chart-mutation-load');
    if (!ctx) return;
    if (mutationLoadChartInstance) mutationLoadChartInstance.destroy();

    mutationLoadChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: loadData.map(d => d.population_name),
        datasets: [
          { label: 'Homozygous Damaging (LOF + Missense)', data: loadData.map(d => d.mean_homozygous_damaging), backgroundColor: '#8A6A4A' },
          { label: 'Homozygous Loss-of-Function (LOF)', data: loadData.map(d => d.mean_homozygous_lof), backgroundColor: '#A33A3A' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: ScientificPalette.fontFamily, size: 11 } } } },
        scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'Mutations Count / Individual' }, grid: { color: ScientificPalette.gridColor } } }
      }
    });
  },

  /** 10. Heterozygosity Bar Chart */
  renderHeterozygosity(divData) {
    const ctx = document.getElementById('chart-heterozygosity');
    if (!ctx) return;
    if (heterozygosityChartInstance) heterozygosityChartInstance.destroy();

    heterozygosityChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: divData.populations.map(p => p.name),
        datasets: [{
          label: 'Observed Heterozygosity (Ho)',
          data: divData.populations.map(p => p.observed_heterozygosity_ho),
          backgroundColor: ['#8A6A4A', '#203A2D', '#536B45', '#8FA58A'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { min: 0, max: 0.0020, title: { display: true, text: 'Mean Observed Heterozygosity (Ho)' }, grid: { color: ScientificPalette.gridColor } } }
      }
    });
  },

  /** 11. Site Frequency Spectrum */
  renderSFS() {
    const ctx = document.getElementById('chart-sfs');
    if (!ctx) return;
    if (sfsChartInstance) sfsChartInstance.destroy();

    sfsChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0 (Fixed)'],
        datasets: [
          { label: 'Putatively Neutral Mutations', data: [0.18, 0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04, 0.05, 0.06], borderColor: '#377EB8', borderWidth: 2, fill: false },
          { label: 'Putatively Damaging Mutations', data: [0.24, 0.15, 0.08, 0.05, 0.04, 0.03, 0.03, 0.03, 0.04, 0.14], borderColor: '#FF7F00', borderWidth: 2, fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: ScientificPalette.fontFamily, size: 10 } } } },
        scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'Proportion of Loci' }, grid: { color: ScientificPalette.gridColor } } }
      }
    });
  },

  /** 12. CVE Curve */
  renderCVE() {
    const ctx = document.getElementById('chart-cve');
    if (!ctx) return;
    if (cveChartInstance) cveChartInstance.destroy();

    cveChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['K=2', 'K=3', 'K=4', 'K=5', 'K=6', 'K=7'],
        datasets: [{
          label: 'Cross-Validation Error (CVE)',
          data: [0.442, 0.365, 0.389, 0.412, 0.448, 0.485],
          borderColor: '#536B45',
          backgroundColor: '#203A2D',
          pointRadius: 5,
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'CV Error Value' }, grid: { color: ScientificPalette.gridColor } } }
      }
    });
  },

  /** 13. AIM Population Assignment Probabilities */
  renderAIMAssignment(resp) {
    const ctx = document.getElementById('chart-aim-assignment');
    if (!ctx) return;
    if (aimAssignChartInstance) aimAssignChartInstance.destroy();

    aimAssignChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(resp.assignment_probabilities),
        datasets: [{
          label: 'Posterior Probability',
          data: Object.values(resp.assignment_probabilities),
          backgroundColor: ['#00BFC4', '#F8766D', '#619CFF', '#B79F00'],
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
    if (confBadge) {
      confBadge.textContent = `Assigned: ${resp.most_likely_population} (${(resp.confidence_score * 100).toFixed(1)}% Confidence)`;
    }
  },

  /** 14. Genetic Rescue Simulation Trajectory */
  renderRescueSimulation(simData) {
    const ctx = document.getElementById('chart-rescue');
    if (!ctx) return;
    if (rescueChartInstance) rescueChartInstance.destroy();

    rescueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: simData.projections.map(p => `Gen ${p.generation}`),
        datasets: [
          { label: 'Unmanaged Baseline Drift', data: simData.projections.map(p => p.baseline_froh), borderColor: '#A33A3A', borderDash: [5, 5], borderWidth: 2, fill: false },
          { label: 'Assisted Gene Flow Scenario (Mean)', data: simData.projections.map(p => p.projected_froh_mean), borderColor: '#203A2D', borderWidth: 3, fill: false },
          { label: '95% Uncertainty Upper Bound', data: simData.projections.map(p => p.projected_froh_upper95), borderColor: 'rgba(83, 107, 69, 0.3)', borderWidth: 1, pointRadius: 0, fill: false },
          { label: '95% Uncertainty Lower Bound', data: simData.projections.map(p => p.projected_froh_lower95), borderColor: 'rgba(83, 107, 69, 0.3)', backgroundColor: 'rgba(83, 107, 69, 0.15)', borderWidth: 1, pointRadius: 0, fill: '-1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: ScientificPalette.fontFamily, size: 10 } } } },
        scales: { x: { grid: { display: false } }, y: { min: 0, max: 0.60, title: { display: true, text: 'Inbreeding Coefficient (F_ROH)' }, grid: { color: ScientificPalette.gridColor } } }
      }
    });

    const statPill = document.getElementById('sim-stats-pill');
    if (statPill) {
      const pct = ((simData.delta_f / simData.initial_froh) * 100).toFixed(0);
      statPill.innerHTML = `&Delta;F = -${simData.delta_f.toFixed(3)} (${pct}% Inbreeding Reduction)`;
    }

    const assumptionsList = document.getElementById('sim-assumptions-list');
    if (assumptionsList) {
      assumptionsList.innerHTML = simData.assumptions.map(a => `<li>${a}</li>`).join('');
    }

    const uncertaintyEl = document.getElementById('sim-uncertainty-text');
    if (uncertaintyEl) {
      uncertaintyEl.textContent = simData.uncertainty_analysis;
    }
  },

  /** 15. Quality Control Charts */
  renderQCCharts() {
    const ctxPhred = document.getElementById('chart-qc-phred');
    if (ctxPhred) {
      if (qcPhredChartInstance) qcPhredChartInstance.destroy();
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
      if (qcCovChartInstance) qcCovChartInstance.destroy();
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
