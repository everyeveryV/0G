import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  // 关键设置：EVM版本必须设为 cancun
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "paris",  // ← 0G Testnet 必须使用 cancun
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 0G Galileo Testnet 配置
    "0g-testnet": {
      url: "https://evmrpc-testnet.0g.ai",  // 官方 RPC
      chainId: 16602,                        // 官方 Chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      "0g-testnet": "placeholder",  // 验证合约时需要（暂时用占位符）
    },
    customChains: [
      {
        network: "0g-testnet",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
    ],
  },
};

export default config;
