"""
VERDANT Pydantic Domain Data Models
Defines typed schemas for projects, species, samples, QC, variants, population genomics,
AIM panels, mutation load, ROH, genetic rescue simulations, provenance, reports, auth,
and upload validation.
"""

from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field
from enum import Enum

class DataTier(str, Enum):
    REAL_DATA = "REAL DATA"
    REAL_ANALYSIS_RESULTS = "REAL ANALYSIS RESULTS"
    SIMULATED_DEMO_DATA = "SIMULATED DEMO DATA"
    DATA_UNAVAILABLE = "Data unavailable for this analysis."

class GeoStatus(str, Enum):
    VERIFIED_COORDINATES = "VERIFIED_COORDINATES"
    LANDSCAPE_CENTROID_ONLY = "LANDSCAPE_CENTROID_ONLY"
    GEOGRAPHIC_METADATA_UNAVAILABLE = "GEOGRAPHIC_METADATA_UNAVAILABLE"

class SampleAccess(str, Enum):
    PUBLIC = "PUBLIC"
    RESTRICTED = "RESTRICTED"
    PRIVATE = "PRIVATE"

class UserRole(str, Enum):
    RESEARCHER = "RESEARCHER"
    CONSERVATION_MANAGER = "CONSERVATION_MANAGER"
    GENETICIST = "GENETICIST"
    ADMIN = "ADMIN"

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    institution: str
    role: UserRole = UserRole.RESEARCHER
    avatar_url: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserSignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    institution: str
    role: UserRole = UserRole.RESEARCHER

class AuthResponse(BaseModel):
    token: str
    user: UserProfile
    message: str

class Sample(BaseModel):
    sample_id: str
    species: str
    population_id: str
    population_name: str
    landscape_location: str
    access_level: SampleAccess = SampleAccess.PUBLIC
    data_tier: DataTier = DataTier.REAL_DATA
    doi: Optional[str] = "10.5281/zenodo.14258052"
    citation: Optional[str] = "Khan et al. (2021) PNAS / Khan et al. (2022) Heredity"
    sex: Optional[str] = None
    age_class: Optional[str] = "Adult"
    sample_type: Optional[str] = "Tissue / Blood"
    sequencing_platform: str = "Illumina HiSeq / NovaSeq (Paired-End 150bp)"
    mean_depth_coverage: Optional[str] = "Data unavailable for this analysis."
    total_reads: Optional[str] = "Data unavailable for this analysis."
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geo_status: GeoStatus = GeoStatus.LANDSCAPE_CENTROID_ONLY
    fastq_r1: Optional[str] = None
    fastq_r2: Optional[str] = None
    md5_r1: Optional[str] = None
    md5_r2: Optional[str] = None
    heterozygosity_ho: Optional[float] = None
    inbreeding_froh: Optional[float] = None
    assigned_cluster_aim: Optional[str] = None

class ProjectCreateRequest(BaseModel):
    name: str
    species_name: str
    scientific_name: str
    research_objective: str
    description: Optional[str] = ""
    dataset_type: str = "Whole-Genome Resequencing (WGS)"

class ProjectMetadata(BaseModel):
    id: str
    name: str
    species_name: str
    scientific_name: str
    taxonomy_id: int
    reference_genome: str
    reference_accession: str
    reference_doi: str
    dataset_doi: str
    primary_citations: List[str]
    description: str
    total_samples: int
    populations_count: int
    reference_genome_length: str
    data_tier_breakdown: Dict[str, int]
    analysis_status: str = "Analysis Complete"
    last_updated: str = "2026-08-22"
    dataset_type: str = "Whole-Genome Resequencing (WGS)"
    is_demo: bool = False

class FastqPairUpload(BaseModel):
    sample_id: str
    r1_filename: str
    r2_filename: str
    file_size_mb: float
    status: str = "VALIDATED"

class FastqUploadResponse(BaseModel):
    project_id: str
    total_pairs: int
    pairs: List[FastqPairUpload]
    reference_genome_selected: str
    message: str

class VcfUploadValidationResponse(BaseModel):
    filename: str
    is_valid: bool
    samples_count: int
    samples_detected: List[str]
    variants_count: int
    chromosomes_detected: List[str]
    format_version: str
    reference_compatible: bool
    message: str

class IndividualGenomicProfile(BaseModel):
    sample_id: str
    species: str
    population_id: str
    population_name: str
    landscape_location: str
    sex: Optional[str] = None
    mean_depth_coverage: Optional[str] = None
    heterozygosity_ho: Optional[float] = None
    heterozygosity_population_mean: float
    froh_total: Optional[float] = None
    froh_population_mean: float
    froh_100kb: float
    froh_1mb: float
    froh_5mb: float
    froh_10mb: float
    total_roh_mb: float
    pca_coordinates: Dict[str, float]  # {"pc1": 0.141, "pc2": 0.018, "pc3": 0.012}
    admixture_proportions: Dict[str, float]
    aim_assigned_cluster: str
    aim_confidence: float
    homozygous_damaging_mutations: int
    homozygous_lof_mutations: int
    observed_context: str
    interpretation_context: str
    conservation_context: str
    limitations: str
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS

