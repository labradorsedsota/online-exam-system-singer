# TEST-CASE.md — 在线考试系统 v1.0

## 文档信息

| 字段 | 内容 |
|------|------|
| 项目代号 | OES |
| 任务编号 | OES-T002 |
| 版本 | v1.0 |
| 作者 | Moss (QA) |
| 创建日期 | 2026-04-27 |
| PRD 版本 | v1.0 (2026-04-23, Pichai) |
| 部署地址 | https://labradorsedsota.github.io/online-exam-system/ |
| Repo | https://github.com/labradorsedsota/online-exam-system |
| 执行规范 | mano-cua-execution-spec v1.6 |
| 设计规范 | test-case-design-spec v1.0 |

---

## 测试范围

### 功能覆盖

| 模块 | PRD 章节 | AC 数量 | L1 | L2 | L3 |
|------|---------|---------|----|----|-----|
| F01 题库管理 | §4.1 | 8 | 5 | 2 | 1 |
| F02 组卷 | §4.2 | 8 | 2 | 4 | 1 |
| F03 考试管理 | §4.3 | 3 | 0 | 2 | 1 |
| F04 在线答题 | §4.4 | 9 | 3 | 4 | 2 |
| F05 自动评分 | §4.5 | 6 | 2 | 2 | 0 |
| F06 成绩管理 | §4.6 | 3 | 1 | 0 | 1 |
| F07 数据导入导出 | §4.7 | 3 | 0 | 0 | 2 |
| **合计** | | **40** | **13** | **14** | **8** |

### 额外设计规范用例

| 类型 | 条款 | 用例数 |
|------|------|--------|
| BVA 边界值 | D1 | 4 |
| 状态转换否定路径 | D3 | 2 |
| **小计** | | **6** |

**总计：41 条用例**（PRD 35 + BVA 4 + 否定路径 2）

### 视觉验证

Scholar's Notebook 视觉风格将在各功能测试中附带验证，不单独列用例。验证点：
- 纸质纹理背景（`#FCF9F2` + grain overlay）
- 手绘边框（wobbly border-radius）
- 手写字体（Architects Daughter / Playfair Display）
- 撕纸卡片效果（torn paper edge）
- 手绘 Radio/Checkbox
- 胶带按钮
- Wiggle hover 动效

---

## 测试环境

| 项目 | 值 |
|------|-----|
| 浏览器 | Google Chrome（最新稳定版） |
| 操作系统 | macOS |
| 执行工具 | mano-cua（GUI 自动化） |
| 目标 URL | `https://labradorsedsota.github.io/online-exam-system/` |
| 数据存储 | localStorage（键：`oes_questions`, `oes_papers`, `oes_records`） |

---

## Fixture 文件清单

| 文件 | 路径 | 用途 |
|------|------|------|
| seed-questions.json | `test/fixtures/oes/seed-questions.json` | 8 道种子题目（单选×2、多选×2、填空×2、简答×2） |
| seed-papers.json | `test/fixtures/oes/seed-papers.json` | 3 份试卷（published×1、draft×1、closed×1） |
| seed-records.json | `test/fixtures/oes/seed-records.json` | 5 条考试记录（graded×4、submitted×1，含待评简答） |
| import-valid.json | `test/fixtures/oes/import-valid.json` | 合法导入文件（含 version 字段 + 1 道题） |
| import-invalid.json | `test/fixtures/oes/import-invalid.json` | 非法 JSON 文件（格式错误） |

### Fixture 数据说明

**seed-questions.json 题目 ID 映射：**

| ID | 题型 | 题干（摘要） | 正确答案 |
|----|------|-------------|----------|
| q_single_1 | 单选 | 1+1等于多少？ | B (index 1) |
| q_single_2 | 单选 | HTTP默认端口号是？ | C (index 2) |
| q_multi_1 | 多选 | 以下哪些是编程语言？ | A,C (index 0,2) |
| q_multi_2 | 多选 | 以下哪些是关系型数据库？ | A,C (index 0,2) |
| q_blank_1 | 填空 | JavaScript的缩写是____。 | JS |
| q_blank_2 | 填空 | 世界上最大的搜索引擎是____。 | Google |
| q_essay_1 | 简答 | 请简述HTTP和HTTPS的区别。 | （参考答案） |
| q_essay_2 | 简答 | 请解释什么是响应式设计。 | （参考答案） |

**seed-papers.json 试卷映射：**

| ID | 名称 | 状态 | 时长 | 及格线 | 题数 | 总分 |
|----|------|------|------|--------|------|------|
| p_published_1 | 综合测试卷 | published | 60min | 60 | 8 | 100 |
| p_draft_1 | 草稿试卷 | draft | 90min | 60 | 2 | 25 |
| p_closed_1 | 已关闭试卷 | closed | 45min | 50 | 2 | 20 |

**seed-records.json 成绩映射：**

