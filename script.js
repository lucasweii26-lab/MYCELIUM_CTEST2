const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".send-chat-btn");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");
const chatbotPanel = document.querySelector(".chatbot");
let userMessage = "";
const inputInitHeight = chatInput ? chatInput.scrollHeight : 54;
let isChatHandling = false; // 提交互斥锁

const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  if (className === "incoming") {
    const avatar = document.createElement("span");
    avatar.className = "bot-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "AI";
    chatLi.appendChild(avatar);
  }
  const messageParagraph = document.createElement("p");
  messageParagraph.textContent = message;
  chatLi.appendChild(messageParagraph);
  return chatLi;
};

// 预置问答规则匹配
const generateResponse = (incomingChatLi) => {
  const messageElement = incomingChatLi.querySelector("p");
  const msg = userMessage.toLowerCase();
  let response;
  let isError = false;

  const rules = [
    { keywords: ["announcement", "announcements", "news", "notice", "update", "emergency", "maintenance"], replyKey: "announcement" },
    { keywords: ["hello", "hi", "hey", "greeting", "good morning", "good afternoon"], replyKey: "greeting" },
    { keywords: ["event", "activity", "calendar", "upcoming", "july", "tree planting", "cleanup", "fun run"], replyKey: "events" },
    { keywords: ["volunteer", "register", "join", "sign up", "volunteer team", "help"], replyKey: "volunteer" },
    { keywords: ["facility", "facilities", "map", "gym", "pool", "playground", "park", "tennis", "basketball", "where is"], replyKey: "facilities" },
    { keywords: ["faq", "question", "answer", "how to", "rule", "membership", "report", "issue"], replyKey: "faq" },
    { keywords: ["service", "directory", "plumber", "electrician", "cleaner", "repair", "air cond", "carpenter"], replyKey: "services" },
    { keywords: ["thank", "thanks", "thank you"], replyKey: "thank" },
    { keywords: ["contact", "staff", "management", "office"], replyKey: "contact" }
  ];

  let bestMatch = null;
  let maxMatch = 0;
  rules.forEach(rule => {
    let matchCount = 0;
    rule.keywords.forEach(kw => {
      if (msg.includes(kw)) matchCount++;
    });
    if (matchCount > maxMatch) {
      maxMatch = matchCount;
      bestMatch = rule;
    }
  });

  if (bestMatch && maxMatch > 0) {
    response = t(`chatbot.replies.${bestMatch.replyKey}`);
  } else {
    response = t("chatbot.error");
    isError = true;
  }

  incomingChatLi.classList.remove("chat-thinking");
  messageElement.removeAttribute("aria-label");
  messageElement.textContent = response;
  messageElement.classList.toggle("error", isError);
  chatbox.scrollTo(0, chatbox.scrollHeight);
};

