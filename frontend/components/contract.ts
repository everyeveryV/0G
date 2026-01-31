/**
 * 合约配置文件
 *
 * 📚 关键知识点：
 * 1. ABI (Application Binary Interface): 智能合约的接口定义，告诉前端如何调用合约函数
 * 2. 从 Hardhat 部署后，ABI 在 artifacts/contracts/AgentTask.sol/AgentTask.json 的 "abi" 字段
 * 3. 我们把 ABI 复制到这里，方便前端引用
 */

import { type Chain } from "viem";

// 📍 0G Galileo Testnet 链配置
// 手动定义链配置，不依赖 RainbowKit 的内置链
export const ogTestnet = {
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
} as const satisfies Chain;

// 📍 合约地址（从部署脚本获取）
export const CONTRACT_ADDRESS = "0xE077259edCAAFcc66b1Cf00157FDB886c72e3f7C" as const;

// 🔧 ABI - 智能合约的函数定义
// 这个是从 Hardhat 编译后的 JSON 文件中提取的 "abi" 字段
export const CONTRACT_ABI = [
  // 查询函数
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tasks",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "employer", type: "address" },
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "reward", type: "uint256" },
      { internalType: "string", name: "submissionUrl", type: "string" },
      { internalType: "bool", name: "isSubmitted", type: "bool" },
      { internalType: "bool", name: "isApproved", type: "bool" },
      { internalType: "bool", name: "isCompleted", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalTasks",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // 写入函数
  {
    inputs: [{ internalType: "string", name: "description", type: "string" }],
    name: "createTask",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "taskId", type: "uint256" },
      { internalType: "string", name: "submissionUrl", type: "string" },
    ],
    name: "submitTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "taskId", type: "uint256" }],
    name: "approveTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // 事件（用于监听链上活动）
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "taskId", type: "uint256" },
      { indexed: true, internalType: "address", name: "employer", type: "address" },
      { indexed: false, internalType: "uint256", name: "reward", type: "uint256" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
    ],
    name: "TaskCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "taskId", type: "uint256" },
      { indexed: true, internalType: "address", name: "agent", type: "address" },
      { indexed: false, internalType: "string", name: "submissionUrl", type: "string" },
    ],
    name: "TaskSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "taskId", type: "uint256" },
      { indexed: true, internalType: "address", name: "employer", type: "address" },
      { indexed: true, internalType: "address", name: "agent", type: "address" },
      { indexed: false, internalType: "uint256", name: "reward", type: "uint256" },
    ],
    name: "TaskApproved",
    type: "event",
  },
] as const;

/**
 * 📚 TypeScript 类型定义
 * 根据合约结构体定义的 Task 类型
 */
export type Task = {
  id: bigint;
  employer: string;
  agent: string;
  description: string;
  reward: bigint;
  submissionUrl: string;
  isSubmitted: boolean;
  isApproved: boolean;
  isCompleted: boolean;
};