| ID | 考生 | 总分/满分 | 状态 | 及格 |
|----|------|----------|------|------|
| r_1 | 张三 | 92/100 | graded | 是 |
| r_2 | 李四 | 28/100 | graded | 否 |
| r_3 | 王五 | 63/100 | graded | 是 |
| r_4 | 赵六 | 97/100 | graded | 是 |
| r_5 | 孙七 | 20/100 | submitted（待评） | — |

---

## Pre-flight 模板

以下定义可复用的 Pre-flight 流程，各用例通过模板 ID 引用。

### PF-EMPTY — 清空数据

```bash
# 1. 打开目标页面
open -a "Google Chrome" "https://labradorsedsota.github.io/online-exam-system/"
sleep 3

# 2. 窗口最大化
osascript -e '
tell application "Finder"
    set _b to bounds of window of desktop
    tell application "Google Chrome"
        set bounds of front window to {0, 0, item 3 of _b, item 4 of _b}
    end tell
end tell'

# 3. 清空 localStorage
osascript -e '
tell application "Google Chrome"
    tell active tab of front window
        execute javascript "localStorage.clear(); location.reload();"
    end tell
end tell'
sleep 2
```

### PF-SEED-Q — 注入种子题目

PF-EMPTY 步骤 1-2，然后：
```bash
# 注入题库数据
osascript -e '
tell application "Google Chrome"
    tell active tab of front window
        execute javascript "
            localStorage.clear();
            localStorage.setItem(\"oes_questions\", JSON.stringify(<seed-questions.json 内容>));
            localStorage.setItem(\"oes_papers\", JSON.stringify([]));
            localStorage.setItem(\"oes_records\", JSON.stringify([]));
            location.reload();
        "
    end tell
end tell'
sleep 2
```

### PF-SEED-QP — 注入题目 + 已发布试卷

同上，额外注入 `oes_papers`（仅 published 那一份）。

### PF-SEED-FULL — 注入完整种子数据

注入全部 seed-questions + seed-papers + seed-records。

### PF-COUNTDOWN-WARN — 注入即将到达5分钟警告的考试

动态生成：paper.duration=6(min)，record.startTime = Date.now() - 50000（已过50秒，剩310秒，10秒后触发5分钟警告）。

### PF-COUNTDOWN-AUTO — 注入即将到时的考试

动态生成：paper.duration=1(min)，record.startTime = Date.now() - 50000（已过50秒，剩10秒，10秒后自动提交）。

### PF-FUTURE-PAPER — 注入未来时间窗口试卷

注入 published 试卷，startTime = "2099-01-01T00:00"。

---

## 冲突扫描（条款 D2.4）

| 写操作用例 | 影响的数据 | 受影响的读操作用例 | 处理方式 |
|-----------|-----------|------------------|---------|
| L1.01-L1.04（创建题目） | oes_questions | L2.01（题型筛选）需特定题库 | L2.01 使用 SEED 重置 |
| L1.06+L1.07（创建试卷） | oes_papers | L2.06（状态流转）需特定试卷 | L2.06 使用 CUSTOM 重置 |
| L1.10（提交试卷） | oes_records | L1.13（成绩列表）需多条记录 | L1.13 使用 SEED-FULL 重置 |
| L2.02（删除题目） | oes_questions | 后续题库依赖用例 | L2.02 之后重置 |

所有用例均独立执行，每条用例 Pre-flight 均包含 localStorage 重置，无跨用例数据污染风险。

---

## L1 — 核心路径（13 条）

### L1.01 创建单选题

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.01-001` |
| 关联 AC | AC-F01-01 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略一（创建操作本身是被测功能） |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create`

**任务描述：**
在当前页面（创建题目页），执行以下操作：选择题型"单选题"，在题干输入"1+1=?"，在选项A输入"1"、选项B输入"2"、选项C输入"3"、选项D输入"4"，点击选项B设置为正确答案，点击"保存题目"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 题目保存成功，页面跳转到题库列表页
2. 题库列表中出现刚创建的题目，题干显示"1+1=?"
3. 该题目的题型标签显示"单选"
4. 出现"题目创建成功"提示消息

---

### L1.02 创建多选题

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.02-001` |
| 关联 AC | AC-F01-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略一 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create`

**任务描述：**
在当前页面（创建题目页），执行以下操作：选择题型"多选题"，在题干输入"以下哪些是水果？"，在选项A输入"苹果"、选项B输入"桌子"、选项C输入"香蕉"、选项D输入"椅子"，点击选项A和选项C设置为正确答案（至少选2个），点击"保存题目"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 题目保存成功，页面跳转到题库列表页
2. 题库列表中出现刚创建的题目，题干显示"以下哪些是水果？"
3. 该题目的题型标签显示"多选"
4. 正确答案记录为 A 和 C 两项

---

### L1.03 创建填空题

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.03-001` |
| 关联 AC | AC-F01-03 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略一 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create`

