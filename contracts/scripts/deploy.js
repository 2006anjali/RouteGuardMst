const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const activeNetwork = await ethers.provider.getNetwork();

  console.log("Deploying from wallet:", deployer.address);
  console.log("Network:", network.name);
  console.log("Network Chain ID:", activeNetwork.chainId.toString());

  const RouteGuard = await ethers.getContractFactory("RouteGuard");
  const routeGuard = await RouteGuard.deploy();

  await routeGuard.waitForDeployment();

  const deploymentTransaction = routeGuard.deploymentTransaction();
  if (!deploymentTransaction) {
    throw new Error("Deployment transaction was not available.");
  }

  const receipt = await deploymentTransaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("RouteGuard deployment was not confirmed successfully.");
  }

  console.log("RouteGuard deployed to:", await routeGuard.getAddress());
  console.log("Deployment transaction hash:", receipt.hash);
  console.log("Deployment confirmed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
