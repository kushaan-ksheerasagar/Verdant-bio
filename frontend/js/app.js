/**
 * VERDANT Main Application Logic
 * Client-Side Router, View Controllers, User Session, Tiger Narrative Stepper, and Report Renderers.
 */

let leafletMap = null;
let reportMap = null;
let currentProjects = [];
let currentSamples = [];

document.addEventListener('DOMContentLoaded', async () => {
  initRouter();
  initAuthHandlers();
  initFormHandlers();
  
  // Initial route handling
  await handleRoute();
});

// Window hashchange router
window.addEventListener('hashchange', () => {
  handleRoute();
});

function initRouter() {
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
}

async function handleRoute() {
  const hash = window.location.hash || '#/';
  const panes = document.querySelectorAll('.view-pane');
  panes.forEach(p => p.classList.remove('active'));

  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  if (hash === '#/' || hash === '') {
    showPane('view-landing');
  } else if (hash === '#/login') {
    showPane('view-login');
  } else if (hash === '#/create-account') {
    showPane('view-signup');
  } else if (hash === '#/dashboard') {
    showPane('view-dashboard');
    await loadDashboard();
  } else if (hash === '#/projects/new') {
    showPane('view-new-project');
  } else if (hash.includes('/upload/fastq')) {
    showPane('view-upload-fastq');
  } else if (hash.includes('/upload/vcf')) {
    showPane('view-upload-vcf');
  } else if (hash.includes('/upload')) {
    showPane('view-upload-choice');
  } else if (hash.includes('/pipeline')) {
    showPane('view-pipeline');
    await loadPipelineView();
  } else if (hash.includes('/demo/tiger/raw-to-result')) {
    showPane('view-tiger-narrative');
    setNarrativeStep(1);
  } else if (hash.includes('/reports/individual')) {
    showPane('view-report-individual');
    await loadIndividualReport('BEN_NW10');
  } else if (hash.includes('/reports/population')) {
    showPane('view-report-population');
    await loadPopulationReport();
  } else if (hash.includes('/reports/conservation')) {
    showPane('view-report-conservation');
    await loadConservationReport();
  } else if (hash === '#/reproducibility' || hash.includes('/reproducibility')) {
    showPane('view-reproducibility');
    await loadReproducibilityView();
  } else if (hash.includes('/analysis/')) {
    const module = hash.split('/analysis/')[1];
    showPane('view-analysis');
    await loadAnalysisModule(module);
  } else if (hash.includes('/projects/')) {
    showPane('view-project-hub');
  } else {
    showPane('view-landing');
  }

  window.scrollTo(0, 0);
}

function showPane(paneId) {
  const el = document.getElementById(paneId);
  if (el) el.classList.add('active');
}

/** Authentication Handlers */
function initAuthHandlers() {
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      try {
        const res = await VerdantAPI.loginUser(email, pass);
        document.getElementById('user-display-name').textContent = res.user.full_name;
        window.location.hash = '#/dashboard';
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    });
  }

  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        institution: document.getElementById('signup-institution').value,
        role: document.getElementById('signup-role').value,
        password: document.getElementById('signup-password').value
      };
      try {
        const res = await VerdantAPI.signupUser(payload);
        document.getElementById('user-display-name').textContent = res.user.full_name;
        window.location.hash = '#/dashboard';
      } catch (err) {
        alert('Signup failed: ' + err.message);
      }
    });
  }
}

window.mockLoginGoogle = function() {
  document.getElementById('user-display-name').textContent = 'Dr. Ananya Sharma';
  window.location.hash = '#/dashboard';
};

