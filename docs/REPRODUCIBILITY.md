# VERDANT Reproducibility & Provenance Framework

## 1. Reproducibility Pillars
Every analytical result generated or displayed in VERDANT must be 100% reproducible by independent third parties.

---

## 2. Provenance Metadata Contract
For every result entity, the following metadata dictionary is immutably recorded:

```json
{
  "provenance_id": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "timestamp": "2026-08-22T00:00:00Z",
  "analysis_type": "POPULATION_PCA",
  "pipeline_name": "verdant-popgen-plink",
  "pipeline_version": "v1.2.0",
  "git_commit": "bf9cd89d3cb708ea04fdf9077c263b2f9919a9a5",
  "reference_genome": {
    "accession": "GCA_021130815.1",
    "name": "PanTigT.MC.v3",
    "uri": "https://zenodo.org/records/14258052/files/GCA_021130815.1_PanTigT.MC.v3_genomic.fna",
    "sha256": "4b63e8df21b0..."
  },
  "input_files": [
    {
      "name": "machali_Aligned_rangeWideMerge_filtered.bed",
      "uri": "https://zenodo.org/records/15263700/files/machali_Aligned_rangeWideMerge_filtered.bed",
      "sha256": "c891f7a0..."
    }
  ],
  "software_environment": {
    "software": "PLINK",
    "version": "v1.90b6.21 64-bit",
    "container_image": "docker://biocontainers/plink:v1.90b6.21_cv1"
  },
  "parameters": {
    "--pca": 5,
    "--allow-extra-chr": true,
    "--double-id": true
  },
  "reproduction_command": "plink --bfile machali_Aligned_rangeWideMerge_filtered --pca 5 --allow-extra-chr --double-id --out results_pca",
  "output_checksums": {
    "results_pca.eigenvec": "sha256:9123ac...",
    "results_pca.eigenval": "sha256:bb7641..."
  }
}
```

---

## 3. "How was this calculated?" & "Reproduce this analysis"
In the UI, every chart and table features:
1. **"How was this calculated?" Modal**: Explains the mathematical methodology, software version, data inputs, and filtering criteria.
2. **"Reproduce this analysis" Modal**: Provides one-click copyable Bash commands, Nextflow pipeline snippets, and Docker run commands to replicate the exact analysis on any HPC or workstation.