**任务描述：**
在当前页面（创建题目页），执行以下操作：选择题型"填空题"，在题干输入"中国的首都是____。"，在参考答案输入"北京"，点击"保存题目"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 题目保存成功，页面跳转到题库列表页
2. 题库列表中出现刚创建的题目，题干显示"中国的首都是____。"
3. 该题目的题型标签显示"填空"
4. 参考答案"北京"用于自动评分精确匹配（忽略首尾空格）

---

### L1.04 创建简答题

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.04-001` |
| 关联 AC | AC-F01-04 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略一 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create`

**任务描述：**
在当前页面（创建题目页），执行以下操作：选择题型"简答题"，在题干输入"请描述你对人工智能的看法。"，参考答案留空不填，点击"保存题目"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 题目保存成功，页面跳转到题库列表页
2. 题库列表中出现刚创建的题目，题干显示"请描述你对人工智能的看法。"
3. 该题目的题型标签显示"简答"
4. 该题目标记为需人工评分

---

### L1.05 表单校验

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.05-001` |
| 关联 AC | AC-F01-05 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略一 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create`

**任务描述：**
在当前页面（创建题目页），执行以下校验操作：(1) 不选择任何题型，不填写题干，直接点击"保存题目"按钮，观察错误提示；(2) 选择题型"单选题"，填写题干"测试题"，但不设置正确答案，点击"保存题目"按钮，观察错误提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 第一次点击保存时，页面显示"请选择题型"错误提示
2. 第一次点击保存时，页面显示"题干不能为空"错误提示
3. 表单不允许保存，页面停留在创建题目页
4. 第二次操作后，页面显示"请设置正确答案"错误提示
5. 表单仍不允许保存

---

### L1.06 创建试卷基本信息 + L1.07 从题库选题

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.06-001` |
| 关联 AC | AC-F02-01, AC-F02-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要种子题库 |
| 冲突标记 | 无 |
| 前置策略 | 策略二（题库注入）+ 策略一（试卷创建是被测功能） |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/papers/create`

**任务描述：**
在当前页面（创建试卷页），执行以下操作：在试卷名称输入"期中考试"，考试时长输入90，及格分数线输入60。然后在"从题库选题"区域，勾选列表中前5道题目添加到试卷。确认已选题目列表显示5道题和总分，然后点击"保存试卷"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 基本信息填写成功：试卷名称"期中考试"、时长90分钟、及格分60分
2. 勾选5道题目后，已选列表显示5道题
3. 各题默认分值显示为题目的分值建议（若为0则默认10分）
4. 页面显示总分（各题分值之和）
5. 点击保存后，试卷创建成功，跳转到试卷列表页
6. 试卷列表出现"期中考试"，状态为"草稿"

---

### L1.08 考生进入考试

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.08-001` |
| 关联 AC | AC-F04-01 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要种子题库 + 已发布试卷 |
| 冲突标记 | 无 |
| 前置策略 | 策略二（数据注入）+ 策略一（考试入口是被测功能） |
| fixture | seed-questions.json, seed-papers.json（仅 p_published_1） |

**Pre-flight：** PF-SEED-QP → 导航至 `/#/student/exams`

**任务描述：**
在当前页面（考试列表页，考生视角），找到"综合测试卷"，点击"开始考试"按钮。在弹出的姓名输入对话框中，输入姓名"测试考生"，点击"开始考试"确认按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 考试列表中显示"综合测试卷"，状态标签为"可参加"
2. 点击"开始考试"后弹出姓名输入对话框
3. 输入姓名"测试考生"后点击确认，页面跳转到答题页
4. 答题页显示试卷名称"综合测试卷"
5. 倒计时开始（显示剩余时间）
6. 面包屑导航显示：考试列表 > 综合测试卷 > 答题

---

### L1.09 单选题答题交互

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.09-001` |
| 关联 AC | AC-F04-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要进行中的考试 |
| 冲突标记 | 无 |
| 前置策略 | 策略二（注入数据 + 创建进行中记录）+ 策略一（答题是被测功能） |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 通过 JS 创建 record 并导航至答题页：
```javascript
// 动态 Pre-flight：创建考试记录并跳转
const record = {
  id: 'r_test_1', paperId: 'p_published_1', studentName: '测试考生',
  answers: {}, flagged: {}, status: 'in-progress',
  startTime: Date.now(), submitTime: null, scores: {}, totalScore: 0, createdAt: Date.now()
};
const records = JSON.parse(localStorage.getItem('oes_records') || '[]');
records.push(record);
localStorage.setItem('oes_records', JSON.stringify(records));
location.hash = '#/student/exam/p_published_1?record=r_test_1';
```

**任务描述：**
在当前页面（答题页），第1题是单选题"1+1等于多少？"，有4个选项A/B/C/D。点击选择选项B（"2"），观察选项B的选中状态和导航面板中第1题的状态变化。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 答题页显示第1题为单选题，题干"1+1等于多少？"
2. 显示4个选项：A.1 / B.2 / C.3 / D.4
3. 点击选项B后，选项B被选中（手绘圆圈标记出现）
4. 题目导航面板中第1题从灰色（未答）变为绿色（已答）

---

### L1.10 手动提交试卷

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.10-001` |
| 关联 AC | AC-F04-07 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要进行中的考试（已答题） |
| 冲突标记 | ⚠ 提交后创建 record，影响成绩相关用例 |
| 前置策略 | 策略二（注入已答题的记录）+ 策略一（提交是被测功能） |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 通过 JS 创建已全部作答的 record 并导航至答题页：
```javascript
const record = {
  id: 'r_test_submit', paperId: 'p_published_1', studentName: '提交测试',
  answers: {
    q_single_1: 1, q_single_2: 2, q_multi_1: [0,2], q_multi_2: [0,2],
    q_blank_1: 'JS', q_blank_2: 'Google', q_essay_1: '测试答案', q_essay_2: '测试答案2'
  },
  flagged: {}, status: 'in-progress',
  startTime: Date.now(), submitTime: null, scores: {}, totalScore: 0, createdAt: Date.now()
};
const records = JSON.parse(localStorage.getItem('oes_records') || '[]');
records.push(record);
localStorage.setItem('oes_records', JSON.stringify(records));
location.hash = '#/student/exam/p_published_1?record=r_test_submit';
```