/** Dashboard View Loader */
async function loadDashboard() {
  currentProjects = await VerdantAPI.getProjects();
  const grid = document.getElementById('dashboard-projects-grid');
  const countEl = document.getElementById('dash-projects-count');
  if (countEl) countEl.textContent = `${currentProjects.length} Projects Active`;

  if (!grid) return;
  let html = '';
  currentProjects.forEach(p => {
    html += `
      <div class="project-card-saas">
        <div>
          <div class="project-card-header">
            <span class="species-tag">${p.species_name}</span>
            <span class="badge ${p.is_demo ? 'badge-real-data' : 'badge-real-analysis'}">${p.analysis_status}</span>
          </div>
          <h3 class="project-name">${p.name}</h3>
          <div class="project-meta-list">
            <div><strong>Dataset:</strong> ${p.dataset_type}</div>
            <div><strong>Cohort Size:</strong> ${p.total_samples} samples (${p.populations_count} landscapes)</div>
            <div><strong>Reference:</strong> ${p.reference_genome}</div>
            <div><strong>Last Updated:</strong> ${p.last_updated}</div>
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="window.location.hash='#/projects/${p.id}'">Open Project Workspace &rarr;</button>
      </div>
    `;
  });
  grid.innerHTML = html;
}

/** Form Handlers (Create Project) */
function initFormHandlers() {
  const createProjForm = document.getElementById('form-create-project');
  if (createProjForm) {
    createProjForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('proj-input-name').value;
      const speciesFull = document.getElementById('proj-input-species').value;
      const objective = document.getElementById('proj-input-objective').value;
      const desc = document.getElementById('proj-input-desc').value;

      const speciesParts = speciesFull.split('(');
      const speciesName = speciesParts[0].trim();
      const sciName = speciesParts[1] ? speciesParts[1].replace(')', '').trim() : speciesName;

      const newProj = await VerdantAPI.createProject({
        name: name,
        species_name: speciesName,
        scientific_name: sciName,
        research_objective: objective,
        description: desc
      });

      window.location.hash = `#/projects/${newProj.id}/upload`;
    });
  }
}

