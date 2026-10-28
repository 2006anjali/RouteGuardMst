require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    mstCoral: {
      url: process.env.MST_CORAL_RPC_URL || "https://coralrpc.mstblockchain.com",
      chainId: 54635,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
