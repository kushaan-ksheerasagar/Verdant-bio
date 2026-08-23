# VERDANT Pipeline Specification

## 1. Overview
The VERDANT pipeline architecture defines the sequence of operations transforming raw next-generation sequencing data into publication-grade population genomics artifacts.

---

## 2. Genomic Processing Workflow

```mermaid
flowchart TD
    A[Raw FASTQ Reads (R1 / R2)] --> B[Stage 1: FastQC & Adapter Trimming (fastp / Trim Galore)]
    B --> C[Stage 2: Read Alignment (BWA-MEM) vs PanTigT.MC.v3]
    C --> D[Stage 3: BAM Sorting, Indexing & MarkDuplicates (samtools / Picard)]
    D --> E[Stage 4: Variant Calling (BCFtools mpileup / GATK / Strelka2)]
    E --> F[Stage 5: Variant Filtering (minDP3, minQ30, minGQ30, HWE 0.05, maxMissing 0.6)]
    F --> G[Stage 6: PLINK Conversion (.bed, .bim, .fam)]
    G --> H1[Downstream: PCA (PLINK --pca)]
    G --> H2[Downstream: ADMIXTURE (K=2..6)]
    G --> H3[Downstream: Pairwise FST Matrix]
    G --> H4[Downstream: Runs of Homozygosity (BCFtools/PLINK --homozyg)]
    H1 & H2 & H3 & H4 --> I[Stage 7: Conservation Genomics Assessment]
```

---

## 3. Toolchain & Filter Parameters

### Reference Genome
- **Assembly**: Bengal Tiger (*Panthera tigris tigris*) `GCA_021130815.1_PanTigT.MC.v3`
- **Indexing**: `bwa index`, `samtools faidx`, `picard CreateSequenceDictionary`

### Variant Filtering Rules
- **Minimum Depth (DP)**: $\ge 3\times$ per genotype
- **Minimum Base Quality (Q)**: $\ge 30$
- **Minimum Genotype Quality (GQ)**: $\ge 30$
- **Hardy-Weinberg Equilibrium (HWE)**: $p > 0.05$
- **Minor Allele Count (MAC)**: $\ge 3$
- **Maximum Missingness**: $\le 60\%$
- **Biallelic SNVs only**: Indels and multi-allelic sites partitioned into specialized streams.

---

## 4. Execution Modes & Demo Simulation

- **Production Cloud**: Nextflow DSL2 orchestration running on Google Cloud Batch with containerized Biocontainers (`quay.io/biocontainers/*`).
- **Local Investor / Interactive Demo**:
  - The UI provides an interactive **Simulated Nextflow Pipeline Visualizer** that demonstrates live DAG progression, step logs, stdout/stderr, and checkpointing.
  - **Explicit Watermarking**: Clearly labelled `"SIMULATED PIPELINE DEMONSTRATION"` to ensure transparent scientific rigor.
