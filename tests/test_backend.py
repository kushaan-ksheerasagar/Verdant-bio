"""
Unit and Integration Tests for VERDANT Conservation Genomics Platform
Tests all API endpoints, scientific calculations, data-tier labeling, auth, project creation,
upload validation, individual reports, and error handling.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.scientific_engine import ScientificEngine
from backend.models import GeneticRescueRequest

class TestVerdantBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "HEALTHY")

    def test_auth_login_and_me(self):
        # 1. Login
        login_req = {"email": "ananya.sharma@wii.gov.in", "password": "password123"}
        res = self.client.post("/api/auth/login", json=login_req)
        self.assertEqual(res.status_code, 200)
        auth_data = res.json()
        self.assertIn("vdt_token_", auth_data["token"])
        self.assertEqual(auth_data["user"]["full_name"], "Dr. Ananya Sharma")

        # 2. Get me profile
        res_me = self.client.get("/api/auth/me")
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["email"], "ananya.sharma@wii.gov.in")

    def test_project_management(self):
        # 1. List existing projects
        res_list = self.client.get("/api/projects")
        self.assertEqual(res_list.status_code, 200)
        projects = res_list.json()
        self.assertGreaterEqual(len(projects), 2)

        # 2. Create new project
        new_proj_req = {
            "name": "Western Ghats Elephant Corridor Genomics",
            "species_name": "Asian Elephant",
            "scientific_name": "Elephas maximus",
            "research_objective": "Corridor connectivity and autozygosity mapping",
            "description": "Landscape genomics across Kerala-Tamil Nadu border"
        }
        res_create = self.client.post("/api/projects", json=new_proj_req)
        self.assertEqual(res_create.status_code, 200)
        created = res_create.json()
        self.assertEqual(created["species_name"], "Asian Elephant")
        self.assertEqual(created["analysis_status"], "Awaiting Data Upload")

    def test_upload_validation(self):
        # 1. FASTQ batch upload
        fastq_req = {
            "pairs": [
                {
                    "sample_id": "ELE_WG01",
                    "r1_filename": "ELE_WG01_R1.fastq.gz",
                    "r2_filename": "ELE_WG01_R2.fastq.gz",
                    "file_size_mb": 142.5
                }
            ],
            "reference_genome": "GCA_000734575.1"
        }
        res_fq = self.client.post("/api/projects/project-tiger-genomics-india/upload/fastq", json=fastq_req)
        self.assertEqual(res_fq.status_code, 200)
        self.assertEqual(res_fq.json()["total_pairs"], 1)

    def test_individual_report(self):
        response = self.client.get("/api/reports/individual/BEN_NW10")
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        self.assertEqual(profile["sample_id"], "BEN_NW10")
        self.assertAlmostEqual(profile["froh_total"], 0.570, places=2)
        self.assertEqual(profile["homozygous_lof_mutations"], 252)
        self.assertIn("Ranthambore", profile["observed_context"])

    def test_samples_registry(self):
        response = self.client.get("/api/samples")
        self.assertEqual(response.status_code, 200)
        samples = response.json()
        self.assertGreaterEqual(len(samples), 20)
        sample_ids = [s["sample_id"] for s in samples]
        self.assertIn("BEN_NW10", sample_ids)
        self.assertIn("BEN_CI16", sample_ids)

        ben_nw10 = next(s for s in samples if s["sample_id"] == "BEN_NW10")
        self.assertEqual(ben_nw10["data_tier"], "REAL DATA")
        self.assertEqual(ben_nw10["doi"], "10.5281/zenodo.14258052")

    def test_qc_metrics(self):
        response = self.client.get("/api/qc")
        self.assertEqual(response.status_code, 200)
        qc = response.json()
        self.assertEqual(qc["overall_status"], "PASS")

    def test_variants_missingness(self):
        response = self.client.get("/api/variants")
        self.assertEqual(response.status_code, 200)
        var = response.json()
        self.assertEqual(var["data_tier"], "REAL ANALYSIS RESULTS")

    def test_pca_results(self):
        response = self.client.get("/api/pca")
        self.assertEqual(response.status_code, 200)
        pca = response.json()
        self.assertEqual(pca["data_tier"], "REAL ANALYSIS RESULTS")

    def test_admixture_results(self):
        for k in [2, 3, 4, 5, 6]:
            response = self.client.get(f"/api/admixture?k={k}")
            self.assertEqual(response.status_code, 200)
            admix = response.json()
            self.assertEqual(admix["k"], k)

    def test_fst_matrix(self):
        response = self.client.get("/api/fst")
        self.assertEqual(response.status_code, 200)
        fst = response.json()
        self.assertEqual(len(fst["populations"]), 5)

    def test_roh_inbreeding(self):
        response = self.client.get("/api/roh")
        self.assertEqual(response.status_code, 200)
        roh_list = response.json()
        nw10 = next(r for r in roh_list if r["sample_id"] == "BEN_NW10")
        self.assertGreater(nw10["froh_total"], 0.50)

    def test_aims_panel_and_assignment(self):
        response = self.client.get("/api/aims")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total_aims"], 92)

        assign_req = {
            "sample_name": "TEST_NW_TIGER",
            "genotypes": {"AIM_01": "G/G", "AIM_02": "T/T"}
        }
        res_assign = self.client.post("/api/aims/assign", json=assign_req)
        self.assertEqual(res_assign.status_code, 200)

    def test_genetic_rescue_simulation(self):
        req = GeneticRescueRequest(
            recipient_population="BEN_NW",
            donor_population="BEN_CI",
            translocated_individuals_count=2,
            generations=10
        )
        sim = ScientificEngine.simulate_genetic_rescue(req)
        self.assertEqual(sim.data_tier.value, "SIMULATED DEMO DATA")
        self.assertGreater(sim.delta_f, 0.0)

    def test_provenance_dag(self):
        response = self.client.get("/api/provenance")
        self.assertEqual(response.status_code, 200)
        dag = response.json()
        self.assertGreaterEqual(len(dag), 6)

    def test_conservation_assessment(self):
        response = self.client.get("/api/assessment")
        self.assertEqual(response.status_code, 200)
        assess = response.json()
        self.assertIn("Ranthambore", assess["observation"])

    def test_reports(self):
        response = self.client.get("/api/reports")
        self.assertEqual(response.status_code, 200)
        rep = response.json()
        self.assertIn("assessment", rep)

if __name__ == "__main__":
    unittest.main()