**任务描述：**
在当前页面（答题页），所有8道题已作答完毕。点击页面底部的"提交试卷"按钮，在弹出的确认对话框中观察已答/未答统计，然后点击"确认提交"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 点击"提交试卷"后弹出确认对话框（Dialog）
2. 对话框显示"已答：8 / 8 题"
3. 点击"确认提交"后，页面跳转到考试结果页
4. 出现"试卷提交成功"提示消息

---

### L1.11 单选自动评分

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.11-001` |
| 关联 AC | AC-F05-01 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要已提交的考试记录 |
| 冲突标记 | 无 |
| 前置策略 | 策略二（注入已评分记录） |
| fixture | seed-questions.json, seed-papers.json, seed-records.json（r_1） |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/student/result/r_1`

**任务描述：**
在当前页面（考试结果页），查看答题回顾部分，找到第1题（单选题"1+1等于多少？"），确认该题的得分显示和正确/错误标记。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 结果页显示试卷名称"综合测试卷"和考生姓名"张三"
2. 第1题（单选题，10分）显示得分"10 / 10 分"
3. 选项B标记为正确答案（✓标记）
4. 考生选择B，与正确答案匹配，显示正确标记

---

### L1.12 多选自动评分（全对得分）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.12-001` |
| 关联 AC | AC-F05-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 同 L1.11 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | 同 L1.11 |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/student/result/r_1`

**任务描述：**
在当前页面（考试结果页），查看答题回顾部分，找到第3题（多选题"以下哪些是编程语言？"），确认该题的得分显示。正确答案是A(Python)和C(Java)，考生张三选择了A和C。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 第3题（多选题，15分）显示得分"15 / 15 分"
2. 选项A(Python)和C(Java)标记为正确答案（✓标记）
3. 考生选择了A和C，全部正确，获得满分15分

---

### L1.13 成绩列表展示

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L1.13-001` |
| 关联 AC | AC-F06-01 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | SEED — 需要完整种子数据 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json, seed-records.json |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/scores`

**任务描述：**
在当前页面（成绩管理页，出题人视角），查看成绩列表。列表中应有5条考试记录（张三/李四/王五/赵六/孙七），确认每条记录显示考试名称、考生姓名、总分/满分、及格状态。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 成绩列表显示5条记录（排除 in-progress 状态后实际显示5条）
2. 每条记录包含列：考试名称"综合测试卷"、考生姓名、总分/满分、及格状态
3. 张三 92/100 显示"及格"标签
4. 李四 28/100 显示"不及格"标签
5. 孙七显示评分状态为"部分待评"

---

## L2 — 重要功能（14 条）

### L2.01 题型筛选

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.01-001` |
| 关联 AC | AC-F01-06 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | SEED — 需要包含多种题型的题库 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/questions`

**任务描述：**
在当前页面（题库管理页），点击题型筛选Tab"多选"，观察列表变化。然后再点击"全部"Tab恢复。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 默认"全部"Tab显示全部8道题目
2. 点击"多选"Tab后，列表只显示多选题（2道）
3. 其他题型的题目被隐藏
4. 点击"全部"Tab后恢复显示全部8道题目

---

### L2.02 删除题目

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.02-001` |
| 关联 AC | AC-F01-07 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | SEED |
| 冲突标记 | ⚠ 写操作，删除后题目消失 |
| 前置策略 | 策略二 + 策略一 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/questions`

**任务描述：**
在当前页面（题库管理页），找到任意一道题目（如第一道"1+1等于多少？"），点击该行的"删除"按钮。在弹出的确认框中观察提示文字，然后点击"确认删除"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 点击删除按钮后，弹出 Popconfirm 确认框
2. 确认框显示"确认删除「1+1等于多少？」？"
3. 点击"确认删除"后，该题目从列表中消失
4. 出现"删除成功"提示消息

---

### L2.03 调整题目顺序

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.03-001` |
| 关联 AC | AC-F02-03 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要题库 |
| 冲突标记 | 无 |
| 前置策略 | 策略二（注入题库）+ 策略一（组卷操作是被测功能） |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/papers/create` → mano-cua 先勾选3道题目

**任务描述：**
在当前页面（创建试卷页），先在试卷名称输入"排序测试"，时长输入60，及格分输入60。然后在题库中勾选前3道题目添加到试卷。在已选题目列表中，找到第2题，点击其"上移"按钮（↑），观察题目顺序变化。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 已选列表显示3道题，按添加顺序排列
2. 点击第2题的"↑上移"按钮后，第2题移到第1位
3. 原来的第1题变为第2位
4. 题目序号重新编号

---

### L2.04 设置题目分值

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.04-001` |
| 关联 AC | AC-F02-04 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 + 策略一 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/papers/create`

**任务描述：**
在当前页面（创建试卷页），填写试卷名称"分值测试"，时长60，及格分60。在题库中勾选前2道题。在已选题目列表中，找到第1题的分值输入框（当前为10），清空并输入15，观察总分变化。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 已选列表中第1题的分值输入框可编辑
2. 将分值从10修改为15后，该题分值显示为15
3. 试卷总分自动重新计算并更新显示

---

### L2.05 试卷总分自动计算

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.05-001` |
| 关联 AC | AC-F02-05 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 + 策略一 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/papers/create`

**任务描述：**
在当前页面（创建试卷页），填写试卷名称"总分测试"，时长60，及格分60。在题库中勾选3道题，观察已选列表中显示的总分。然后修改第1题分值为20，再观察总分是否更新。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 勾选3道题后，已选列表显示"总分：XX 分"（各题默认分值之和）
2. 修改第1题分值为20后，总分自动更新
3. 新总分 = 20 + 第2题分值 + 第3题分值

---

### L2.06 试卷状态流转

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.06-001` |
| 关联 AC | AC-F02-07 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要草稿状态试卷 |
| 冲突标记 | ⚠ 写操作，修改试卷状态 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-FULL（使用包含 draft 试卷的 seed-papers）→ 导航至 `/#/admin/papers`

