# VERDANT Scientific Specification

## 1. Scientific Objectives
VERDANT provides a rigorous, reproducible framework for wildlife and conservation genomics. It bridges the gap between raw sequencing reads and evidence-based wildlife management decisions without making unverified assertions.

---

## 2. Core Statistical & Population Genomic Methods

### 2.1 Principal Component Analysis (PCA)
- **Methodology**: Singular Value Decomposition (SVD) of normalized genotype matrices ($X$), where each element $x_{ij} \in \{0, 1, 2\}$ represents the alternate allele count for sample $i$ at biallelic locus $j$.
- **Standardization**: Patterson et al. (2006) formulation:
  $$M_{ij} = \frac{x_{ij} - 2p_j}{\sqrt{2p_j(1 - p_j)}}$$
  where $p_j$ is the estimated sample allele frequency at locus $j$.
- **Variance Explained**: Eigenvalues $\lambda_k$ compute proportion of variance:
  $$\text{Var}(PC_k) = \frac{\lambda_k}{\sum_{m=1}^M \lambda_m}$$

### 2.2 Population Differentiation ($F_{ST}$)
- **Methodology**: Weir & Cockerham (1984) unbiased estimator $\theta$:
  $$\hat{\theta} = \frac{\sum_i \sigma_{a,i}^2}{\sum_i (\sigma_{a,i}^2 + \sigma_{b,i}^2 + \sigma_{w,i}^2)}$$
- Computes pairwise differentiation between geographic clusters (e.g. North-West vs Central India vs South India vs Sundarbans).

### 2.3 Runs of Homozygosity (ROH) & Inbreeding ($F_{ROH}$)
- **Methodology**: Identification of contiguous stretches of homozygous genotypes indicative of identity-by-descent (IBD) resulting from shared recent ancestry.
- **Inbreeding Coefficient ($F_{ROH}$)**:
  $$F_{ROH} = \frac{\sum L_{ROH}}{L_{auto}}$$
  where $\sum L_{ROH}$ is the total length of identified ROH segments above a length threshold (e.g. $> 1\text{ Mb}$ or $> 5\text{ Mb}$), and $L_{auto}$ is the total autosomal genome length ($\approx 2.42\text{ Gb}$ for *Panthera tigris*).
- **Classification**: Short ROH ($<2.5\text{ Mb}$) reflect ancient background bottlenecks; Long ROH ($>5\text{ Mb}$) reflect severe recent inbreeding within the past few generations.

### 2.4 Observed Heterozygosity ($H_o$)
- **Methodology**:
  $$H_o = \frac{N_{\text{heterozygous}}}{N_{\text{total callable sites}}}$$

---

## 3. Genetic Rescue Simulator Formulation

### 3.1 Projection Model
- Simulates expected change in inbreeding ($\Delta F$) and gene diversity ($\Delta H_e$) over $t$ generations following the introduction of $m$ effective migrant breeders into an isolated recipient population of effective size $N_e$:
  $$F_t = F_0 (1 - m)^{2t} \left(1 - \frac{1}{2N_e}\right)^t + \dots$$
- Models multi-locus heterozygosity recovery and the dilution of accumulated homozygous deleterious mutations.

### 3.2 Assumptions & Uncertainty
1. **Assumptions**:
   - Random mating within recipient population following introduction.
   - Equal reproductive success of translocated individuals unless specified otherwise.
   - Neutral or quasi-neutral genomic landscape for core diversity metrics.
   - No immediate severe hybrid breakdown (outbreeding depression) between closely related subspecies/populations.
2. **Uncertainty Bounds**:
   - 95% Confidence Intervals derived via parametric Monte Carlo iterations ($N=1000$) accounting for demographic stochasticity in offspring recruitment.

---

## 4. Scientific Safety & Tripartite Reporting

To guarantee safety and prevent misinterpretation, all outputs adhere to the **Tripartite Separation**:
1. **OBSERVATION**: Factual data points and measured values (e.g., "Sample BEN_NW10 exhibits $F_{ROH} = 0.32$ with 14 ROH segments $>5\text{ Mb}$").
2. **STATISTICAL INTERPRETATION**: Mathematical inferences based on population genetics models (e.g., "Indicates significant recent consanguinity and reduced local effective population size").
3. **CONSERVATION CONTEXT**: Management framing and non-binding decision support (e.g., "Candidate population for assisted gene flow or corridor enhancement. Field validation of reproductive fitness recommended").
