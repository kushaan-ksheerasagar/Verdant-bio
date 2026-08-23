/**
 * VERDANT Main Application Logic
 * Client-Side Router, View Controllers, User Session, Mobile Drawer & Scientific Chart Loaders.
 */

let reportMap = null;
let currentSamples = [];

document.addEventListener('DOMContentLoaded', async () => {
  initRouter();
  initMobileDrawer();
  
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

function initMobileDrawer() {
  const drawerToggle = document.getElementById('mobile-drawer-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (drawerToggle && sidebar) {
    drawerToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

async function handleRoute() {
  const hash = window.location.hash || '#/';
  const panes = document.querySelectorAll('.view-pane');
  panes.forEach(p => p.classList.remove('active'));

  // Close mobile sidebar on route navigation
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.remove('open');

  // Highlight active sidebar nav item
  document.querySelectorAll('.sidebar-nav-item a').forEach(a => a.classList.remove('active'));

  if (hash === '#/' || hash === '') {
    showPane('view-landing');
  } else if (hash === '#/raw-data') {
    showPane('view-raw-data');
    highlightNav('nav-raw-data');
  } else if (hash === '#/qc' || hash.includes('/analysis/qc')) {
    showPane('view-qc');
    highlightNav('nav-qc');
    VerdantCharts.renderQCCharts();
  } else if (hash === '#/alignment') {
    showPane('view-alignment');
    highlightNav('nav-alignment');
    VerdantCharts.renderQCCharts();
  } else if (hash === '#/variants' || hash.includes('/analysis/variants')) {
    showPane('view-variants');
    highlightNav('nav-variants');
    await loadVariantsView();
  } else if (hash === '#/filtering') {
    showPane('view-filtering');
    highlightNav('nav-filtering');
  } else if (hash === '#/structure' || hash.includes('/analysis/structure')) {
    showPane('view-structure');
    highlightNav('nav-structure');
    await loadStructureView();
  } else if (hash === '#/profile' || hash.includes('/reports/individual')) {
    showPane('view-profile');
    highlightNav('nav-profile');
    await loadIndividualReport('BEN_NW10');
  } else if (hash === '#/inbreeding' || hash.includes('/analysis/inbreeding')) {
    showPane('view-inbreeding');
    highlightNav('nav-inbreeding');
    await loadInbreedingView();
  } else if (hash === '#/rescue' || hash.includes('/reports/conservation')) {
    showPane('view-rescue');
    highlightNav('nav-rescue');
    await loadConservationReport();
  } else if (hash === '#/provenance' || hash.includes('/reproducibility')) {
    showPane('view-provenance');
    highlightNav('nav-provenance');
    await loadReproducibilityView();
  } else if (hash === '#/sources') {
    showPane('view-sources');
  } else if (hash.includes('/demo/tiger')) {
    showPane('view-profile');
    highlightNav('nav-profile');
    await loadIndividualReport('BEN_NW10');
  } else {
    showPane('view-landing');
  }

  window.scrollTo(0, 0);
}

function showPane(paneId) {
  const el = document.getElementById(paneId);
  if (el) el.classList.add('active');
}

function highlightNav(navId) {
  const el = document.getElementById(navId);
  if (el) el.classList.add('active');
}

/** Variants View Loader */
async function loadVariantsView() {
  const varSummary = await VerdantAPI.getVariants();
  VerdantCharts.renderMissingness(varSummary);
}

/** Structure View Loader */
async function loadStructureView() {
  const pcaData = await VerdantAPI.getPCA();
  VerdantCharts.renderPCA(pcaData, '12');

  const admixData = await VerdantAPI.getAdmixture(4);
  VerdantCharts.renderAdmixture(admixData);

  const fstData = await VerdantAPI.getFST();
  VerdantCharts.renderFSTMatrix(fstData);

  const aimRes = await VerdantAPI.assignSampleAIMs({
    sample_name: 'BEN_NW10',
    genotypes: { AIM_01: 'G/G', AIM_02: 'T/T' }
  });
  VerdantCharts.renderAIMAssignment(aimRes);
}

/** Inbreeding View Loader */
async function loadInbreedingView() {
  const rohData = await VerdantAPI.getROH();
  VerdantCharts.renderROH(rohData);

  const loadData = await VerdantAPI.getMutationLoad();
  VerdantCharts.renderMutationLoad(loadData);
}

/** Individual Profile View Loader */
async function loadIndividualReport(sampleId) {
  const select = document.getElementById('indiv-specimen-select');
  if (select) select.value = sampleId;

  const profile = await VerdantAPI.getIndividualReport(sampleId);
  const pcaData = await VerdantAPI.getPCA();

  document.getElementById('profile-pop-val').textContent = profile.population_name || 'North-West';
  document.getElementById('profile-anc-val').textContent = `${(profile.aim_confidence * 100).toFixed(0)}% ${profile.aim_assigned_cluster}`;
  document.getElementById('profile-froh-val').textContent = profile.froh_total ? `${(profile.froh_total * 100).toFixed(1)}%` : 'N/A';
  document.getElementById('profile-lof-val').textContent = profile.homozygous_lof_mutations;

  document.getElementById('indiv-pca-badge').textContent = `${profile.sample_id} HIGHLIGHTED`;

  // Render Individual Charts
  VerdantCharts.renderIndividualPCA(pcaData, profile.sample_id, '12', 'chart-indiv-pca');
  VerdantCharts.renderIndividualROH(profile, 'chart-indiv-roh');

  // Render 4-Level Context
  document.getElementById('indiv-ctx-obs').textContent = profile.observed_context;
  document.getElementById('indiv-ctx-interp').textContent = profile.interpretation_context;
  document.getElementById('indiv-ctx-context').textContent = profile.conservation_context;
}

window.loadIndividualReport = loadIndividualReport;

/** Conservation & Rescue Report Loader */
async function loadConservationReport() {
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

/** Reproducibility & Provenance View Loader */
async function loadReproducibilityView() {
  const nodes = await VerdantAPI.getProvenance();
  VerdantLineage.init(nodes);
}

/** Species quick select helper */
window.selectSpeciesQuick = function(speciesStr) {
  const input = document.getElementById('proj-input-species');
  if (input) input.value = speciesStr;
};

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
