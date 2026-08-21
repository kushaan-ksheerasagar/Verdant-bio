# VERDANT Database Model

## Core Schema
- **User**: Authentication and profile
- **Project**: Workspaces for specific analyses
- **Species**: Taxonomy reference
- **Population**: Defined groups of samples
- **Sample**: Individual biological samples
- **File**: Managed genomic files in Cloud Storage
- **ReferenceGenome**: Genome assemblies
- **AnalysisJob**: Nextflow/Batch compute tracking
- **Analysis**: Specific logical analyses (e.g. PCA, ADMIXTURE)
- **Pipeline**: Reusable Nextflow workflows
- **PipelineRun**: Execution instances
- **Result**: Structured outputs (coordinates, matrices)
- **Metric**: Summary statistics (heterozygosity, FST)
- **Report**: Final conservation insights
- **Provenance**: Track data origins
- **AuditLog**: Data governance
- **Subscription/UsageRecord**: Billing
