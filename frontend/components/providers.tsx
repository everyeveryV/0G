"use client";

/**
 * Providers 组件
 *
 * 📚 关键知识点：
 * 1. WagmiProvider: 提供 Wagmi hooks（useAccount, useReadContract, useWriteContract 等）
 * 2. QueryClientProvider: 提供 React Query 数据缓存
 * 3. RainbowKitProvider: 提供钱包连接 UI
 *
 * 这个组件包裹在 layout.tsx 中，让整个应用都可以使用这些功能
 */

import * as React from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "./wagmi-config";
import "@rainbow-me/rainbowkit/styles.css";

// 创建 QueryClient（用于数据缓存和自动刷新）
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
