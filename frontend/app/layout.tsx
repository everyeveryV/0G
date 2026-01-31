import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers";

export const metadata: Metadata = {
  title: "AgentTask 0G - 去中心化任务平台",
  description: "一个给 AI Agent 用的任务平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
