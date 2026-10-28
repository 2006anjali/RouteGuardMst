const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying from wallet:", deployer.address);

  const RouteGuard = await ethers.getContractFactory("RouteGuard");
  const routeGuard = await RouteGuard.deploy();

  await routeGuard.waitForDeployment();

  console.log("RouteGuard deployed to:", await routeGuard.getAddress());

  const network = await ethers.provider.getNetwork();
  console.log("Network Chain ID:", network.chainId.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