// 发送消息处理主逻辑
const handleChat = async () => {
  if (isChatHandling) return;
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  isChatHandling = true;
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  // 发送后立即复原快捷图标显示
  const chatPromptTrigger = document.getElementById("chatPromptTrigger");
  if (chatPromptTrigger) {
    chatPromptTrigger.classList.remove("is-hidden");
  }

  if (sendChatBtn) sendChatBtn.disabled = true;

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  const incomingChatLi = createChatLi("", "incoming");
  incomingChatLi.classList.add("chat-thinking");
  const thinkingMessage = incomingChatLi.querySelector("p");
  thinkingMessage.setAttribute("role", "status");
  thinkingMessage.setAttribute("aria-label", t("chatbot.thinking"));
  thinkingMessage.innerHTML = '<span class="chat-thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
  chatbox.appendChild(incomingChatLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  window.setTimeout(async () => {
    try {
      if (isAIMode) {
        await generateResponseAI(incomingChatLi, userMessage);
      } else {
        generateResponse(incomingChatLi);
      }
    } finally {
      isChatHandling = false;
      if (sendChatBtn) sendChatBtn.disabled = false;
      chatInput.focus();
    }
  }, 600);
};

// 全站可用：与 CHAT 按钮同右下角锚点，面板盖住按钮并向上展开
const layoutChatbot = () => {
  if (!chatbotPanel) return;
  if (!document.body.classList.contains("show-chatbot")) {
    // 关闭时保留 bottom 锚点，交给 CSS scale 收回按钮位置；仅清高度相关内联
    chatbotPanel.style.top = "";
    chatbotPanel.style.height = "";
    chatbotPanel.style.maxHeight = "";
    return;
  }

  const bottomPad = 24;
  const topSafe = 16;
  const maxH = Math.max(280, window.innerHeight - bottomPad - topSafe);
  const preferred = Math.min(560, maxH);

  chatbotPanel.style.top = "auto";
  chatbotPanel.style.bottom = `max(${bottomPad}px, env(safe-area-inset-bottom, 0px))`;
  chatbotPanel.style.height = `${preferred}px`;
  chatbotPanel.style.maxHeight = `${maxH}px`;
};

const setChatbotOpen = (isOpen) => {
  document.body.classList.toggle("show-chatbot", isOpen);
  chatbotToggler.classList.toggle("active", isOpen);
  chatbotToggler.setAttribute("aria-expanded", String(isOpen));
  chatbotPanel.setAttribute("aria-hidden", String(!isOpen));
  if (isOpen) {
    layoutChatbot();
    chatInput.focus();
  } else {
    layoutChatbot(); // 清掉内联 top/height
    // 关闭聊天机器人时，确保快捷菜单也一并复原
    const chatQuickMenu = document.getElementById("chatQuickMenu");
    const chatPromptTrigger = document.getElementById("chatPromptTrigger");
    if (chatQuickMenu && chatPromptTrigger) {
      chatQuickMenu.classList.remove("active");
      chatPromptTrigger.classList.remove("active");
      chatQuickMenu.setAttribute("aria-hidden", "true");
      chatPromptTrigger.setAttribute("aria-expanded", "false");
      chatPromptTrigger.style.transform = "";
    }
  }
};

window.addEventListener("scroll", () => {
  if (document.body.classList.contains("show-chatbot")) layoutChatbot();
}, { passive: true });
window.addEventListener("resize", () => {
  if (document.body.classList.contains("show-chatbot")) layoutChatbot();
}, { passive: true });
// nav 收缩是 class 切换，用 rAF 在布局后补一次，避免量到过渡中途的高度
const _navElForChat = document.getElementById("nav");
if (_navElForChat && typeof MutationObserver !== "undefined") {
  new MutationObserver(() => {
    if (document.body.classList.contains("show-chatbot")) {
      requestAnimationFrame(layoutChatbot);
    }
  }).observe(_navElForChat, { attributes: true, attributeFilter: ["class"] });
}

if (chatInput && sendChatBtn && chatbox && chatbotToggler && chatbotCloseBtn && chatbotPanel) {
  // 核心：监听输入，打字时自动隐形图标，清空时优雅浮现
  chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 180)}px`;

    const chatPromptTrigger = document.getElementById("chatPromptTrigger");
    const chatQuickMenu = document.getElementById("chatQuickMenu");
    const hasText = chatInput.value.trim().length > 0;

    if (chatPromptTrigger) {
      chatPromptTrigger.classList.toggle("is-hidden", hasText);
      // 打字时若快捷菜单开着则自动收起
      if (hasText && chatQuickMenu) {
        chatQuickMenu.classList.remove("active");
        chatPromptTrigger.classList.remove("active");
        chatQuickMenu.setAttribute("aria-hidden", "true");
        chatPromptTrigger.setAttribute("aria-expanded", "false");
        chatPromptTrigger.style.transform = ""; 
      }
    }
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChat();
    }
  });

  sendChatBtn.addEventListener("click", handleChat);
  chatbotCloseBtn.addEventListener("click", () => setChatbotOpen(false));
  chatbotToggler.addEventListener("click", () => {
    setChatbotOpen(!document.body.classList.contains("show-chatbot"));
  });

  // Chatbox 独立滚轮阻断：在对话框内滚动绝不窜出外部页面
  chatbox.addEventListener("wheel", (e) => {
    const atTop = chatbox.scrollTop === 0 && e.deltaY < 0;
    const atBottom = chatbox.scrollTop + chatbox.clientHeight >= chatbox.scrollHeight - 1 && e.deltaY > 0;
    if (!atTop && !atBottom) {
      e.stopPropagation();
    }
  }, { passive: false });
}

// -------------------------------------------------------------
// 输入框末尾快捷菜单触发与磨砂圆角形变交互
// -------------------------------------------------------------
const chatPromptTrigger = document.getElementById("chatPromptTrigger");
const chatQuickMenu = document.getElementById("chatQuickMenu");

if (chatPromptTrigger && chatQuickMenu) {
  chatPromptTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = chatQuickMenu.classList.toggle("active");
    chatPromptTrigger.classList.toggle("active", isOpen);
    chatQuickMenu.setAttribute("aria-hidden", String(!isOpen));
    chatPromptTrigger.setAttribute("aria-expanded", String(isOpen));
    
    // 【核心修复】：点击关闭时，强制覆写 CSS 的 :hover 旋转，让它立刻回正
    if (!isOpen) {
      chatPromptTrigger.style.transform = "translateY(-50%) rotate(0deg) scale(1)";
    } else {
      chatPromptTrigger.style.transform = "";
    }
  });

  // 鼠标移开时，清除内联样式，交还给 CSS 接管
  chatPromptTrigger.addEventListener("mouseleave", () => {
    chatPromptTrigger.style.transform = "";
  });

  // 点击外部收起磨砂菜单
  document.addEventListener("click", (e) => {
    if (!chatQuickMenu.contains(e.target) && e.target !== chatPromptTrigger) {
      chatQuickMenu.classList.remove("active");
      chatPromptTrigger.classList.remove("active");
      chatQuickMenu.setAttribute("aria-hidden", "true");
      chatPromptTrigger.setAttribute("aria-expanded", "false");
      chatPromptTrigger.style.transform = "";
    }
  });

  // 点击选项：自动填入、平滑收起菜单并立即触发发送
  const quickItems = chatQuickMenu.querySelectorAll(".chat-quick-item");
  quickItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const keyword = item.dataset.keyword;
      if (!keyword || isChatHandling) return;
      
      chatQuickMenu.classList.remove("active");
      chatPromptTrigger.classList.remove("active");
      chatQuickMenu.setAttribute("aria-hidden", "true");
      chatPromptTrigger.setAttribute("aria-expanded", "false");
      chatPromptTrigger.style.transform = "";

      chatInput.value = keyword;
      handleChat();
    });
  });
}

// --------------------------------------------------------------------------
// 针对三大城市完全独立隔离的 AI 记忆库
// --------------------------------------------------------------------------

// 1. 槟城 Pulau Tikus 独立知识库
const penangSiteKnowledge = {
  announcements: `
    Pulau Tikus (Penang) Community Announcements:
    - 30 July 2026: Heavy rain & flash flood warning (2pm-8pm) along coastal George Town areas.
    - 24 August 2026: Scheduled PBA water supply maintenance (9am-4pm) for Pulau Tikus residential zone.
    - 15 August 2026: Penang Annual Residents General Meeting at Multipurpose Hall, 8pm.
  `,
  facilities: `
    Pulau Tikus Facilities:
    - Tennis court near entrance, central Swimming Pool with sun deck, sand Playground behind Clubhouse, Gym beside basketball court, 2-acre Community Park along Jalan Kelawei.
  `,
  services: `
    Penang Local Service Directory:
    - Ahmad Razali (Plumber): +60 12-345 6789.
    - Siti Aminah (Electrician): +60 13-456 7890.
    - Dr. Priya (Home Doctor / GP): +60 18-901 2345.
  `,
  general: `
    Community: MYCELIUM Residences in Pulau Tikus, George Town, Penang, Malaysia.
    Management Office: +60 10-557 0900, myceliumresidence07@gmail.com. Mon-Fri 9am-6pm.
  `
};

// 2. 柔佛新山 Johor Bahru 独立知识库
const jbSiteKnowledge = {
  announcements: `
    Johor Bahru Community Announcements:
    - 12 August 2026: Cross-border traffic advisory & community shuttle update to JB Sentral / RTS Link.
    - 26 August 2026: Skudai riverfront park conservation and neighborhood green tree-planting drive.
    - 05 September 2026: Scheduled electrical maintenance at Clubhouse, 10am-2pm.
  `,
  facilities: `
    Johor Bahru Facilities:
    - Straits-view Infinity Swimming Pool, Community Gym, Co-working lounge for remote professionals, EV fast-charging bay, Badminton court.
  `,
  services: `
    Johor Bahru Local Service Directory:
    - Tan Boon Seng (Plumbing & Water Works): +60 7-331 4567.
    - Muhammad Faizal (Air-Cond & Electrical): +60 19-712 3456.
    - Dr. Faridah (Family Clinic Home Care): +60 7-224 8900.
  `,
  general: `
    Community: MYCELIUM Residences in Johor Bahru, Johor, Malaysia.
    Management Office: +60 7-223 8899, jb.management@mycelium-community.com. Mon-Fri 9am-6pm.
  `
};

// 3. 美国波特兰 Portland 独立知识库
const portlandSiteKnowledge = {
  announcements: `
    Portland, Oregon Community Announcements:
    - October 15, 2026: Annual building fire alarm inspection (10 AM - 12 PM).
    - October 27, 2026: Curbside compost collection schedule changes to Tuesdays/Fridays.
    - November 04, 2026: Water main maintenance shut-off (9 AM - 11 AM).
  `,
  facilities: `
    Portland Community Amenities:
    - Community Garden, Fitness Center, Co-working Lounge, Bike Hub & Repair, EV Charging Stations, 0.8-mile Woodland Walking Trail, Clubhouse.
  `,
  services: `
    Portland Emergency & Local Contacts:
    - Emergency: 911 | City of Portland Non-Emergency: 311.
    - Building Maintenance: +1 (234) 567-8910 (John Smith).
  `,
  general: `
    Community: MYCELIUM Residences – Portland, Oregon, United States.
    Management Office: +1 (234) 567-8910, john.smith@company.com. Mon-Fri 9am-5pm Pacific Time.
  `
};

const knowledgeKeywords = [
  { keywords: ["announcement", "news", "notice", "emergency", "maintenance", "rain", "water supply"], key: "announcements" },
  { keywords: ["facility", "facilities", "map", "gym", "pool", "playground", "park", "tennis", "basketball", "clubhouse", "parking"], key: "facilities" },
  { keywords: ["service", "directory", "plumber", "electrician", "cleaner", "carpenter", "painter", "landscaper", "doctor", "air cond"], key: "services" },
  { keywords: ["event", "calendar", "tree planting", "cleanup", "fun run", "activity"], key: "events" },
  { keywords: ["volunteer", "register", "marshal", "help"], key: "volunteer" },
  { keywords: ["faq", "question", "rule", "membership", "report", "issue"], key: "faq" },
  { keywords: ["mycelium", "community", "website", "contact", "management", "office"], key: "general" }
];

function getCurrentLocKey() {
  const current = (window.MYCELIUM_COUNTRY || "").toUpperCase();
  if (current === "US_PL" || current === "US") return "US_PL";
  if (current === "MY_JB") return "MY_JB";
  return "MY_PP";
}

function getRelevantSiteContent(userMsg) {
  const msg = userMsg.toLowerCase();
  const loc = getCurrentLocKey();
  let knowledge = penangSiteKnowledge;
  if (loc === "US_PL") knowledge = portlandSiteKnowledge;
  else if (loc === "MY_JB") knowledge = jbSiteKnowledge;

  let matchedContent = "";
  knowledgeKeywords.forEach(item => {
    const hit = item.keywords.some(kw => msg.includes(kw));
    if (hit && knowledge[item.key]) matchedContent += knowledge[item.key] + "\n";
  });
  return (matchedContent || knowledge.general).trim();
}

function collectChatHistory() {
  const bubbles = [...chatbox.querySelectorAll("li.chat")].slice(0, -2); // drop the current question + "thinking" bubble
  return bubbles
    .map((li) => ({
      role: li.classList.contains("outgoing") ? "user" : "assistant",
      content: (li.querySelector("p")?.textContent || "").trim(),
    }))
    .filter((item) => item.content)
    .slice(-6);
}
 
// The server holds the assistant's instructions and its live tools (weather, nearby places, web search).
async function callAIAssistant({ question, siteContent, history }) {
  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, siteContent, history, locationCode: getCurrentLocKey() })
    });
 
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return "The AI assistant is temporarily unavailable. Please try again shortly.";
    }
    return typeof data.text === "string" && data.text.trim()
      ? data.text
      : "No answer returned. Please consult the management office.";
  } catch (err) {
    return "Connection error. Please try again shortly.";
  }
}
 
async function generateResponseAI(incomingChatLi, userMsg) {
  const messageElement = incomingChatLi.querySelector("p");
  const siteContent = getRelevantSiteContent(userMsg);
  const history = collectChatHistory();
  const reply = await callAIAssistant({ question: userMsg, siteContent, history });
  incomingChatLi.classList.remove("chat-thinking");
  messageElement.removeAttribute("aria-label");
  messageElement.textContent = reply;
  chatbox.scrollTo(0, chatbox.scrollHeight);
}

// 模式切换
const aiModeBtn = document.getElementById("aiModeBtn");
let isAIMode = false;
if (aiModeBtn) {
  aiModeBtn.addEventListener("click", () => {
    isAIMode = !isAIMode;
    aiModeBtn.classList.toggle("active", isAIMode);
    aiModeBtn.setAttribute("aria-pressed", String(isAIMode));
  });
}

// -------------------------------------------------------------
// 反馈表单提交：彻底告别 alert("Google says...")
// -------------------------------------------------------------
const reportBtn = document.querySelector(".report-btn");
const reportModal = document.getElementById("reportModal");
const reportCloseBtn = document.querySelector(".report-close-btn");
const reportForm = document.getElementById("reportForm");

function openReportForm() {
  if (!reportModal) return;
  reportModal.classList.add("active");
  reportModal.setAttribute("aria-hidden", "false");
}

function closeReportForm() {
  if (!reportModal || !reportForm) return;
  reportModal.classList.remove("active");
  reportModal.setAttribute("aria-hidden", "true");
  reportForm.reset();
}

if (reportBtn) reportBtn.addEventListener("click", openReportForm);
if (reportCloseBtn) reportCloseBtn.addEventListener("click", closeReportForm);
if (reportModal) {
  reportModal.addEventListener("click", (e) => {
    if (e.target === reportModal) closeReportForm();
  });
}

if (reportForm && chatbox) {
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = reportForm.querySelector(".report-submit-btn");
    const originalBtnText = submitBtn ? submitBtn.textContent : "Submit";

    const formData = new FormData(reportForm);
    const reportData = {
      countryCode: window.MYCELIUM_COUNTRY || "MY_PP",
      firstName: formData.get("firstName") || "",
      lastName: formData.get("lastName") || "",
      contactNumber: formData.get("contactNumber") || "",
      email: formData.get("email") || "",
      address: formData.get("address") || "",
      message: formData.get("message") || "",
      subscribeUpdates: formData.get("subscribeUpdates") === "on",
      source: "chatbot_report",
      createdAt: null
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    try {
      if (typeof db !== "undefined" && db.collection) {
        const docData = { ...reportData };
        if (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue) {
          docData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        const countryCode = String(window.MYCELIUM_COUNTRY || "MY_PP").toUpperCase();
        const reports = window.MYCELIUM_REGION_PATHS.ref(db, countryCode, "reports");
        await reports.add(docData);
      }

      closeReportForm();
      const successMsg = t("report.successAlert");
      
      // 优雅居中品牌弹窗
      if (typeof window.showMyceliumNotice === "function") {
        window.showMyceliumNotice(successMsg, "Thank You");
      }

      const thankYouText = t("chatbot.thankFeedback");
      const replyLi = createChatLi(thankYouText, "incoming");
      chatbox.appendChild(replyLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    } catch (error) {
      console.error("Error submitting report:", error);
      const errorMsg = t("report.errorAlert");
      
      if (typeof window.showMyceliumNotice === "function") {
        window.showMyceliumNotice(errorMsg, "Notice");
      }
      
      const replyLi = createChatLi(errorMsg, "incoming");
      const p = replyLi.querySelector("p");
      if (p) p.classList.add("error");
      chatbox.appendChild(replyLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}