**任务描述：**
在当前页面（试卷管理页），找到状态为"草稿"的试卷"草稿试卷"，点击"发布"按钮，观察状态变化。然后确认编辑按钮是否被禁用。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 初始状态：试卷"草稿试卷"状态标签为"草稿"，有编辑按钮和发布按钮
2. 点击"发布"后，状态标签变为"已发布"
3. 编辑按钮消失（已发布状态不可编辑）
4. 出现"关闭"按钮

---

### L2.07 考试时间窗口

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.07-001` |
| 关联 AC | AC-F03-01 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要设置了时间窗口的已发布试卷 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 注入自定义 published 试卷（startTime = 当前时间 -1h, endTime = 当前时间 +1h）→ 导航至 `/#/student/exams`

**任务描述：**
在当前页面（考试列表页，考生视角），查看"时间窗口测试"试卷的状态。该试卷设置了时间窗口（当前时间在窗口内），应显示"可参加"状态。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 试卷"时间窗口测试"在考试列表中可见
2. 状态标签显示"可参加"
3. "开始考试"按钮可点击

---

### L2.08 时间窗口外拒绝进入

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.08-001` |
| 关联 AC | AC-F03-03 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要未来时间窗口的试卷 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json |

**Pre-flight：** PF-FUTURE-PAPER → 导航至 `/#/student/exams`

**任务描述：**
在当前页面（考试列表页，考生视角），查看"未来考试"试卷的状态。该试卷的开始时间设置在2099年，当前时间尚未到达开始时间。观察试卷状态和是否可以点击开始考试。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 试卷在考试列表中可见
2. 状态标签显示"未开始"
3. 无法点击"开始考试"（按钮不显示或禁用）
4. 显示原因"开始时间：2099-01-01 00:00"

---

### L2.09 多选题答题交互

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.09-001` |
| 关联 AC | AC-F04-03 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二（注入数据 + 创建记录） |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 创建 in-progress record → 导航至答题页第3题（多选题）

**任务描述：**
在当前页面（答题页），导航到第3题（多选题"以下哪些是编程语言？"），勾选选项A(Python)和选项C(Java)，观察选中状态。然后取消勾选选项A，观察变化。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 第3题显示为多选题，4个选项
2. 勾选A后，A显示选中状态（手绘打叉标记）
3. 勾选C后，C显示选中状态
4. 取消勾选A后，A恢复为未选中状态，仅C保持选中

---

### L2.10 题目导航（已答/未答/标记）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.10-001` |
| 关联 AC | AC-F04-04 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 创建 in-progress record（已答前2题，标记第3题）→ 导航至答题页

