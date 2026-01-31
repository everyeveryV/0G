/**
 * Wagmi 配置文件
 *
 * 📚 关键知识点：
 * 1. config 是 Wagmi 的核心配置，定义了支持的链和钱包
 * 2. createConfig 创建配置，包含 chains（支持的链）、transports（RPC 连接）
 * 3. getDefaultConfig 是 RainbowKit 提供的便捷函数，自动配置常用钱包
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { ogTestnet } from "./contract";

export const config = getDefaultConfig({
  appName: "AgentTask 0G",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // 可选：从 walletcloud.com 获取
  chains: [ogTestnet],
  ssr: true, // 服务端渲染支持
});
