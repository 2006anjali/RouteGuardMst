const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("RouteGuard", function () {
  async function deployRouteGuardFixture() {
    const [owner, assessor1, assessor2] = await ethers.getSigners();
    const RouteGuard = await ethers.getContractFactory("RouteGuard");
    const rg = await RouteGuard.deploy();
    return { rg, owner, assessor1, assessor2 };
  }

  describe("Deployment", function () {
    it("Should set nextAssessmentId to 1 on deployment", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      expect(await rg.nextAssessmentId()).to.equal(1);
    });
  });

  describe("recordAssessment - Valid Assessments", function () {
    it("Should record a valid approved assessment and increment nextAssessmentId to 2", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await rg.recordAssessment("Arbitrum Canonical Bridge", 15, true, "Qm1234abc");
      expect(await rg.nextAssessmentId()).to.equal(2);
    });

    it("Should store correct assessment details in the mapping", async function () {
      const { rg, owner } = await loadFixture(deployRouteGuardFixture);
      await rg.recordAssessment("Route-A", 42, true, "hash-report-1");
      const stored = await rg.assessments(1);
      expect(stored.id).to.equal(1);
      expect(stored.routeName).to.equal("Route-A");
      expect(stored.riskScore).to.equal(42);
      expect(stored.approved).to.equal(true);
      expect(stored.reportHash).to.equal("hash-report-1");
      expect(stored.assessor).to.equal(owner.address);
    });

    it("Should record a non-approved assessment with riskScore 0", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await rg.recordAssessment("High Risk Route", 0, false, "hash-zero");
      const stored = await rg.assessments(1);
      expect(stored.approved).to.equal(false);
      expect(stored.riskScore).to.equal(0);
    });

    it("Should record a boundary riskScore of exactly 100", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await rg.recordAssessment("Max Risk Route", 100, false, "hash-max");
      const stored = await rg.assessments(1);
      expect(stored.riskScore).to.equal(100);
    });

    it("Should assign sequential IDs (1, 2, 3) for multiple assessments", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await rg.recordAssessment("Route One", 10, true, "hash-1");
      await rg.recordAssessment("Route Two", 20, false, "hash-2");
      await rg.recordAssessment("Route Three", 30, true, "hash-3");
      const a1 = await rg.assessments(1);
      const a2 = await rg.assessments(2);
      const a3 = await rg.assessments(3);
      expect(a1.id).to.equal(1);
      expect(a2.id).to.equal(2);
      expect(a3.id).to.equal(3);
      expect(await rg.nextAssessmentId()).to.equal(4);
    });

    it("Should set assessor to msg.sender (non-owner account)", async function () {
      const { rg, assessor1 } = await loadFixture(deployRouteGuardFixture);
      await rg.connect(assessor1).recordAssessment("Route-X", 55, true, "hash-assessor");
      const stored = await rg.assessments(1);
      expect(stored.assessor).to.equal(assessor1.address);
    });

    it("Should emit AssessmentRecorded event with correct args", async function () {
      const { rg, owner } = await loadFixture(deployRouteGuardFixture);
      await expect(rg.recordAssessment("Emit Route", 77, true, "hash-emit"))
        .to.emit(rg, "AssessmentRecorded")
        .withArgs(1, "Emit Route", 77, true, owner.address);
    });

    it("Should store a non-zero timestamp", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await rg.recordAssessment("Timestamp Route", 25, true, "hash-ts");
      const stored = await rg.assessments(1);
      expect(stored.timestamp).to.be.gt(0);
    });
  });

  describe("recordAssessment - Validation Failures", function () {
    it("Should revert with 'Route name required' when routeName is empty", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await expect(
        rg.recordAssessment("", 50, true, "hash-empty-name")
      ).to.be.revertedWith("Route name required");
    });

    it("Should revert with 'Report hash required' when reportHash is empty", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await expect(
        rg.recordAssessment("Valid Route", 50, true, "")
      ).to.be.revertedWith("Report hash required");
    });

    it("Should revert with 'Risk score must be 0-100' when riskScore is 101", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await expect(
        rg.recordAssessment("Valid Route", 101, true, "hash-high-score")
      ).to.be.revertedWith("Risk score must be 0-100");
    });

    it("Should revert with 'Risk score must be 0-100' when riskScore is 200", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await expect(
        rg.recordAssessment("Valid Route", 200, true, "hash-very-high")
      ).to.be.revertedWith("Risk score must be 0-100");
    });

    it("Should not increment nextAssessmentId after a failed call", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await expect(rg.recordAssessment("", 50, true, "hash")).to.be.reverted;
      expect(await rg.nextAssessmentId()).to.equal(1);
    });

    it("Should revert on empty routeName even when reportHash is also empty", async function () {
      const { rg } = await loadFixture(deployRouteGuardFixture);
      await expect(
        rg.recordAssessment("", 50, true, "")
      ).to.be.revertedWith("Route name required");
    });
  });
});
