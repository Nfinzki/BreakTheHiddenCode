import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  gasReporter: {
    enabled: true,
    noColors: false,
    currency: "EUR",
    outputFile: "gas-report-matic.txt",
    token: "MATIC",
  },
};

export default config;
