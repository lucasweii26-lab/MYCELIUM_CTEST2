// script.js
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".send-chat-btn");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");
const chatbotPanel = document.querySelector(".chatbot");
let userMessage = "";
const inputInitHeight = chatInput ? chatInput.scrollHeight : 54;
let isChatHandling = false; // 提交互斥锁，彻底杜绝双发

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

// 普通本地关键词回复规则
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

  messageElement.textContent = response;
  messageElement.classList.toggle("error", isError);
  chatbox.scrollTo(0, chatbox.scrollHeight);
};

// 发送消息主函数（防抖+锁）
const handleChat = async () => {
  if (isChatHandling) return;
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  isChatHandling = true;
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;
  if (sendChatBtn) sendChatBtn.disabled = true;

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  const incomingChatLi = createChatLi(t("chatbot.thinking"), "incoming");
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

const setChatbotOpen = (isOpen) => {
  document.body.classList.toggle("show-chatbot", isOpen);
  chatbotToggler.setAttribute("aria-expanded", String(isOpen));
  chatbotPanel.setAttribute("aria-hidden", String(!isOpen));
  if (isOpen) chatInput.focus();
};

if (chatInput && sendChatBtn && chatbox && chatbotToggler && chatbotCloseBtn && chatbotPanel) {
  chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 180)}px`;
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
}

// --------------------------------------------------------------------------
// 针对三大城市完全独立隔离的 AI 记忆库（方便后期单独拓展，不互相干扰）
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

// 获取当前准确的地点编码
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

async function callOpenRouter(prompt) {

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, locationCode: getCurrentLocKey() })
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
  const loc = getCurrentLocKey();
  const locationLabel = loc === "US_PL" ? "Portland, Oregon, USA" : (loc === "MY_JB" ? "Johor Bahru, Johor, Malaysia" : "Pulau Tikus, Penang, Malaysia");

  const prompt = `
    You are the official community assistant for MYCELIUM Residences in ${locationLabel}.
    Answer strictly using the following verified local data:
    ${siteContent}
    If information is not present, guide the resident to the local management office.
    Keep answers friendly, clear and concise.
    User question: ${userMsg}
  `;
  const reply = await callOpenRouter(prompt);
  messageElement.textContent = reply;
  chatbox.scrollTo(0, chatbox.scrollHeight);
}

// 唯一绑定快捷回复（只在 script.js 中注册，app.js 中的需删除，双发彻底解决）
const quickReplyBtns = document.querySelectorAll(".quick-reply-btn");
if (quickReplyBtns.length > 0 && chatbox && chatInput) {
  quickReplyBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const keyword = btn.dataset.keyword;
      if (!keyword || isChatHandling) return;
      chatInput.value = keyword;
      handleChat();
    });
  });
}

// 切换 AI 模式
const aiModeBtn = document.getElementById("aiModeBtn");
let isAIMode = false;
if (aiModeBtn) {
  aiModeBtn.addEventListener("click", () => {
    isAIMode = !isAIMode;
    aiModeBtn.classList.toggle("active", isAIMode);
    aiModeBtn.setAttribute("aria-pressed", String(isAIMode));
  });
}