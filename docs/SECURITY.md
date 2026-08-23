# VERDANT Security & Data Governance

## 1. Threat Model & Sensitive Wildlife Data Protection
Genomic and geographic data of endangered wildlife (e.g. *Panthera tigris*, *Diceros bicornis*) presents significant anti-poaching and biosecurity risks.

### Safeguards:
1. **Coordinate Masking & Generalization**: Exact nest/kill/sighting GPS coordinates can be generalized to reserve polygons or landscape centroids.
2. **Role-Based Access Control (RBAC)**:
   - `Viewer`: Access to aggregated population metrics.
   - `Researcher`: Access to VCF and individual genotype data.
   - `Admin / Conservation Officer`: Full access including raw GPS and rescue simulator configurations.
3. **Audit Trail**: Every access, download, or parameter adjustment is logged in an immutable audit table.
4. **Data Sovereignity & Encryption**: All data at rest encrypted via AES-256; TLS 1.3 in transit.
