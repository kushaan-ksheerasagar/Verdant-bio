/**
 * VERDANT API Client
 * Centralized async fetch wrapper for all backend REST endpoints including Auth, Projects, Uploads & Reports.
 */

const API_BASE = '/api';

const VerdantAPI = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Auth Methods
  async loginUser(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
    return res.json();
  },

  async signupUser(payload) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Signup failed: ${res.statusText}`);
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error(`Failed to fetch current user profile`);
    return res.json();
  },

  // Projects Methods
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
    return res.json();
  },

  async createProject(payload) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Project creation failed: ${res.statusText}`);
    return res.json();
  },

  async getProject(projectId = 'current') {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`);
    if (!res.ok) throw new Error(`Failed to fetch project: ${res.statusText}`);
    return res.json();
  },

  // Upload Methods
  async uploadFastqBatch(projectId, pairs, referenceGenome = 'GCA_021130815.1_PanTigT.MC.v3') {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/upload/fastq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairs, reference_genome: referenceGenome })
    });
    if (!res.ok) throw new Error(`FASTQ batch staging failed: ${res.statusText}`);
    return res.json();
  },

  async uploadProjectVcf(projectId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/upload/vcf`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(`VCF validation failed: ${res.statusText}`);
    return res.json();
  },

  async uploadVCF(file) {
    return this.uploadProjectVcf('project-tiger-genomics-india', file);
  },

  // Biological Samples & Profiles
  async getSamples(populationId = null, accessLevel = null, dataTier = null) {
    let url = `${API_BASE}/samples`;
    const params = new URLSearchParams();
    if (populationId && populationId !== 'ALL') params.append('population_id', populationId);
    if (accessLevel && accessLevel !== 'ALL') params.append('access_level', accessLevel);
    if (dataTier && dataTier !== 'ALL') params.append('data_tier', dataTier);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`);
    return res.json();
  },

  async getSample(sampleId) {
    const res = await fetch(`${API_BASE}/samples/${encodeURIComponent(sampleId)}`);
    if (!res.ok) throw new Error(`Failed to fetch sample ${sampleId}: ${res.statusText}`);
    return res.json();
  },

  async getIndividualReport(sampleId) {
    const res = await fetch(`${API_BASE}/reports/individual/${encodeURIComponent(sampleId)}`);
    if (!res.ok) throw new Error(`Failed to fetch individual report for ${sampleId}: ${res.statusText}`);
    return res.json();
  },

  // Scientific Modules
  async getQC() {
    const res = await fetch(`${API_BASE}/qc`);
    if (!res.ok) throw new Error(`Failed to fetch QC data: ${res.statusText}`);
    return res.json();
  },

  async getVariants() {
    const res = await fetch(`${API_BASE}/variants`);
    if (!res.ok) throw new Error(`Failed to fetch variants: ${res.statusText}`);
    return res.json();
  },

  async getPCA() {
    const res = await fetch(`${API_BASE}/pca`);
    if (!res.ok) throw new Error(`Failed to fetch PCA data: ${res.statusText}`);
    return res.json();
  },

  async getAdmixture(k = 4) {
    const res = await fetch(`${API_BASE}/admixture?k=${k}`);
    if (!res.ok) throw new Error(`Failed to fetch ADMIXTURE data: ${res.statusText}`);
    return res.json();
  },

  async getFST() {
    const res = await fetch(`${API_BASE}/fst`);
    if (!res.ok) throw new Error(`Failed to fetch FST matrix: ${res.statusText}`);
    return res.json();
  },

  async getDiversity() {
    const res = await fetch(`${API_BASE}/diversity`);
    if (!res.ok) throw new Error(`Failed to fetch diversity data: ${res.statusText}`);
    return res.json();
  },

  async getROH() {
    const res = await fetch(`${API_BASE}/roh`);
    if (!res.ok) throw new Error(`Failed to fetch ROH data: ${res.statusText}`);
    return res.json();
  },

  async getMutationLoad() {
    const res = await fetch(`${API_BASE}/mutation-load`);
    if (!res.ok) throw new Error(`Failed to fetch mutation load: ${res.statusText}`);
    return res.json();
  },

  async getAIMsPanel() {
    const res = await fetch(`${API_BASE}/aims`);
    if (!res.ok) throw new Error(`Failed to fetch AIMs panel: ${res.statusText}`);
    return res.json();
  },

  async assignSampleAIMs(payload) {
    const res = await fetch(`${API_BASE}/aims/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`AIM assignment failed: ${res.statusText}`);
    return res.json();
  },

  async simulateGeneticRescue(params) {
    const res = await fetch(`${API_BASE}/genetic-rescue/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`Rescue simulation failed: ${res.statusText}`);
    return res.json();
  },

  async getProvenance() {
    const res = await fetch(`${API_BASE}/provenance`);
    if (!res.ok) throw new Error(`Failed to fetch provenance: ${res.statusText}`);
    return res.json();
  },

  async getProvenanceNode(nodeId) {
    const res = await fetch(`${API_BASE}/provenance/${encodeURIComponent(nodeId)}`);
    if (!res.ok) throw new Error(`Failed to fetch node ${nodeId}: ${res.statusText}`);
    return res.json();
  },

  async getMethodology() {
    const res = await fetch(`${API_BASE}/methodology`);
    if (!res.ok) throw new Error(`Failed to fetch methodology: ${res.statusText}`);
    return res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`);
    return res.json();
  },

  async getAssessment() {
    const res = await fetch(`${API_BASE}/assessment`);
    if (!res.ok) throw new Error(`Failed to fetch assessment: ${res.statusText}`);
    return res.json();
  },

  async getCompute() {
    const res = await fetch(`${API_BASE}/compute`);
    if (!res.ok) throw new Error(`Failed to fetch compute stats: ${res.statusText}`);
    return res.json();
  },

  async getPipelineStatus() {
    const res = await fetch(`${API_BASE}/pipeline/simulate`);
    if (!res.ok) throw new Error(`Failed to fetch pipeline status: ${res.statusText}`);
    return res.json();
  },

  async runPipeline() {
    const res = await fetch(`${API_BASE}/pipeline/run`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to run pipeline: ${res.statusText}`);
    return res.json();
  }
};
