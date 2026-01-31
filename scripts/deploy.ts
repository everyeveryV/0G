import hre from "hardhat";

async function main() {
  console.log("\n🚀 开始部署 AgentTask 合约到 0G Galileo Testnet...\n");

  // 获取合约工厂
  const AgentTask = await hre.ethers.getContractFactory("AgentTask");

  // 部署合约
  console.log("⏳ 正在部署...");
  const agentTask = await AgentTask.deploy();

  // 等待部署完成（获取几个区块确认）
  await agentTask.waitForDeployment();

  // 获取合约地址
  const contractAddress = await agentTask.getAddress();

  console.log("\n✅ 合约部署成功！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 合约地址: ${contractAddress}`);
  console.log(`🔗 区链浏览器: https://chainscan-galileo.0g.ai/address/${contractAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 保存合约地址到文件（方便前端使用）
  const fs = require("fs");
  const deployedData = {
    network: "0g-testnet",
    contractAddress: contractAddress,
    chainId: 16602,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    "./deployed-contract.json",
    JSON.stringify(deployedData, null, 2)
  );
  console.log("📝 合约地址已保存到 deployed-contract.json\n");
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