/** FASTQ & VCF Upload Handlers */
async function loadPipelineView() {
  const pipeline = await VerdantAPI.getPipelineStatus();
  const container = document.getElementById('pipeline-stages-container');
  if (!container) return;

  let html = '';
  pipeline.stages.forEach(s => {
    html += `
      <div class="stage-row">
        <div>
          <span class="stage-name">${s.name}</span>
          <span class="text-muted" style="margin-left: 8px;">(${s.process})</span>
        </div>
        <div>
          <span class="text-muted" style="font-family: var(--font-mono); font-size: 0.75rem; margin-right: 10px;">${s.duration}</span>
          <span class="stage-status">${s.status}</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

/** Tiger Narrative Stepper */
window.setNarrativeStep = function(stepNum) {
  const buttons = document.querySelectorAll('#stepper-tabs .stepper-btn');
  buttons.forEach((b, idx) => {
    if (idx + 1 === stepNum) b.classList.add('active');
    else b.classList.remove('active');
  });

  const card = document.getElementById('narrative-step-card');
  if (!card) return;

  const steps = [
    {
      title: 'Step 1: Raw Genomic FASTQ Read Ingestion',
      badge: 'REAL DATA',
      content: `
        <p>Inverted Zenodo record <code>10.5281/zenodo.14258052</code> containing 9 paired-end 150bp Illumina FASTQ archives across Indian tiger landscapes and outgroup controls.</p>
        <table class="data-table" style="margin-top: 12px;">
          <tr><th>Sample ID</th><th>Location</th><th>Forward FASTQ (R1)</th><th>Reverse FASTQ (R2)</th><th>Checksum</th></tr>
          <tr><td class="sample-id-code">BEN_NW10</td><td>Ranthambore</td><td>BEN_NW10_sub_1.fq.gz</td><td>BEN_NW10_sub_2.fq.gz</td><td><code>82df6d2b...</code></td></tr>
          <tr><td class="sample-id-code">BEN_CI16</td><td>Kanha</td><td>BEN_CI16_sub_1.fq.gz</td><td>BEN_CI16_sub_2.fq.gz</td><td><code>e61f8509...</code></td></tr>
          <tr><td class="sample-id-code">BEN_SI18</td><td>Wayanad</td><td>BEN_SI18_sub_1.fq.gz</td><td>BEN_SI18_sub_2.fq.gz</td><td><code>762a37e5...</code></td></tr>
        </table>
      `
    },
    {
      title: 'Step 2: Read Quality Control & Adapter Trimming',
      badge: 'REAL ANALYSIS',
      content: `
        <p>Trimmomatic v0.39 quality filtering with Phred score threshold &ge; Q30 and 15bp sliding window. Mean read quality Q34.2 with 98.4% mapping rate.</p>
        <button class="btn btn-outline" style="margin-top: 10px;" onclick="window.location.hash='#/analysis/qc'">Inspect FastQC Metrics &rarr;</button>
      `
    },
    {
      title: 'Step 3: Reference Assembly Alignment',
      badge: 'REAL ANALYSIS',
      content: `
        <p>Aligned against near-chromosomal assembly <code>GCA_021130815.1_PanTigT.MC.v3</code> (Shukla et al. 2023, 2.42 Gb length across 38 scaffolds) using BWA-MEM.</p>
      `
    },
    {
      title: 'Step 4: Joint Variant Calling (Strelka2)',
      badge: 'REAL ANALYSIS',
      content: `
        <p>Strelka2 small-variant caller identified <strong>4,821,304 raw candidate loci</strong> across 35 wild tiger genomes.</p>
      `
    },
    {
      title: 'Step 5: Hard Filtering & Missingness Curve',
      badge: 'REAL ANALYSIS',
      content: `
        <p>Hard filtering (DP&ge;10, GQ&ge;30, HWE P&ge;0.001, MAF&ge;0.05, missingness&le;30%) retained <strong>1,284,910 core autosomal biallelic SNPs</strong>.</p>
        <button class="btn btn-outline" style="margin-top: 10px;" onclick="window.location.hash='#/analysis/variants'">Inspect Missingness Curve &rarr;</button>
      `
    },
    {
      title: 'Step 6: Population Structure (PCA & ADMIXTURE)',
      badge: 'REAL ANALYSIS',
      content: `
        <p>PLINK SVD PCA (PC1 13.0%, PC2 12.0%) and ADMIXTURE K=4 resolved 4 distinct clusters: North-West, Central+Terai, South India, and North-East.</p>
        <button class="btn btn-outline" style="margin-top: 10px;" onclick="window.location.hash='#/analysis/structure'">Inspect PCA & ADMIXTURE &rarr;</button>
      `
    },
    {
      title: 'Step 7: Individual Genomic Profiling',
      badge: 'REAL ANALYSIS',
      content: `
        <p>Comparing isolated Ranthambore tigers (<code>BEN_NW10</code>, Ho=0.00062) vs connected Central Indian tigers (<code>BEN_CI16</code>, Ho=0.00140).</p>
        <button class="btn btn-outline" style="margin-top: 10px;" onclick="window.location.hash='#/reports/individual'">View Individual Report &rarr;</button>
      `
    },
    {
      title: 'Step 8: Genomic Inbreeding ($F_{ROH}$) & Mutation Load Purging',
      badge: 'REAL ANALYSIS',
      content: `
        <p>ROH length binning ($F_{ROH>100kb}=0.57$, $F_{ROH>10Mb}=0.28$) proves recent consanguinity within 3 generations. VEP functional annotation shows purging of highly recessive LOF mutations ($R_{XY}=0.962$).</p>
      `
    },
    {
      title: 'Step 9: Conservation Context & Genetic Rescue',
      badge: 'SIMULATED DEMO DATA',
      content: `
        <p>Scenario simulation for introducing 1–2 Central Indian breeders into Ranthambore projects a 46% reduction in inbreeding over 10 generations with 95% Monte Carlo CIs.</p>
        <button class="btn btn-outline" style="margin-top: 10px;" onclick="window.location.hash='#/reports/conservation'">Open Rescue Simulator &rarr;</button>
      `
    },
    {
      title: 'Step 10: Cryptographic Provenance & Code Export',
      badge: 'REPRODUCIBILITY',
      content: `
        <p>Immutable audit DAG with SHA256 checksums, Nextflow DSL2 execution code, and reproducible Conda/Docker scripts.</p>
        <button class="btn btn-outline" style="margin-top: 10px;" onclick="window.location.hash='#/reproducibility'">View Lineage DAG &rarr;</button>
      `
    }
  ];

  const current = steps[stepNum - 1];
  card.innerHTML = `
    <div class="card-header">
      <h3>${current.title}</h3>
      <span class="badge badge-real-analysis">${current.badge}</span>
    </div>
    <div style="padding: 10px 0;">
      ${current.content}
    </div>
  `;
};

/** Individual Report View Loader */
async function loadIndividualReport(sampleId) {
  const select = document.getElementById('indiv-specimen-select');
  if (select) select.value = sampleId;

  const profile = await VerdantAPI.getIndividualReport(sampleId);
  const pcaData = await VerdantAPI.getPCA();

  document.getElementById('indiv-val-ho').textContent = profile.heterozygosity_ho ? profile.heterozygosity_ho.toFixed(5) : 'N/A';
  document.getElementById('indiv-sub-ho').textContent = `Pop Mean: ${profile.heterozygosity_population_mean.toFixed(5)}`;

  document.getElementById('indiv-val-froh').textContent = profile.froh_total ? `${(profile.froh_total * 100).toFixed(1)}%` : 'N/A';
  document.getElementById('indiv-sub-froh').textContent = `Total: ${profile.total_roh_mb} Mb`;

  document.getElementById('indiv-val-f10m').textContent = `${(profile.froh_10mb * 100).toFixed(1)}%`;
  document.getElementById('indiv-val-lof').textContent = profile.homozygous_lof_mutations;

  document.getElementById('indiv-pca-badge').textContent = `${profile.sample_id} Highlighted`;

  // Render Individual Charts
  VerdantCharts.renderIndividualPCA(pcaData, profile.sample_id, '12', 'chart-indiv-pca');
  VerdantCharts.renderIndividualROH(profile, 'chart-indiv-roh');

  // Render 4-Level Context
  document.getElementById('indiv-ctx-obs').textContent = profile.observed_context;
  document.getElementById('indiv-ctx-interp').textContent = profile.interpretation_context;
  document.getElementById('indiv-ctx-context').textContent = profile.conservation_context;
  document.getElementById('indiv-ctx-limit').textContent = `Limitations: ${profile.limitations}`;
}

window.loadIndividualReport = loadIndividualReport;

/** Population Report Loader */
async function loadPopulationReport() {
  const pcaData = await VerdantAPI.getPCA();
  VerdantCharts.renderPCA(pcaData, '12');

  const fstData = await VerdantAPI.getFST();
  VerdantCharts.renderFSTMatrix(fstData);

  currentSamples = await VerdantAPI.getSamples();
  initReportMap(currentSamples);
}

function initReportMap(samples) {
  const mapEl = document.getElementById('gis-map-report');
  if (!mapEl || reportMap) return;

  reportMap = L.map('gis-map-report').setView([22.8, 80.5], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 14 }).addTo(reportMap);

  const landscapes = [
    { name: 'Ranthambore (NW)', lat: 26.0173, lng: 76.5026, color: '#00BFC4' },
    { name: 'Sariska (NW)', lat: 27.3200, lng: 76.4300, color: '#00BFC4' },
    { name: 'Kanha (CI)', lat: 22.3345, lng: 80.6115, color: '#F8766D' },
    { name: 'Wayanad (SI)', lat: 11.6854, lng: 76.1320, color: '#619CFF' },
    { name: 'Kaziranga (NE)', lat: 26.5775, lng: 93.1711, color: '#B79F00' }
  ];

  landscapes.forEach(loc => {
    L.circleMarker([loc.lat, loc.lng], { radius: 8, fillColor: loc.color, color: '#FFF', weight: 2, fillOpacity: 0.9 }).addTo(reportMap).bindPopup(`<b>${loc.name}</b>`);
  });
}

/** Species quick select helper */
window.selectSpeciesQuick = function(speciesStr) {
  const input = document.getElementById('proj-input-species');
  if (input) input.value = speciesStr;
};

/** Conservation Report Loader */
async function loadConservationReport() {
  const assessment = await VerdantAPI.getAssessment();
  document.getElementById('report-cga-obs').textContent = assessment.observation;
  document.getElementById('report-cga-stat').textContent = assessment.statistical_interpretation;
  document.getElementById('report-cga-context').textContent = assessment.conservation_context;

  await runRescueSimulation();

  const simForm = document.getElementById('form-rescue-sim');
  if (simForm && !simForm.dataset.bound) {
    simForm.dataset.bound = 'true';
    simForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await runRescueSimulation();
    });
  }
}

async function runRescueSimulation() {
  const recipient = document.getElementById('sim-recipient')?.value || 'BEN_NW';
  const donor = document.getElementById('sim-donor')?.value || 'BEN_CI';
  const count = parseInt(document.getElementById('sim-count')?.value || '2', 10);
  const gen = parseInt(document.getElementById('sim-gen')?.value || '10', 10);
  const ne = parseInt(document.getElementById('sim-ne')?.value || '25', 10);

  try {
    const res = await VerdantAPI.simulateGeneticRescue({
      recipient_population: recipient,
      donor_population: donor,
      translocated_individuals_count: count,
      generations: gen,
      current_effective_population_size_ne: ne,
      migration_success_rate: 0.75
    });
    VerdantCharts.renderRescueSimulation(res);
  } catch (err) {
    console.error("Rescue simulation error:", err);
  }
}

/** Reproducibility View Loader */
async function loadReproducibilityView() {
  const nodes = await VerdantAPI.getProvenance();
  VerdantLineage.init(nodes);
}

/** Scientific Analysis Modules Loader */
async function loadAnalysisModule(module) {
  const titleEl = document.getElementById('analysis-module-title');
  const contentEl = document.getElementById('analysis-module-content');
  if (!contentEl) return;

  if (module === 'qc') {
    titleEl.textContent = 'Quality Control & Alignment Diagnostics';
    contentEl.innerHTML = `
      <div class="popgen-grid">
        <div class="card"><div class="card-header"><h3>Per-Base Sequence Quality</h3></div><div class="chart-wrapper"><canvas id="chart-qc-phred"></canvas></div></div>
        <div class="card"><div class="card-header"><h3>Fold Coverage Depth</h3></div><div class="chart-wrapper"><canvas id="chart-qc-coverage"></canvas></div></div>
      </div>
    `;
    VerdantCharts.renderQCCharts();
  } else if (module === 'variants') {
    titleEl.textContent = 'Variant Discovery & Missingness Filtering';
    contentEl.innerHTML = `
      <div class="popgen-grid">
        <div class="card"><div class="card-header"><h3>Passed Variants vs. Missingness Filter (%)</h3></div><div class="chart-wrapper"><canvas id="chart-missingness"></canvas></div></div>
        <div class="card"><div class="card-header"><h3>Variant Callset Criteria</h3></div>
          <table class="data-table">
            <tr><td>Total Raw Variants:</td><td><code>4,821,304</code></td></tr>
            <tr><td>Passed Biallelic SNPs:</td><td><code>1,284,910</code></td></tr>
            <tr><td>Ti/Tv Ratio:</td><td><code>2.45</code></td></tr>
          </table>
        </div>
      </div>
    `;
    const varSummary = await VerdantAPI.getVariants();
    VerdantCharts.renderMissingness(varSummary);
  } else if (module === 'structure') {
    titleEl.textContent = 'Population Structure (PCA, ADMIXTURE, FST)';
    contentEl.innerHTML = `
      <div class="popgen-grid">
        <div class="card"><div class="card-header"><h3>PCA Scatter Plot</h3></div><div class="chart-wrapper"><canvas id="chart-pca"></canvas></div></div>
        <div class="card"><div class="card-header"><h3>ADMIXTURE K=4 Stacked Barplot</h3></div><div class="chart-wrapper"><canvas id="chart-admixture"></canvas></div></div>
        <div class="card"><div class="card-header"><h3>Pairwise Differentiation (FST) Matrix</h3></div><div id="fst-matrix-view"></div></div>
        <div class="card"><div class="card-header"><h3>CV Error Curve</h3></div><div class="chart-wrapper"><canvas id="chart-cve"></canvas></div></div>
      </div>
    `;
    const pcaData = await VerdantAPI.getPCA();
    VerdantCharts.renderPCA(pcaData, '12');
    const admixData = await VerdantAPI.getAdmixture(4);
    VerdantCharts.renderAdmixture(admixData);
    const fstData = await VerdantAPI.getFST();
    VerdantCharts.renderFSTMatrix(fstData);
    VerdantCharts.renderCVE();
  } else if (module === 'diversity') {
    titleEl.textContent = 'Genome-Wide Genetic Diversity & SFS';
    contentEl.innerHTML = `
      <div class="popgen-grid">
        <div class="card"><div class="card-header"><h3>Observed Heterozygosity (Ho)</h3></div><div class="chart-wrapper"><canvas id="chart-heterozygosity"></canvas></div></div>
        <div class="card"><div class="card-header"><h3>Site Frequency Spectrum (SFS)</h3></div><div class="chart-wrapper"><canvas id="chart-sfs"></canvas></div></div>
      </div>
    `;
    const divData = await VerdantAPI.getDiversity();
    VerdantCharts.renderHeterozygosity(divData);
    VerdantCharts.renderSFS();
  } else if (module === 'inbreeding') {
    titleEl.textContent = 'Genomic Inbreeding & Runs of Homozygosity (ROH)';
    contentEl.innerHTML = `
      <div class="popgen-grid">
        <div class="card"><div class="card-header"><h3>ROH Length Classes (Table 1)</h3></div><div class="chart-wrapper"><canvas id="chart-roh"></canvas></div></div>
      </div>
    `;
    const rohData = await VerdantAPI.getROH();
    VerdantCharts.renderROH(rohData);
  } else if (module === 'aims') {
    titleEl.textContent = 'Ancestry Informative Markers (92-SNP AIM Panel)';
    contentEl.innerHTML = `
      <div class="card"><div class="card-header"><h3>92-SNP AIM Panel Classifier</h3></div><div class="chart-wrapper"><canvas id="chart-aim-assignment"></canvas></div></div>
    `;
    const res = await VerdantAPI.assignSampleAIMs({ sample_name: 'TEST_NW', genotypes: { AIM_01: 'G/G', AIM_02: 'T/T' } });
    VerdantCharts.renderAIMAssignment(res);
  } else if (module === 'mutationload') {
    titleEl.textContent = 'Mutation Load & Purging Evidence';
    contentEl.innerHTML = `
      <div class="card"><div class="card-header"><h3>Homozygous Damaging Mutations</h3></div><div class="chart-wrapper"><canvas id="chart-mutation-load"></canvas></div></div>
    `;
    const loadData = await VerdantAPI.getMutationLoad();
    VerdantCharts.renderMutationLoad(loadData);
  }
}

/** Report JSON Exporter */
window.exportReportJSON = async function(type) {
  const report = await VerdantAPI.getReports();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `verdant_${type}_report.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
