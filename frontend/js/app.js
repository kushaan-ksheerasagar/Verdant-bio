/**
 * VERDANT Main Application Logic
 * Client-Side Router, View Controllers, User Session, Mobile Drawer & Scientific Chart Loaders.
 * Sole Scientific Basis: Khan et al. (2022), Heredity (DOI: 10.1038/s41437-021-00477-y)
 */

let currentPcaData = null;
let currentAdmixK = 3;

document.addEventListener('DOMContentLoaded', async () => {
  initRouter();
  initMobileDrawer();
  await handleRoute();
});

window.addEventListener('hashchange', async () => {
  await handleRoute();
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

  // Close mobile sidebar on navigation
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.remove('open');

  // Clear active state on sidebar items
  document.querySelectorAll('.sidebar-nav-item a').forEach(a => a.classList.remove('active'));

  if (hash === '#/' || hash === '') {
    showPane('view-landing');
  } else if (hash === '#/raw-data') {
    showPane('view-raw-data');
    highlightNav('nav-raw-data');
  } else if (hash === '#/qc') {
    showPane('view-qc');
    highlightNav('nav-qc');
    setTimeout(() => { VerdantCharts.renderQCCharts(); }, 60);
  } else if (hash === '#/alignment') {
    showPane('view-alignment');
    highlightNav('nav-alignment');
    setTimeout(() => { VerdantCharts.renderQCCharts(); }, 60);
  } else if (hash === '#/variants') {
    showPane('view-variants');
    highlightNav('nav-variants');
    setTimeout(async () => { await loadVariantsView(); }, 60);
  } else if (hash === '#/structure') {
    showPane('view-structure');
    highlightNav('nav-structure');
    setTimeout(async () => { await loadStructureView(); }, 60);
  } else if (hash === '#/profile') {
    showPane('view-profile');
    highlightNav('nav-profile');
    setTimeout(async () => { await loadIndividualReport('NW10'); }, 60);
  } else if (hash === '#/aims') {
    showPane('view-aims');
    highlightNav('nav-aims');
    setTimeout(async () => { await loadAimsView(); }, 60);
  } else if (hash === '#/reproducibility') {
    showPane('view-reproducibility');
    highlightNav('nav-reproducibility');
  } else if (hash.includes('/demo')) {
    window.location.hash = '#/raw-data';
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
  try {
    const varSummary = await VerdantAPI.getVariants();
    VerdantCharts.renderMissingness(varSummary);
  } catch (err) {
    console.error("Error loading variants view:", err);
  }
}

/** Structure View Loader */
async function loadStructureView() {
  try {
    currentPcaData = await VerdantAPI.getPCA();
    VerdantCharts.renderPCA(currentPcaData, '12');

    const admixData = await VerdantAPI.getAdmixture(currentAdmixK);
    VerdantCharts.renderAdmixture(admixData);
    VerdantCharts.renderCVE();

    const fstData = await VerdantAPI.getFST();
    VerdantCharts.renderFSTMatrix(fstData);
  } catch (err) {
    console.error("Error loading structure view:", err);
  }
}

/** Change PCA axis view */
window.loadPCAView = function(axisStr) {
  if (currentPcaData) {
    VerdantCharts.renderPCA(currentPcaData, axisStr);
  }
};

/** Change ADMIXTURE K model */
window.changeAdmixtureK = async function(kVal) {
  currentAdmixK = kVal;
  const buttons = document.querySelectorAll('#k-buttons-row button');
  buttons.forEach(btn => {
    if (btn.textContent.includes(`K=${kVal}`)) {
      btn.className = 'btn btn-primary';
    } else {
      btn.className = 'btn btn-outline';
    }
  });

  try {
    const admixData = await VerdantAPI.getAdmixture(kVal);
    VerdantCharts.renderAdmixture(admixData);
  } catch (err) {
    console.error("Error updating ADMIXTURE K:", err);
  }
};

/** AIMs View Loader */
async function loadAimsView() {
  try {
    const aimRes = await VerdantAPI.assignSampleAIMs({
      sample_name: 'NW10',
      genotypes: { AIM_01: 'G/G', AIM_02: 'T/T' }
    });
    VerdantCharts.renderAIMAssignment(aimRes);
  } catch (err) {
    console.error("Error loading AIMs view:", err);
  }
}

/** Individual Profile View Loader */
async function loadIndividualReport(sampleId) {
  const select = document.getElementById('indiv-specimen-select');
  if (select) select.value = sampleId;

  try {
    const profile = await VerdantAPI.getIndividualReport(sampleId);
    const pcaData = await VerdantAPI.getPCA();

    document.getElementById('profile-pop-val').textContent = profile.population_name || 'North-West';
    document.getElementById('profile-anc-val').textContent = `${(profile.aim_confidence * 100).toFixed(0)}% ${profile.aim_assigned_cluster}`;
    document.getElementById('profile-cov-val').textContent = profile.mean_depth_coverage || '18.4x';
    document.getElementById('profile-ho-val').textContent = profile.heterozygosity_ho ? profile.heterozygosity_ho.toFixed(5) : '0.00062';

    document.getElementById('indiv-pca-badge').textContent = `${profile.sample_id} HIGHLIGHTED`;

    // Render Individual Charts
    VerdantCharts.renderIndividualPCA(pcaData, profile.sample_id, '12', 'chart-indiv-pca');
    VerdantCharts.renderIndividualAdmixture(profile, 'chart-indiv-admix');

    // Observed / Computed Result vs Scientific Interpretation
    document.getElementById('indiv-ctx-obs').textContent = profile.observed_context;
    document.getElementById('indiv-ctx-interp').textContent = profile.interpretation_context;
  } catch (err) {
    console.error("Error loading individual report:", err);
  }
}

window.loadIndividualReport = loadIndividualReport;

/** Chatbot Widget Functions */
window.toggleChatbotModal = function() {
  const modal = document.getElementById('chatbot-modal');
  if (modal) {
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
      const input = document.getElementById('chat-user-input');
      if (input) input.focus();
    }
  }
};

window.sendQuickChatMessage = function(msgText) {
  const input = document.getElementById('chat-user-input');
  if (input) {
    input.value = msgText;
    processChatMessage(msgText);
    input.value = '';
  }
};

window.handleChatSubmit = function(evt) {
  if (evt) evt.preventDefault();
  const input = document.getElementById('chat-user-input');
  if (input && input.value.trim()) {
    const text = input.value.trim();
    processChatMessage(text);
    input.value = '';
  }
};

function processChatMessage(text) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Append user bubble
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-bubble chat-bubble-user';
  userMsg.textContent = text;
  container.appendChild(userMsg);

  // Generate bot response based on keywords
  const lower = text.toLowerCase();
  let botReply = '';
  let jumpHash = '';
  let jumpLabel = '';

  if (lower.includes('pca') || lower.includes('structure') || lower.includes('cluster') || lower.includes('admixture') || lower.includes('fst')) {
    botReply = "For population genetic structure, VERDANT evaluates whole-genome SNPs across wild Indian tigers based on Khan et al. (2022) <em>Heredity</em>. The dataset identifies 4 major population clusters (North-East, North-West, South, and Terai/Central India), with <strong>K=3</strong> identified as the optimal ADMIXTURE model.";
    jumpHash = '#/structure';
    jumpLabel = '📊 Go to 05 Population Structure';
  } else if (lower.includes('fastq') || lower.includes('raw') || lower.includes('read') || lower.includes('download') || lower.includes('zenodo')) {
    botReply = "VERDANT includes raw paired-end FASTQ read demonstrations deposited in Zenodo (Archive 15173226), generated on Illumina NovaSeq platforms across 35 wild tiger specimens.";
    jumpHash = '#/raw-data';
    jumpLabel = '📁 Go to 01 Raw Data';
  } else if (lower.includes('aim') || lower.includes('marker') || lower.includes('panel') || lower.includes('snp')) {
    botReply = "The 92-SNP Ancestry Informative Marker (AIM) panel is derived from Infocalc ranking and ADMIXTURE consensus. It enables rapid, cost-effective population assignment for non-invasive scat or tissue samples without requiring full WGS.";
    jumpHash = '#/aims';
    jumpLabel = '🎯 Go to 07 AIMs Assignment';
  } else if (lower.includes('pipeline') || lower.includes('command') || lower.includes('terminal') || lower.includes('code') || lower.includes('bwa') || lower.includes('gatk')) {
    botReply = "You can inspect and copy the complete end-to-end command-line workflow (FastQC &rarr; Trim Galore &rarr; BWA-MEM &rarr; SAMtools &rarr; GATK MarkDuplicates &rarr; Qualimap &rarr; VCFtools &rarr; PLINK / ADMIXTURE) in our Reproducibility module.";
    jumpHash = '#/reproducibility';
    jumpLabel = '💻 Go to 08 Reproducibility';
  } else if (lower.includes('individual') || lower.includes('specimen') || lower.includes('profile') || lower.includes('sample') || lower.includes('ranthambore') || lower.includes('kaziranga') || lower.includes('wayanad')) {
    botReply = "You can inspect authentic individual genomic profiles, observed heterozygosity (Ho), fold coverage depth, and ancestry proportions for individual wild tigers.";
    jumpHash = '#/profile';
    jumpLabel = '🐯 Go to 06 Individual Profile';
  } else {
    botReply = `Great goal! VERDANT provides end-to-end conservation genomics analysis tailored for <em>${text}</em>. You can explore raw FASTQ data, quality metrics, population structure (PCA & ADMIXTURE K=3), individual specimen reports, and exact reproducible CLI pipelines.`;
    jumpHash = '#/structure';
    jumpLabel = '🚀 Explore Population Genomics';
  }

  // Append agent bubble after small typing delay
  setTimeout(() => {
    const agentMsg = document.createElement('div');
    agentMsg.className = 'chat-bubble chat-bubble-agent';
    agentMsg.innerHTML = botReply;

    if (jumpHash) {
      const btn = document.createElement('a');
      btn.className = 'chat-jump-btn';
      btn.textContent = jumpLabel;
      btn.onclick = () => {
        toggleChatbotModal();
        window.location.hash = jumpHash;
      };
      agentMsg.appendChild(document.createElement('br'));
      agentMsg.appendChild(btn);
    }

    container.appendChild(agentMsg);
    container.scrollTop = container.scrollHeight;
  }, 250);

  container.scrollTop = container.scrollHeight;
}
