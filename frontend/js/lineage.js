/**
 * VERDANT Provenance & Lineage Visualizer
 * Interactive DAG flow displaying full cryptographic lineage from FASTQ to Assessment.
 */

const VerdantLineage = {
  nodesData: [],

  init(nodes) {
    this.nodesData = nodes;
    this.renderDAG();
    if (nodes && nodes.length > 0) {
      this.selectNode(nodes[nodes.length - 2].id); // Default to PopGen node
    }
  },

  renderDAG() {
    const container = document.getElementById('dag-flow-container');
    if (!container) return;

    let html = '';
    this.nodesData.forEach((node, index) => {
      let tierBadge = 'badge-real-data';
      if (node.data_tier === 'REAL ANALYSIS RESULTS') tierBadge = 'badge-real-analysis';
      else if (node.data_tier === 'SIMULATED DEMO DATA') tierBadge = 'badge-simulated';

      html += `
        <div class="dag-node" id="node-card-${node.id}" onclick="VerdantLineage.selectNode('${node.id}')">
          <div>
            <div class="dag-node-title">${node.step_name}</div>
            <div class="dag-node-meta">${node.software} (${node.version})</div>
          </div>
          <div>
            <span class="badge ${tierBadge}">${node.data_tier}</span>
          </div>
        </div>
      `;

      if (index < this.nodesData.length - 1) {
        html += `<div class="dag-connector">&darr;</div>`;
      }
    });

    container.innerHTML = html;
  },

  selectNode(nodeId) {
    const node = this.nodesData.find(n => n.id === nodeId);
    if (!node) return;

    // Highlight selected card
    document.querySelectorAll('.dag-node').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`node-card-${nodeId}`);
    if (activeEl) activeEl.classList.add('active');

    // Populate detail panel
    const titleEl = document.getElementById('detail-node-title');
    const tierEl = document.getElementById('detail-node-tier');
    const bodyEl = document.getElementById('detail-node-body');

    if (titleEl) titleEl.textContent = `${node.step_name} — Audit Record`;
    if (tierEl) {
      tierEl.textContent = node.data_tier;
      tierEl.className = `badge ${node.data_tier === 'REAL DATA' ? 'badge-real-data' : (node.data_tier === 'REAL ANALYSIS RESULTS' ? 'badge-real-analysis' : 'badge-simulated')}`;
    }

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="detail-section">
          <h4>Software & Pipeline Environment</h4>
          <p><strong>Tool:</strong> ${node.software} (<code>${node.version}</code>)</p>
          <p><strong>Pipeline Version:</strong> <code>${node.pipeline_version}</code></p>
          <p><strong>Git Commit:</strong> <code>${node.git_commit}</code></p>
          <p><strong>Reference Genome:</strong> <code>${node.reference_genome}</code></p>
        </div>

        <div class="detail-section">
          <h4>Execution Parameters</h4>
          <pre class="code-block">${JSON.stringify(node.parameters, null, 2)}</pre>
        </div>

        <div class="detail-section">
          <h4>Reproducible CLI Command</h4>
          <pre class="code-block">${node.reproduction_command}</pre>
        </div>

        <div class="detail-section">
          <h4>Output Checksums & Verification</h4>
          <pre class="code-block">${JSON.stringify(node.outputs, null, 2)}</pre>
        </div>

        <div class="detail-section">
          <h4>Execution Log Snippet</h4>
          <pre class="code-block">${node.logs_snippet}</pre>
        </div>
      `;
    }
  }
};