**任务描述：**
在当前页面（答题页），查看左侧题目导航面板。试卷共8道题，已答2道、标记1道、未答5道。观察导航按钮的颜色状态，然后点击导航面板中第5题的按钮，确认跳转到第5题。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 导航面板显示8个题号按钮
2. 已答的题号（第1、2题）显示绿色
3. 标记的题号（第3题）显示黄色
4. 未答的题号（第4-8题）显示灰色
5. 点击第5题按钮后，主区域跳转到第5题

---

### L2.11 倒计时5分钟警告

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.11-001` |
| 关联 AC | AC-F04-06 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要即将触发警告的考试 |
| 冲突标记 | 无 |
| 前置策略 | 策略二（动态注入即将到时的记录） |
| fixture | seed-questions.json |

**Pre-flight：** PF-COUNTDOWN-WARN（动态：paper.duration=6min, record.startTime=Date.now()-50000）→ 导航至答题页

**任务描述：**
在当前页面（答题页），考试剩余时间约5分10秒。等待约10秒，观察当倒计时到达5分钟时页面顶部是否出现警告。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 初始显示倒计时约 05:10
2. 倒计时到达 05:00 时，页面顶部出现 Alert 警告
3. 警告文字为"距离考试结束还有 5 分钟！"
4. 倒计时数字变为红色/警告色

---

### L2.12 自动提交

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.12-001` |
| 关联 AC | AC-F04-08 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要即将到时的考试 |
| 冲突标记 | ⚠ 写操作（自动提交创建记录） |
| 前置策略 | 策略二（动态注入即将到时的记录） |
| fixture | seed-questions.json |

**Pre-flight：** PF-COUNTDOWN-AUTO（动态：paper.duration=1min, record.startTime=Date.now()-50000）→ 导航至答题页

**任务描述：**
在当前页面（答题页），考试剩余时间约10秒。等待倒计时到0，观察系统是否自动提交试卷并跳转到结果页。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 倒计时显示约 00:10 并持续递减
2. 倒计时到 00:00 时自动提交（不弹确认框）
3. 页面自动跳转到考试结果页
4. 出现"考试时间已到，已自动提交"提示消息

---

### L2.13 填空评分忽略大小写

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.13-001` |
| 关联 AC | AC-F05-04 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要填空题答案大小写不同的记录 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json, seed-records.json（r_3） |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/student/result/r_3`

**任务描述：**
在当前页面（考试结果页，考生王五），查看第5题（填空题"JavaScript的缩写是____"）的评分。正确答案为"JS"，王五输入的是" js "（小写带空格），确认是否得分。再查看第6题（填空题"世界上最大的搜索引擎是____"），正确答案"Google"，王五输入"google"（小写），确认是否得分。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 第5题：正确答案"JS"，考生答案" js "（含首尾空格），得满分 10/10
2. 系统评分忽略了大小写差异（JS vs js）
3. 系统评分忽略了首尾空格
4. 第6题：正确答案"Google"，考生答案"google"，得满分 10/10

---

### L2.14 简答题手动评分

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L2.14-001` |
| 关联 AC | AC-F05-05 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要含待评简答题的记录 |
| 冲突标记 | ⚠ 写操作（评分后修改记录） |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json, seed-records.json（r_5 — submitted 状态） |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/scores/p_published_1/r_5`

**任务描述：**
在当前页面（批改详情页，考生孙七），找到简答题（第7题"请简述HTTP和HTTPS的区别"），该题显示"待评分"。在评分输入框中输入分值8，点击"保存评分"按钮。观察总分是否更新。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 简答题显示考生答案和参考答案
2. 评分输入框可输入（范围 0 到该题满分 15）
3. 输入8后点击"保存评分"，出现"评分已保存"提示
4. 该题显示得分"8 / 15 分"
5. 总分更新（原 20 + 8 = 28）

---

## L3 — 增强体验（8 条）

### L3.01 空状态展示

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.01-001` |
| 关联 AC | AC-F01-08 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions`

**任务描述：**
在当前页面（题库管理页），题库为空。观察页面是否显示空状态提示和创建引导。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 页面不显示表格
2. 显示空状态组件（Empty）
3. 文案包含"暂无题目，点击创建第一道题"
4. 显示"创建题目"按钮

---

### L3.02 试卷校验（未选题目）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.02-001` |
| 关联 AC | AC-F02-06 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 + 策略一 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/papers/create`

**任务描述：**
在当前页面（创建试卷页），填写试卷名称"校验测试"、时长60、及格分60，但不勾选任何题目，直接点击"保存试卷"按钮。观察错误提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 点击保存后页面不跳转
2. 显示提示"请至少选择一道题目"
3. 试卷未被保存

---

### L3.03 Switch 开关控制

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.03-001` |
| 关联 AC | AC-F03-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要已发布试卷 |
| 冲突标记 | ⚠ 写操作（关闭 Switch） |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/papers`

**任务描述：**
在当前页面（试卷管理页），找到"已发布"的试卷"综合测试卷"，其 Switch 开关应为"开启"状态。点击 Switch 关闭它，观察提示。然后切换到考生视角查看该试卷状态。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 初始状态：Switch 为"开启"
2. 点击 Switch 后变为"关闭"状态
3. 出现"考试已暂停"提示

---

### L3.04 自动保存

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.04-001` |
| 关联 AC | AC-F04-05 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 创建 in-progress record → 导航至答题页

