// SPDX-License-Identifier: MIT
// 声明使用的 Solidity 版本
pragma solidity ^0.8.19;

/**
 * @title AgentTask
 * @dev 一个简单的去中心化任务平台合约
 * 核心流程：发布任务 -> Agent提交 -> 雇主验收 -> 释放资金
 */
contract AgentTask {

    // ======== 数据结构定义 ========

    /**
     * @dev Task 结构体：定义一个任务的完整信息
     */
    struct Task {
        uint256 id;              // 任务唯一ID
        address employer;        // 雇主地址（发布任务的人）
        address agent;           // Agent地址（接单的人），地址0表示无人接单
        string description;      // 任务描述
        uint256 reward;          // 奖励金额（ETH）
        string submissionUrl;    // Agent提交的工作成果URL
        bool isSubmitted;        // 是否已提交
        bool isApproved;         // 是否已验收通过
        bool isCompleted;        // 任务是否完全完成
    }

    // ======== 状态变量 ========

    uint256 private nextTaskId;           // 下一个任务的ID（从0开始递增）
    mapping(uint256 => Task) public tasks; // 任务ID => 任务信息的映射（通过ID查询任务）

    // 记录某个地址发布的所有任务ID（方便查询）
    mapping(address => uint256[]) public employerTasks;

    // ======== 事件定义 ========
    // 事件用于记录链上操作，方便前端监听和查询历史

    event TaskCreated(
        uint256 indexed taskId,
        address indexed employer,
        uint256 reward,
        string description
    );

    event TaskSubmitted(
        uint256 indexed taskId,
        address indexed agent,
        string submissionUrl
    );

    event TaskApproved(
        uint256 indexed taskId,
        address indexed employer,
        address indexed agent,
        uint256 reward
    );

    // ======== 核心功能函数 ========

    /**
     * @dev 创建任务（发布任务）
     * @param description 任务描述
     * @notice 调用时需要发送ETH作为奖励（通过 msg.value）
     */
    function createTask(string memory description) external payable {
        // 检查：奖励金额必须大于0
        require(msg.value > 0, "Reward must be greater than 0");
        // 检查：描述不能为空
        require(bytes(description).length > 0, "Description cannot be empty");

        // 创建新任务
        Task memory newTask = Task({
            id: nextTaskId,           // 使用当前的 nextTaskId
            employer: msg.sender,     // msg.sender 是调用者的地址
            agent: address(0),        // 初始无Agent
            description: description, // 任务描述
            reward: msg.value,        // 奖励金额（发送的ETH）
            submissionUrl: "",        // 初始无提交内容
            isSubmitted: false,       // 未提交
            isApproved: false,        // 未验收
            isCompleted: false        // 未完成
        });

        // 保存任务到映射中
        tasks[nextTaskId] = newTask;

        // 记录到雇主的任务列表中
        employerTasks[msg.sender].push(nextTaskId);

        // 触发事件（通知前端）
        emit TaskCreated(nextTaskId, msg.sender, msg.value, description);

        // 任务ID递增
        nextTaskId++;
    }

    /**
     * @dev 提交工作（Agent接单并提交成果）
     * @param taskId 任务ID
     * @param submissionUrl 工作成果的URL（模拟0G DA存储链接）
     */
    function submitTask(uint256 taskId, string memory submissionUrl) external {
        // 从存储中读取任务（使用 storage 引用，可以直接修改）
        Task storage task = tasks[taskId];

        // 检查1：任务必须存在（ID不能超过已创建的最大ID）
        require(taskId < nextTaskId, "Task does not exist");
        // 检查2：任务还未被接单（agent地址为0）
        require(task.agent == address(0), "Task already taken");
        // 检查3：提交链接不能为空
        require(bytes(submissionUrl).length > 0, "Submission URL cannot be empty");

        // 设置Agent为当前调用者
        task.agent = msg.sender;
        // 记录提交的URL
        task.submissionUrl = submissionUrl;
        // 标记为已提交
        task.isSubmitted = true;

        // 触发事件
        emit TaskSubmitted(taskId, msg.sender, submissionUrl);
    }

    /**
     * @dev 验收任务并释放资金（只有雇主可以调用）
     * @param taskId 任务ID
     */
    function approveTask(uint256 taskId) external {
        // 从存储中读取任务
        Task storage task = tasks[taskId];

        // 检查1：任务必须存在
        require(taskId < nextTaskId, "Task does not exist");
        // 检查2：只有雇主可以验收
        require(msg.sender == task.employer, "Only employer can approve");
        // 检查3：任务必须已提交
        require(task.isSubmitted, "Task not submitted yet");
        // 检查4：任务还未验收
        require(!task.isApproved, "Task already approved");
        // 检查5：必须有Agent接单
        require(task.agent != address(0), "No agent assigned");

        // 标记为已验收
        task.isApproved = true;
        // 标记为完成
        task.isCompleted = true;

        // 将奖励ETH转账给Agent（使用 transfer 方法）
        payable(task.agent).transfer(task.reward);

        // 触发事件
        emit TaskApproved(taskId, msg.sender, task.agent, task.reward);
    }

    // ======== 查询函数 ========

    /**
     * @dev 获取任务详情
     * @param taskId 任务ID
     * @return 任务的完整信息
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        require(taskId < nextTaskId, "Task does not exist");
        return tasks[taskId];
    }

    /**
     * @dev 获取某个地址发布的所有任务ID
     * @param employer 雇主地址
     * @return 任务ID数组
     */
    function getEmployerTasks(address employer) external view returns (uint256[] memory) {
        return employerTasks[employer];
    }

    /**
     * @dev 获取当前任务总数
     * @return nextTaskId 的值（等于已创建的任务数量）
     */
    function getTotalTasks() external view returns (uint256) {
        return nextTaskId;
    }
}
