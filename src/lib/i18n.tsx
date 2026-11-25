import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setFormatLanguage } from "./format";

export type Language = "en" | "zh";
type Translate = (english: string, chinese?: string) => string;

interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: Translate;
  text: (value: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const sampleTranslations: Record<string, string> = {
  "Wet floor": "地面湿滑",
  "Dust and debris": "灰尘与杂物",
  "Overflowing bin": "垃圾桶已满",
  "Spilled drink": "饮料洒漏",
  "Washroom supplies": "洗手间用品",
  Other: "其他",
  Library: "图书馆",
  "Student Centre": "学生活动中心",
  "Innovation Hub": "创新中心",
  "Blue water bottle": "蓝色水瓶",
  "Black umbrella": "黑色雨伞",
  "Grey wireless earbuds": "灰色无线耳机",
  "Green notebook": "绿色笔记本",
  "Water has collected near the entrance after the rain.": "雨后入口处有积水。",
  "Water has collected beside the desks after the rain.": "雨后课桌旁有积水。",
  "Paper scraps and dust are visible beside the classroom entrance.": "教室入口旁可见纸屑和灰尘。",
  "The recycling bin at the back of the classroom is full.": "教室后方的回收垃圾桶已经满了。",
  "A drink has spilled under the desk in the front row.": "前排课桌下有洒出的饮料。",
  "Rainwater collected beside the classroom entrance.": "雨水积在了教室入口旁。",
  "Floor dried and warning sign removed.": "地面已擦干，警示牌已移除。",
  "Entrance dried and the wet-floor sign removed.": "入口已擦干，湿滑警示牌已移除。",
  "Reusable blue metal bottle with a narrow neck and black cap.": "可重复使用的蓝色金属水瓶，窄瓶口，黑色瓶盖。",
  "Compact black folding umbrella with a curved handle.": "黑色折叠雨伞，配有弯柄。",
  "Grey earbuds in a small rounded charging case.": "灰色耳机，装在圆角小型充电盒内。",
  "A5 green notebook with lined pages and an elastic band.": "A5 绿色笔记本，横线内页，配有松紧带。",
  "Small star sticker on the bottom": "底部有一枚小星星贴纸",
  "Red thread tied inside the handle": "手柄内侧系着红线",
  "Initials J L etched inside the case": "盒内刻有姓名首字母 J L",
  "A train ticket is tucked into the back cover": "封底内夹着一张火车票",
  "There is red thread tied inside the handle.": "手柄内侧系着红线。",
  "My initials J L are etched inside the charging case.": "充电盒内刻着我的姓名首字母 J L。",
  "There is a train ticket in the back cover.": "封底内夹着一张火车票。",
  "There is a small star sticker on the bottom.": "底部有一枚小星星贴纸。",
  "Ownership verified. Please bring your student card.": "所有权已核验，请携带学生卡领取。",
  "Ownership verified.": "所有权已核验。",
  "The details provided were insufficient to verify ownership.": "提供的信息不足以核验物品所有权。",
  "Request submitted": "已提交工单",
  "Work started": "已开始处理",
  "Submitted for review": "已提交复核",
  "Approved and closed": "已复核并关单",
  "Returned for rework": "已退回返工",
};

const uiTranslations: Record<string, string> = {
  Back: "返回",
  "Back to overview": "返回首页",
  "Back to my requests": "返回我的工单",
  "Back to search results": "返回搜索结果",
  "Back to my claims": "返回我的认领",
  "Back to work queues": "返回工作队列",
  "Back to my assigned tasks": "返回我的任务",
  "Back to claim review": "返回认领审核",
  "Back to item records": "返回物品记录",
  "Student home": "学生首页",
  "Student · Cleaning": "学生 · 清洁服务",
  "Student · Lost and found": "学生 · 失物招领",
  "Cleaning request": "清洁工单",
  "Cleaning supervisor": "清洁主管",
  "Cleaning Supervisor home": "清洁主管首页",
  "Cleaning supervisor · Request": "清洁主管 · 工单",
  "Cleaning Staff home": "清洁员首页",
  "Cleaning Staff · Assigned task": "清洁员 · 已派任务",
  "Lost-and-Found Administrator home": "失物管理员首页",
  "Lost-and-Found Administrator": "失物管理员",
  "How can we help on campus today?": "今天需要什么校园服务？",
  "Report a cleaning problem or search for something you have lost. Your updates stay in one place.": "上报清洁问题或寻找遗失物品，并在这里随时查看进度。",
  "Report a cleaning issue": "上报清洁问题",
  "Tell us where help is needed and follow the request through to completion.": "告诉我们需要清洁的位置，并跟踪工单直至完成。",
  "Find a lost item": "寻找失物",
  "Search public found-item records and request ownership verification.": "搜索公开的拾获物品记录，并申请核验所有权。",
  "Search found items": "搜索拾获物品",
  "My requests and claims": "我的工单与认领",
  Requests: "工单",
  Claims: "认领",
  "Give the cleaning team enough detail to find and resolve the problem.": "请提供足够信息，帮助清洁团队找到并解决问题。",
  Location: "地点",
  "Issue type": "问题类型",
  Description: "问题描述",
  "Select a location": "请选择地点",
  "Please select a location.": "请选择地点。",
  "Please describe the issue.": "请描述问题。",
  "Submit cleaning request": "提交清洁工单",
  Cancel: "取消",
  "Request submitted": "工单提交成功",
  "Your request is now visible in the supervisor’s Unassigned requests queue.": "该工单已进入主管的待派单队列。",
  "Ticket number": "工单编号",
  "View progress": "查看进度",
  "Switch to Cleaning Supervisor": "切换为清洁主管",
  "Search public details of items handed in around campus. Identifying notes stay private until verification.": "搜索校园内拾获物品的公开信息，识别特征仅在核验时向管理员显示。",
  Keyword: "关键词",
  "All locations": "全部地点",
  Search: "搜索",
  "Found items": "拾获物品",
  "View item": "查看物品",
  "No matching items": "没有匹配的物品",
  "Try a different keyword or location.": "请尝试其他关键词或地点。",
  "Public found-item record": "公开拾获记录",
  Appearance: "外观描述",
  "Claim this item": "申请认领",
  "Additional identifying details are reviewed privately by the Lost-and-Found Administrator.": "其他识别信息仅由失物管理员私密核验。",
  "Public item description": "物品公开描述",
  "Describe a detail that can help us verify ownership.": "请描述一项有助于核验所有权的特征。",
  "Do not include passwords or other sensitive information.": "请勿填写密码或其他敏感信息。",
  "Please describe an identifying detail.": "请描述一项识别特征。",
  "Submit ownership claim": "提交认领申请",
  "Claim submitted": "认领申请已提交",
  "The administrator can now compare your description with the private found-item note.": "管理员现在可以将你的描述与私密拾获备注进行比对。",
  "Claim number": "认领编号",
  "View my claim": "查看我的认领",
  "Switch to Lost-and-Found Administrator": "切换为失物管理员",
  "My ownership claim": "我的认领申请",
  "Current status": "当前状态",
  "Next action by Lost-and-Found Administrator.": "下一步由失物管理员处理。",
  "This item has been returned to you.": "该物品已归还给你。",
  Submitted: "提交时间",
  "Found item": "拾获物品",
  "Your ownership description": "你的所有权描述",
  "Administrator update": "管理员处理结果",
  "Return recorded": "归还记录",
  "Record unavailable": "记录不可用",
  "Nothing to show here": "暂无内容",
  "Return to student home": "返回学生首页",
  "Coordinate cleaning work": "安排清洁工作",
  "Assign new requests, then review completed work before closing each ticket.": "分配新工单，复核处理结果后再关闭工单。",
  "Queue 01": "队列 01",
  "Queue 02": "队列 02",
  "Unassigned requests": "待派单工单",
  "Awaiting review": "待复核工单",
  "No unassigned requests": "暂无待派单工单",
  "New student submissions will appear here.": "学生提交的新工单会显示在这里。",
  "No work awaiting review": "暂无待复核工作",
  "Submitted completion notes will appear here.": "清洁员提交的处理备注会显示在这里。",
  "All cleaning requests": "全部清洁工单",
  "Open any ticket to inspect its current status, next action and complete activity timeline.": "打开任意工单，查看当前状态、下一步处理人和完整时间线。",
  "Request not found": "未找到工单",
  "This request is not in the current demo data.": "当前演示数据中不存在该工单。",
  "Complete your assigned cleaning work": "完成分配给你的清洁任务",
  "Start assigned work, record what you completed, and send it to the supervisor for review.": "开始已派任务，记录处理结果，并提交主管复核。",
  "Review your completed work": "查看已完成的工作",
  "Submitted and closed requests remain available with their full timelines.": "已提交和已关闭的工单及其完整时间线会保留在这里。",
  "Staff member": "清洁员",
  "My assigned tasks": "我的任务",
  "Work history": "工作记录",
  "No assigned tasks": "暂无已派任务",
  "No completed work yet": "暂无已完成工作",
  "Submitted and closed work will appear here.": "已提交和已关闭的工作会显示在这里。",
  "Task not found": "未找到任务",
  "This task is not in the current demo data.": "当前演示数据中不存在该任务。",
  "Verify claims and coordinate returns": "核验认领并安排归还",
  "Compare ownership details privately, make a clear decision, and record each physical handover.": "私密比对所有权信息，作出明确决定，并记录每次实际归还。",
  "Pending verification": "待核验",
  "Claims needing a decision": "等待审核的认领",
  "Awaiting collection": "待领取",
  "Approved and ready to collect": "已批准，等待领取",
  Returned: "已归还",
  "Items returned to owners": "已归还物主的物品",
  "Claims awaiting verification": "待核验认领申请",
  "No pending claims": "暂无待核验认领",
  "New student ownership claims will appear here.": "学生提交的新认领申请会显示在这里。",
  "Ready for collection": "待领取",
  "No approved collections": "暂无待领取记录",
  "Approved claims will move here.": "批准后的认领会移到这里。",
  "Review claim": "审核认领",
  "Open return record": "打开归还记录",
  "Administrator only": "仅管理员可见",
  "Private found-item note": "私密拾获备注",
  "Never copy this identifying note into an applicant-facing reply.": "请勿将识别特征复制到给申请人的回复中。",
  "Public item details": "物品公开信息",
  "Make a verification decision": "作出核验决定",
  "Approve only when the claimant’s detail matches the private record.": "仅当申请人描述与私密记录相符时才批准。",
  "Approve claim": "批准认领",
  "Reject claim": "拒绝认领",
  "Public explanation for the applicant": "给申请人的公开说明",
  "Do not reveal the correct identifying detail in this message.": "请勿在回复中透露正确的识别特征。",
  "Please enter an explanation for the applicant.": "请填写给申请人的说明。",
  "Confirm rejection": "确认拒绝",
  "Applicant-facing decision note": "给申请人的处理说明",
  "Record the physical return": "登记实际归还",
  "Handled by": "经手人",
  "Please enter the handler’s name.": "请填写经手人姓名。",
  "Record return": "登记归还",
  "The return is complete and cannot be recorded again.": "归还已完成，无法重复登记。",
  "Found-item records": "拾获物品记录",
  "Open an item to inspect its public record, private note, claims and return history.": "打开物品，查看公开记录、私密备注、认领和归还历史。",
  "Open item": "打开物品",
  "Public appearance": "公开外观描述",
  "Private found-item note · Administrator only": "私密拾获备注 · 仅管理员可见",
  "Related claims": "相关认领",
  "No claims for this item": "该物品暂无认领",
  "Student ownership claims will appear here.": "学生认领申请会显示在这里。",
  "Record not found": "未找到记录",
};

const statusTranslations: Record<string, string> = {
  Submitted: "已提交",
  Assigned: "已派单",
  "In progress": "处理中",
  "Awaiting review": "待复核",
  Closed: "已关闭",
  "Pending verification": "待核验",
  "Approved – ready for collection": "已批准——待领取",
  Rejected: "已拒绝",
  Returned: "已归还",
  Available: "可认领",
  "Awaiting collection": "待领取",
};

export function translateStatus(status: string, language: Language) {
  return language === "zh" ? (statusTranslations[status] ?? status) : status;
}

export function translateSample(value: string, language: Language) {
  if (language === "en") return value;
  const assigned = value.match(/^Assigned to (.+)$/);
  if (assigned) return `已派单给 ${assigned[1]}`;
  return sampleTranslations[value] ?? value;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = window.localStorage.getItem("campus-language");
    if (saved === "en" || saved === "zh") return saved;
    return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  });

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("campus-language", next);
  }, []);

  setFormatLanguage(language);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = language === "zh" ? "校园服务 · EBIS3013" : "Campus Services · EBIS3013";
  }, [language]);

  const value = useMemo<I18nValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === "en" ? "zh" : "en"),
    t: (english, chinese) => (language === "zh" ? (chinese ?? uiTranslations[english] ?? english) : english),
    text: (entry) => translateSample(entry, language),
  }), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
