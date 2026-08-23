# VERDANT Panthera tigris Demonstration Dataset Guide

## 1. Dataset Provenance & Attribution
This demonstration dataset utilizes real genomic data and research publications on the Bengal tiger (*Panthera tigris tigris*):

- **Primary Dataset DOI**: [10.5281/zenodo.14258052](https://zenodo.org/records/14258052)
- **Filtered VCF / PLINK Dataset**: [10.5281/zenodo.15263700](https://zenodo.org/records/15263700)
- **Reference Assembly**: `GCA_021130815.1_PanTigT.MC.v3` (Shukla et al., 2023, *GigaScience*, 12, giac112)
- **Key Scientific Publication**: Khan, A., Patel, K., Shukla, H., Viswanathan, A., van der Valk, T., Borthakur, U., Nigam, P., Zachariah, A., Jhala, Y.V., Kardos, M. and Ramakrishnan, U., 2021. *Genomic evidence for inbreeding depression and purging of deleterious genetic variation in Indian tigers*. **PNAS**, 118(49), p.e2023018118.

---

## 2. Cohort Structure & Biological Samples

### Real Biological Samples (Zenodo 14258052):
1. **Central India (`BEN_CI`)**:
   - `BEN_CI16` (Central India / Kanha-Pench landscape)
   - `BEN_CI18` (Central India)
2. **North-West India (`BEN_NW`)**:
   - `BEN_NW10` (Ranthambore Tiger Reserve - isolated population with documented high inbreeding)
   - `BEN_NW12` (Ranthambore / NW landscape)
   - `BEN_NW13` (Ranthambore / NW landscape)
3. **South India (`BEN_SI`)**:
   - `BEN_SI9` (Western Ghats / Wayanad landscape)
   - `BEN_SI18` (South India / Bandipur-Nagarhole)
   - `BEN_SI19` (South India)
4. **Outgroup / Control**:
   - `LGS1` (*Panthera leo* comparative outgroup / control)

---

## 3. Data Integrity & Labelling Standards
- **Real Data**: FASTQ samples, reference assembly accession, PLINK genotype coordinates, Weir & Cockerham $F_{ST}$ matrices calculated from Khan et al.
- **Unavailable Data**: Marked with `"Not available in current dataset."` (e.g. fine-scale non-published GPS points to protect anti-poaching operations).
- **Simulated Demonstration**: Genetic rescue translocation scenario models and live pipeline DAG executions are explicitly labeled with `"SIMULATED DEMO DATA"`.