**任务描述：**
在当前页面（答题页），选择第1题的选项B作答，然后等待3-4秒，观察页面底部是否出现"已自动保存"提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 选择选项B后，答案被记录
2. 等待约3秒后（防抖），页面底部出现"已自动保存"提示
3. 答案保存到 localStorage

---

### L3.05 未答题提醒

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.05-001` |
| 关联 AC | AC-F04-09 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | CUSTOM — 需要部分作答的考试 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 创建 in-progress record（仅答前3题）→ 导航至答题页

**任务描述：**
在当前页面（答题页），8道题中仅前3道已作答，剩余5道未答。点击"提交试卷"按钮，观察确认对话框中的未答题提醒。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 点击"提交试卷"后弹出确认对话框
2. 对话框显示"已答：3 / 8 题"
3. 对话框显示"您还有 5 题未作答，确认提交？"

---

### L3.06 统计数据看板

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.06-001` |
| 关联 AC | AC-F06-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | SEED — 需要多条成绩记录 |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json, seed-records.json |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/scores`

**任务描述：**
在当前页面（成绩管理页），在"全部考试"下拉框中选择"综合测试卷"。观察统计看板显示的数据：平均分、最高分、最低分、通过率、成绩分布。种子数据：张三92、李四28、王五63、赵六97、孙七20，及格线60。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 选择"综合测试卷"后显示统计看板
2. 平均分显示 60（(92+28+63+97+20)/5=60）
3. 最高分显示 97
4. 最低分显示 20
5. 通过率显示 60%（及格线60，张三92+王五63+赵六97=3人通过，3/5=60%）
6. 成绩分布：0-59 段 2 人、60-79 段 1 人、80-100 段 2 人

---

### L3.07 导出数据

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.07-001` |
| 关联 AC | AC-F07-01 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | SEED |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/questions`

**任务描述：**
在当前页面，找到顶部导航栏右侧的"导出"按钮（📤 导出），点击该按钮。观察浏览器是否开始下载文件。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 点击"导出"按钮后浏览器开始下载文件
2. 下载文件名格式为 `oes-data-{日期}.json`（如 oes-data-2026-04-27.json）
3. 出现"数据导出成功"提示

---

### L3.08 导入数据

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-L3.08-001` |
| 关联 AC | AC-F07-02 |
| 设计技术 | PRD 追溯 |
| 数据依赖 | EMPTY |
| 冲突标记 | ⚠ 写操作（导入覆盖数据） |
| 前置策略 | 策略一（导入操作是被测功能） |
| fixture | import-valid.json |

**Pre-flight：** PF-EMPTY → 确保 fixture 文件 `import-valid.json` 已放置到可访问路径

**任务描述：**
在当前页面，找到顶部导航栏右侧的"导入"按钮（📥 导入），点击该按钮，选择文件 import-valid.json。在弹出的导入模式对话框中选择"覆盖现有数据"，点击"确认导入"。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 点击"导入"按钮后出现文件选择器
2. 选择文件后弹出导入模式对话框
3. 显示两个选项："覆盖现有数据"和"合并数据"
4. 选择"覆盖"后点击确认，出现"导入完成，共 1 道题目，0 场考试"提示
5. 页面刷新后题库中出现导入的题目

---

## BVA 边界值用例（条款 D1）

### BVA.01 题干最大长度（500字）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-BVA.01-001` |
| 关联 AC | AC-F01-05（校验扩展） |
| 设计技术 | BVA — 文本字段上界 |
| 目标边界 | 题干 = 501 字（有效最大值为 500） |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略二（通过 JS 注入超长文本）+ 策略一 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create` → 通过 JS 在题干 textarea 注入 501 个"测"字

**任务描述：**
在当前页面（创建题目页），题型已选"单选题"，题干已预填超长文本（501字）。在选项A输入"A"、选项B输入"B"，选B为正确答案，点击"保存题目"按钮。观察是否有字数超限错误提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 字数计数器显示"501/500"
2. 点击保存后出现错误提示"题干不能超过 500 字"
3. 表单不允许保存

---

### BVA.02 考试时长边界（1分钟/480分钟）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-BVA.02-001` |
| 关联 AC | AC-F02-01（校验扩展） |
| 设计技术 | BVA — 数值字段上下界 |
| 目标边界 | duration = 0（低于最小值 1）和 duration = 481（高于最大值 480） |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 + 策略一 |
| fixture | seed-questions.json |

**Pre-flight：** PF-SEED-Q → 导航至 `/#/admin/papers/create`