class PCAPoint(BaseModel):
    sample_id: str
    population_id: str
    population_name: str
    region: str
    pc1: float
    pc2: float
    pc3: float
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS

class PCAResult(BaseModel):
    method: str
    software: str
    software_version: str
    variance_explained: List[float]
    points: List[PCAPoint]
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS
    provenance_id: str

class AdmixtureKResult(BaseModel):
    k: int
    cv_error: Optional[float] = None
    cluster_labels: List[str]
    sample_proportions: Dict[str, List[float]]
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS
    interpretation_note: str
    provenance_id: str

class FSTMatrixResult(BaseModel):
    populations: List[str]
    matrix: List[List[float]]
    method: str = "Weir and Cockerham (1984) Unbiased Estimator"
    citation: str = "Khan et al. (2022) Heredity / Khan et al. (2021) PNAS"
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS
    provenance_id: str

class ROHSampleResult(BaseModel):
    sample_id: str
    population_id: str
    population_name: str
    froh_total: float
    froh_100kb: float
    froh_1mb: float
    froh_5mb: float
    froh_10mb: float
    total_roh_mb: float
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS

class MutationLoadMetric(BaseModel):
    population_id: str
    population_name: str
    mean_homozygous_damaging: int
    mean_homozygous_lof: int
    rxy_missense_vs_central: float
    rxy_lof_vs_central: float
    fixed_deleterious_pct: float
    purging_evidence: str
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS

class AIMMarker(BaseModel):
    snp_id: str
    chromosome: str
    position: int
    ref_allele: str
    alt_allele: str
    infocalc_rank: int
    in_49_test_panel: bool
    allele_frequencies: Dict[str, float]

class AIMPanelInfo(BaseModel):
    name: str
    species: str
    total_aims: int
    test_panel_aims: int
    reference_populations: List[str]
    citation: str = "Khan et al. (2022) Heredity 128:88–96"
    discovery_methods: List[str]
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS

class AIMAssignmentRequest(BaseModel):
    sample_name: str
    genotypes: Dict[str, str]

class AIMAssignmentResponse(BaseModel):
    sample_name: str
    most_likely_population: str
    assignment_probabilities: Dict[str, float]
    confidence_score: float
    markers_evaluated: int
    missing_markers_count: int
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS
    disclaimer: str

class VariantMissingnessCurvePoint(BaseModel):
    max_missingness_pct: int
    passed_variants_count: int

class VariantFilterSummary(BaseModel):
    total_raw_variants: int
    passed_biallelic_snps: int
    indels_identified: int
    transition_transversion_ratio: float
    missingness_curve: List[VariantMissingnessCurvePoint]
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS

class GeneticRescueRequest(BaseModel):
    recipient_population: str = "BEN_NW"
    donor_population: str = "BEN_CI"
    translocated_individuals_count: int = Field(default=2, ge=1, le=10)
    generations: int = Field(default=10, ge=1, le=30)
    current_effective_population_size_ne: int = Field(default=25, ge=5, le=500)
    migration_success_rate: float = Field(default=0.75, ge=0.1, le=1.0)

class GeneticRescueProjection(BaseModel):
    generation: int
    baseline_froh: float
    projected_froh_mean: float
    projected_froh_lower95: float
    projected_froh_upper95: float
    heterozygosity_gain_pct: float

class GeneticRescueResponse(BaseModel):
    simulation_id: str
    data_tier: DataTier = DataTier.SIMULATED_DEMO_DATA
    recipient_population: str
    donor_population: str
    translocated_count: int
    generations: int
    initial_froh: float
    final_froh_projected: float
    delta_f: float
    projections: List[GeneticRescueProjection]
    assumptions: List[str]
    uncertainty_analysis: str
    disclaimer: str

class ProvenanceNode(BaseModel):
    id: str
    step_name: str
    category: str
    software: str
    version: str
    inputs: List[Dict[str, str]]
    parameters: Dict[str, Any]
    reference_genome: str
    reference_version: str
    pipeline_version: str
    git_commit: str
    outputs: List[Dict[str, str]]
    logs_snippet: str
    reproduction_command: str
    data_tier: DataTier

class ConservationAssessment(BaseModel):
    assessment_id: str
    species: str
    date_evaluated: str
    data_tier: DataTier = DataTier.REAL_ANALYSIS_RESULTS
    observation: str
    statistical_interpretation: str
    conservation_context: str
    limitations: str
    disclaimer: str
