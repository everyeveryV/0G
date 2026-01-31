"use client";

/**
 * AgentTask 0G - 主页面 (星露谷像素风 🌾)
 *
 * 📚 关键知识点：
 *
 * 1. useReadContract: 读取合约数据（自动缓存 + 自动刷新）
 *    - 当链上数据变化时，会自动重新获取
 *
 * 2. useWriteContract: 写入合约数据（需要用户签名）
 *    - 返回 writeContract 函数用于调用合约
 *    - 返回 isConfirming、isConfirmed 等状态用于 UI 反馈
 *
 * 3. useAccount: 获取当前连接的钱包信息
 *    - address: 当前钱包地址
 *    - isConnected: 是否已连接
 *
 * 4. 自动刷新机制：
 *    - useReadContract 会自动监听链上变化
 *    - 也可以通过 refetchInterval 设置定时刷新
 *    - 写入操作成功后，React Query 会自动重新获取数据
 */

import { useState, useEffect } from "react";
import { useAccount, useReadContract, usePublicClient, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  type Task,
} from "../components/contract";

// 角色类型
type Role = "employer" | "agent";

export default function Home() {
  // ========== 状态管理 ==========
  const [role, setRole] = useState<Role>("employer"); // 当前选择的角色
  const [description, setDescription] = useState(""); // 任务描述输入
  const [reward, setReward] = useState(""); // 奖励金额输入
  const [submissionUrl, setSubmissionUrl] = useState(""); // 提交链接输入
  const [selectedTaskId, setSelectedTaskId] = useState<bigint | null>(null); // Agent选中的任务ID

  // ========== Wagmi Hooks ==========
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // 写入合约的 hook
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  // 用于手动触发刷新的状态
  const [forceRefresh, setForceRefresh] = useState(0);

  // 监听交易哈希变化，等待交易确认后刷新
  useEffect(() => {
    if (!hash || !publicClient) return;

    console.log("📝 交易哈希:", hash);

    const waitForTransaction = async () => {
      try {
        console.log("⏳ 等待交易确认...");
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });
        console.log("✅ 交易已确认！", receipt);
        // 交易确认后触发刷新
        setForceRefresh(prev => prev + 1);
      } catch (error) {
        console.error("❌ 等待交易确认失败:", error);
      }
    };

    waitForTransaction();
  }, [hash, publicClient]);

  // 📖 读取：获取任务总数
  const { data: totalTasks } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTotalTasks",
    query: {
      // 每 10 秒自动刷新一次
      refetchInterval: 10000,
    },
  });

  // 使用 publicClient 和 useEffect 来获取所有任务
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!publicClient) return;

      console.log("🔄 开始获取任务列表... forceRefresh =", forceRefresh);

      // 先获取任务总数
      const taskCountBigInt = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getTotalTasks",
      });

      if (!taskCountBigInt) return;

      const taskCount = Number(taskCountBigInt);
      console.log("📊 任务总数:", taskCount);

      const fetchedTasks: Task[] = [];

      for (let i = 0; i < taskCount; i++) {
        try {
          const taskData = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "tasks",
            args: [BigInt(i)],
          });
          if (taskData) {
            // taskData 是数组，需要转换成对象
            // [id, employer, agent, description, reward, submissionUrl, isSubmitted, isApproved, isCompleted]
            const taskArray = taskData as unknown as readonly [bigint, string, string, string, bigint, string, boolean, boolean, boolean];
            const task: Task = {
              id: taskArray[0],
              employer: taskArray[1],
              agent: taskArray[2],
              description: taskArray[3],
              reward: taskArray[4],
              submissionUrl: taskArray[5],
              isSubmitted: taskArray[6],
              isApproved: taskArray[7],
              isCompleted: taskArray[8],
            };
            console.log(`✅ 任务 #${i}:`, task);
            console.log(`  - employer: ${task.employer}`);
            console.log(`  - description: ${task.description}`);
            console.log(`  - reward: ${task.reward}`);
            fetchedTasks.push(task);
          }
        } catch (error) {
          console.error(`❌ 获取任务 #${i} 失败:`, error);
        }
      }

      console.log("📋 设置任务列表，共", fetchedTasks.length, "个任务");
      console.log("🔑 当前连接的地址:", address);
      console.log("📋 过滤后的我的任务:", fetchedTasks.filter((t) => t.employer?.toLowerCase() === address?.toLowerCase()));
      setTasks(fetchedTasks);
    };

    fetchAllTasks();
  }, [publicClient, forceRefresh]); // 交易成功后自动刷新

  // ========== 事件处理函数 ==========

  // 创建任务
  const handleCreateTask = async () => {
    if (!description || !reward) {
      alert("请填写任务描述和奖励金额");
      return;
    }

    try {
      console.log("1️⃣ 开始发布任务...", { description, reward });

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createTask",
        args: [description],
        value: BigInt(parseFloat(reward) * 1e18),
      });

      console.log("2️⃣ 交易已提交");

      // 清空输入框
      setDescription("");
      setReward("");
      alert("任务发布中！请在钱包中确认交易，等待几秒后查看任务列表。");
    } catch (error: any) {
      console.error("❌ 发布失败详细错误:", error);
      console.error("错误堆栈:", error.stack);
      alert("发布失败，请检查控制台");
    }
  };

  // 提交任务（Agent）
  const handleSubmitTask = async () => {
    if (selectedTaskId === null || !submissionUrl) {
      alert("请选择任务并填写提交链接");
      return;
    }

    try {
      console.log("开始提交任务...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "submitTask",
        args: [selectedTaskId, submissionUrl],
      });

      console.log("交易已提交");

      setSubmissionUrl("");
      setSelectedTaskId(null);
      alert("任务提交中！请在钱包中确认交易，等待几秒后查看任务状态。");
    } catch (error) {
      console.error(error);
      alert("提交失败，请检查控制台");
    }
  };

  // 验收任务（Employer）
  const handleApproveTask = async (taskId: bigint) => {
    try {
      console.log("开始验收任务...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "approveTask",
        args: [taskId],
      });

      console.log("交易已提交");
      alert("验收中！请在钱包中确认交易，等待几秒后查看任务状态。");
    } catch (error) {
      console.error(error);
      alert("验收失败，请检查控制台");
    }
  };

  // ========== 辅助函数 ==========

  // 格式化地址（显示前6位和后4位）
  const formatAddress = (addr: string) => {
    if (!addr) return ''; // 如果地址不存在，直接返回空，避免报错
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 格式化 ETH（从 Wei 转换为 ETH）
  const formatETH = (wei: bigint) =>
    (Number(wei) / 1e18).toFixed(4);

  // 判断任务状态
  const getTaskStatus = (task: Task) => {
    if (task.isCompleted) return "已完成";
    if (task.isApproved) return "已验收";
    if (task.isSubmitted) return "待验收";
    if (task.agent !== "0x0000000000000000000000000000000000000000") return "进行中";
    return "开放";
  };

  // 获取状态对应的样式（星露谷风格）
  const getStatusStyles = (task: Task) => {
    if (task.isCompleted)
      return { bg: "bg-amber-700", text: "text-amber-100", border: "border-amber-900" };
    if (task.isApproved)
      return { bg: "bg-green-600", text: "text-green-100", border: "border-green-800" };
    if (task.isSubmitted)
      return { bg: "bg-yellow-600", text: "text-yellow-100", border: "border-yellow-800" };
    if (task.agent !== "0x0000000000000000000000000000000000000000")
      return { bg: "bg-blue-600", text: "text-blue-100", border: "border-blue-800" };
    return { bg: "bg-emerald-500", text: "text-emerald-100", border: "border-emerald-700" };
  };

  // ========== 渲染 ==========

  return (
    <div className="min-h-screen bg-amber-50">
      {/* 像素风格样式注入 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        .pixel-font {
          font-family: 'Press Start 2P', cursive;
        }

        .pixel-border {
          box-shadow:
            -4px 0 0 0 #5c4033,
            4px 0 0 0 #5c4033,
            0 -4px 0 0 #5c4033,
            0 4px 0 0 #5c4033,
            -4px -4px 0 0 #5c4033,
            4px -4px 0 0 #5c4033,
            -4px 4px 0 0 #5c4033,
            4px 4px 0 0 #5c4033;
        }

        .pixel-border-thin {
          box-shadow:
            -2px 0 0 0 #8b7355,
            2px 0 0 0 #8b7355,
            0 -2px 0 0 #8b7355,
            0 2px 0 0 #8b7355;
        }

        .pixel-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow:
            -6px 0 0 0 #3d2914,
            6px 0 0 0 #3d2914,
            0 -6px 0 0 #3d2914,
            0 6px 0 0 #3d2914;
        }

        .pixel-btn:active {
          transform: translate(0, 0);
          box-shadow:
            -4px 0 0 0 #3d2914,
            4px 0 0 0 #3d2914,
            0 -4px 0 0 #3d2914,
            0 4px 0 0 #3d2914;
        }
      `}</style>

      {/* 顶部导航 - 星露谷风格 */}
      <header className="sticky top-0 z-10 bg-amber-100 border-b-4 border-amber-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-700 pixel-border flex items-center justify-center">
              <span className="text-white text-lg">🌾</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-amber-900 pixel-font leading-relaxed">
                AgentTask
              </h1>
              <p className="text-xs text-amber-700 pixel-font">0G Testnet</p>
            </div>
          </div>
          <div className="pixel-border-thin bg-amber-200">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {!isConnected ? (
          // 未连接钱包状态
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-amber-200 pixel-border flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🚜</span>
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-4 pixel-font leading-relaxed">
              连接钱包
            </h2>
            <p className="text-amber-700 pixel-font text-xs">开始你的任务之旅</p>
          </div>
        ) : (
          <>
            {/* 角色切换 Tab - 星露谷风格 */}
            <div className="flex gap-4 mb-10">
              <button
                onClick={() => setRole("employer")}
                className={`px-6 py-3 pixel-font text-xs transition-all ${
                  role === "employer"
                    ? "bg-amber-700 text-amber-100 pixel-border"
                    : "bg-amber-200 text-amber-800 pixel-border-thin"
                }`}
              >
                发布者
              </button>
              <button
                onClick={() => setRole("agent")}
                className={`px-6 py-3 pixel-font text-xs transition-all ${
                  role === "agent"
                    ? "bg-green-600 text-green-100 pixel-border"
                    : "bg-green-200 text-green-800 pixel-border-thin"
                }`}
              >
                执行者
              </button>
            </div>

            {/* 发布者面板 */}
            {role === "employer" && (
              <div className="space-y-8">
                {/* 创建任务表单 */}
                <div className="bg-amber-100 p-6 pixel-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-amber-600 pixel-border-thin flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-amber-900 pixel-font leading-relaxed">
                        发布新任务
                      </h2>
                      <p className="text-xs text-amber-700 pixel-font">创建任务并锁定奖励</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-2 pixel-font">
                        任务描述
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="输入任务描述..."
                        className="w-full bg-amber-50 border-4 border-amber-700 px-4 py-3 text-amber-900 placeholder-amber-400 focus:outline-none pixel-font text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-2 pixel-font">
                        奖励金额（0G）
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        placeholder="0.01"
                        className="w-full bg-amber-50 border-4 border-amber-700 px-4 py-3 text-amber-900 placeholder-amber-400 focus:outline-none pixel-font text-xs"
                      />
                    </div>
                    <button
                      onClick={handleCreateTask}
                      disabled={isPending}
                      className="w-full bg-amber-700 text-amber-100 pixel-font text-xs py-4 pixel-border pixel-btn disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? "发布中..." : "发布任务"}
                    </button>
                  </div>
                </div>

                {/* 我发布的任务列表 */}
                <div className="bg-amber-100 p-6 pixel-border">
                  <h2 className="text-sm font-bold text-amber-900 mb-6 pixel-font leading-relaxed flex items-center gap-2">
                    <span>📋</span>
                    <span>我的任务</span>
                  </h2>
                  {tasks.filter((t) => t.employer?.toLowerCase() === address?.toLowerCase())
                    .length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-amber-200 pixel-border-thin flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📭</span>
                      </div>
                      <p className="text-amber-700 pixel-font text-xs">暂无任务</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks
                        .filter((t) => t.employer?.toLowerCase() === address?.toLowerCase())
                        .map((task) => {
                          const statusStyles = getStatusStyles(task);
                          return (
                            <div
                              key={task.id.toString()}
                              className="bg-amber-50 p-5 pixel-border-thin"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-amber-600 pixel-font">
                                      #{task.id.toString()}
                                    </span>
                                    <span
                                      className={`${statusStyles.bg} ${statusStyles.text} border-2 ${statusStyles.border} px-2 py-1 pixel-font text-xs`}
                                    >
                                      {getTaskStatus(task)}
                                    </span>
                                  </div>
                                  <p className="text-amber-900 font-bold text-xs pixel-font leading-relaxed">{task.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-xs text-amber-700 mt-4">
                                <span className="flex items-center gap-2">
                                  <span>💰</span>
                                  <span className="text-amber-900 pixel-font">{formatETH(task.reward)}</span> 0G
                                </span>
                                {task.agent !== "0x0000000000000000000000000000000000000000" && (
                                  <span className="flex items-center gap-2">
                                    <span>👤</span>
                                    {formatAddress(task.agent)}
                                  </span>
                                )}
                              </div>
                              {/* 待验收时显示验收按钮 */}
                              {task.isSubmitted &&
                                !task.isApproved &&
                                task.employer.toLowerCase() ===
                                  address?.toLowerCase() && (
                                <button
                                  onClick={() => handleApproveTask(task.id)}
                                  disabled={isPending}
                                  className="mt-4 w-full bg-green-600 text-green-100 pixel-font text-xs py-3 pixel-border pixel-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {isPending ? (
                                    "处理中..."
                                  ) : (
                                    <>
                                      <span>✓</span>
                                      <span>验收通过</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agent 面板 */}
            {role === "agent" && (
              <div className="space-y-8">
                {/* 提交任务表单 */}
                <div className="bg-green-100 p-6 pixel-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-600 pixel-border-thin flex items-center justify-center">
                      <span className="text-2xl">🐔</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-green-900 pixel-font leading-relaxed">
                        提交任务
                      </h2>
                      <p className="text-xs text-green-700 pixel-font">接取并完成任务</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-green-900 mb-2 pixel-font">
                        选择任务
                      </label>
                      <select
                        value={selectedTaskId?.toString() || ""}
                        onChange={(e) =>
                          setSelectedTaskId(
                            e.target.value ? BigInt(e.target.value) : null
                          )
                        }
                        className="w-full bg-green-50 border-4 border-green-700 px-4 py-3 text-green-900 focus:outline-none pixel-font text-xs"
                      >
                        <option value="">-- 选择任务 --</option>
                        {tasks
                          .filter(
                            (t) =>
                              t.agent ===
                                "0x0000000000000000000000000000000000000000" &&
                              !t.isCompleted
                          )
                          .map((task) => (
                            <option
                              key={task.id.toString()}
                              value={task.id.toString()}
                            >
                              #{task.id.toString()} - {task.description} ({formatETH(task.reward)} 0G)
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-green-900 mb-2 pixel-font">
                        提交链接
                      </label>
                      <input
                        type="text"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-green-50 border-4 border-green-700 px-4 py-3 text-green-900 placeholder-green-400 focus:outline-none pixel-font text-xs"
                      />
                    </div>
                    <button
                      onClick={handleSubmitTask}
                      disabled={isPending}
                      className="w-full bg-green-600 text-green-100 pixel-font text-xs py-4 pixel-border pixel-btn disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? "提交中..." : "提交任务"}
                    </button>
                  </div>
                </div>

                {/* 所有任务列表 */}
                <div className="bg-emerald-100 p-6 pixel-border">
                  <h2 className="text-sm font-bold text-emerald-900 mb-6 pixel-font leading-relaxed flex items-center gap-2">
                    <span>📋</span>
                    <span>所有任务</span>
                  </h2>
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-emerald-200 pixel-border-thin flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📭</span>
                      </div>
                      <p className="text-emerald-700 pixel-font text-xs">暂无任务</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task, index) => {
                        const statusStyles = getStatusStyles(task);
                        return (
                          <div
                            key={task.id?.toString() || index}
                            className="bg-emerald-50 p-5 pixel-border-thin"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-emerald-600 pixel-font">
                                    #{task.id?.toString()}
                                  </span>
                                  <span
                                    className={`${statusStyles.bg} ${statusStyles.text} border-2 ${statusStyles.border} px-2 py-1 pixel-font text-xs`}
                                  >
                                    {getTaskStatus(task)}
                                  </span>
                                </div>
                                <p className="text-emerald-900 font-bold text-xs pixel-font leading-relaxed">{task.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-emerald-700 mt-4">
                              <span className="flex items-center gap-2">
                                <span>👤</span>
                                {formatAddress(task.employer)}
                              </span>
                              <span className="flex items-center gap-2">
                                <span>💰</span>
                                <span className="text-emerald-900 pixel-font">{formatETH(task.reward)}</span> 0G
                              </span>
                            </div>
                            {task.agent !== "0x0000000000000000000000000000000000000000" && (
                              <div className="flex items-center gap-2 text-xs text-emerald-700 mt-2">
                                <span>🐔</span>
                                执行者: {formatAddress(task.agent)}
                              </div>
                            )}
                            {task.isSubmitted && task.submissionUrl && (
                              <div className="mt-3 text-xs">
                                <span className="text-emerald-600 flex items-center gap-2">
                                  <span>🔗</span>
                                  提交链接:
                                </span>
                                <a
                                  href={task.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-800 hover:text-emerald-600 font-bold ml-2 pixel-font"
                                >
                                  {task.submissionUrl.length > 30
                                    ? task.submissionUrl.slice(0, 30) + "..."
                                    : task.submissionUrl}
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 底部装饰 */}
      <footer className="text-center py-6 border-t-4 border-amber-800 bg-amber-100">
        <div className="flex justify-center items-center gap-2 text-amber-700">
          <span>🌾</span>
          <p className="pixel-font text-xs">AgentTask 0G - Stardew Valley Edition</p>
          <span>🌾</span>
        </div>
      </footer>
    </div>
  );
}