**任务描述：**
在当前页面（创建试卷页），填写试卷名称"边界测试"，及格分60，勾选1道题。(1) 将考试时长输入0，点击保存，观察错误提示。(2) 将考试时长修改为481，点击保存，观察错误提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 时长为0时，点击保存，显示"考试时长范围为 1-480 分钟"错误提示
2. 表单不允许保存
3. 时长为481时，点击保存，同样显示"考试时长范围为 1-480 分钟"错误提示
4. 表单不允许保存

---

### BVA.03 选项数量下界（单选题少于2个选项）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-BVA.03-001` |
| 关联 AC | AC-F01-05（校验扩展） |
| 设计技术 | BVA — 数量字段下界 |
| 目标边界 | 选项数 = 1（有效最小值为 2） |
| 数据依赖 | EMPTY |
| 冲突标记 | 无 |
| 前置策略 | 策略一 |
| fixture | 无 |

**Pre-flight：** PF-EMPTY → 导航至 `/#/admin/questions/create`

**任务描述：**
在当前页面（创建题目页），选择题型"单选题"，填写题干"单选项测试"。默认有2个选项输入框，删除其中一个（如果有删除按钮的话），使选项少于2个，然后点击"保存题目"。如果无法删除到少于2个，则将两个选项都留空，点击保存，观察错误提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 当选项少于2个时（或选项为空），显示"至少添加 2 个选项"错误提示
2. 表单不允许保存

---

### BVA.04 考生姓名为空

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-BVA.04-001` |
| 关联 AC | AC-F04-01（校验扩展） |
| 设计技术 | BVA — 文本字段下界（空字符串） |
| 目标边界 | studentName = ""（必填字段） |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-QP → 导航至 `/#/student/exams`

**任务描述：**
在当前页面（考试列表页），点击"综合测试卷"的"开始考试"按钮。在弹出的姓名输入框中不输入任何内容（留空），直接点击"开始考试"确认按钮。观察错误提示。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. 姓名为空时点击确认，显示"姓名不能为空"错误提示
2. 不会进入答题页

---

## 状态转换否定路径（条款 D3）

### 试卷状态转换矩阵

| 当前状态 ↓ \ 目标状态 → | 草稿 | 已发布 | 已关闭 |
|--------------------------|------|--------|--------|
| 草稿 | - | ✅ 发布 | ✗ |
| 已发布 | ✗ | - | ✅ 关闭 |
| 已关闭 | ✗ | ✅ 重新发布 | - |

### NEG.01 已发布状态不可编辑（回退测试）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-NEG.01-001` |
| 关联 AC | AC-F02-07（否定路径） |
| 设计技术 | 状态转换否定路径 — 回退测试 |
| 测试目标 | 验证"已发布"状态试卷无法编辑（不可回退到草稿的可编辑状态） |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/papers`

**任务描述：**
在当前页面（试卷管理页），找到"已发布"状态的试卷"综合测试卷"。观察其操作列中是否有"编辑"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. "综合测试卷"状态标签为"已发布"
2. 操作列不显示"编辑"按钮（仅草稿状态可编辑）
3. 操作列显示"关闭"按钮和"删除"按钮

---

### NEG.02 已关闭试卷不可直接跳到草稿（跳跃测试）

| 项 | 值 |
|---|---|
| mosstid | `oes-exam-v1.0-NEG.02-001` |
| 关联 AC | AC-F02-08（否定路径） |
| 设计技术 | 状态转换否定路径 — 跳跃测试 |
| 测试目标 | 验证"已关闭"状态试卷只能"重新发布"，不能回到"草稿"进行编辑 |
| 数据依赖 | CUSTOM |
| 冲突标记 | 无 |
| 前置策略 | 策略二 |
| fixture | seed-questions.json, seed-papers.json |

**Pre-flight：** PF-SEED-FULL → 导航至 `/#/admin/papers`

**任务描述：**
在当前页面（试卷管理页），找到"已关闭"状态的试卷"已关闭试卷"。观察其操作列中有哪些按钮，确认没有"编辑"按钮（即不能回到草稿编辑状态），只有"发布"（重新发布）和"删除"按钮。仅在当前页面操作，不要导航到其他网址。

**Expected Results（逐条）：**
1. "已关闭试卷"状态标签为"已关闭"
2. 操作列不显示"编辑"按钮
3. 操作列显示"发布"按钮（重新发布功能）
4. 操作列显示"删除"按钮

---

## 文档合规 Checklist

- [x] 文档信息（项目代号、版本、作者、日期、PRD引用）
- [x] 测试范围（功能覆盖表 + 额外用例 + 视觉验证说明）
- [x] 测试用例 — L1 核心路径（13 条）
- [x] 测试用例 — L2 重要功能（14 条）
- [x] 测试用例 — L3 增强体验（8 条）
- [x] BVA 边界值用例（4 条，条款 D1）
- [x] 状态转换否定路径（2 条，条款 D3）
- [x] Fixture 文件清单（5 个文件 + 数据映射表）
- [x] Pre-flight 模板（7 个可复用模板）
- [x] 冲突扫描（条款 D2.4）
- [x] 测试环境

---

*文档结束。待 PM 审核确认后执行测试。*
