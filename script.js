const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".send-chat-btn");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");
const chatbotPanel = document.querySelector(".chatbot");
let userMessage = "";
const inputInitHeight = chatInput ? chatInput.scrollHeight : 54;


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


const handleChat = async () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;
  sendChatBtn.disabled = true;

  
  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  
  const incomingChatLi = createChatLi(t("chatbot.thinking"), "incoming");
  chatbox.appendChild(incomingChatLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  
  window.setTimeout(async () => {
    if (isAIMode) {
      await generateResponseAI(incomingChatLi, userMessage);
    } else {
      generateResponse(incomingChatLi);
    }
    sendChatBtn.disabled = false;
    chatInput.focus();
  }, 700);
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
      countryCode: window.MYCELIUM_COUNTRY || "MY",
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
      
      if (window.MYCELIUM_LOCAL_PREVIEW && window.MYCELIUM_PREVIEW_STORE) {
        window.MYCELIUM_PREVIEW_STORE.save(reportData.countryCode, "reports", reportData);
      } else if (typeof db !== "undefined" && db.collection) {
        const docData = { ...reportData };
        
        if (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue) {
          docData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        const countryCode = String(window.MYCELIUM_COUNTRY || "MY").toUpperCase();
        const reports = countryCode === "MY"
          ? db.collection("reports")
          : db.collection("locations").doc(countryCode).collection("reports");
        await reports.add(docData);
      } else {
        console.warn("Firestore db not available, skipping database write");
      }

      
      closeReportForm();
      const successMsg = t("report.successAlert");
      alert(successMsg);
      
      const thankYouText = t("chatbot.thankFeedback");
      const replyLi = createChatLi(thankYouText, "incoming");
      chatbox.appendChild(replyLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    } catch (error) {
      console.error("Error submitting report:", error);
      
      const errorMsg = t("report.errorAlert");
      alert(errorMsg);
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


const aiModeBtn = document.getElementById("aiModeBtn");
let isAIMode = false;

if (aiModeBtn) {
  aiModeBtn.addEventListener("click", () => {
    isAIMode = !isAIMode;
    aiModeBtn.classList.toggle("active", isAIMode);
    aiModeBtn.setAttribute("aria-pressed", String(isAIMode));
  });
}

const siteKnowledge = {
  announcements: `
    Community Announcements (as of July 2026):
    - 30 July 2026: Heavy rain warning from 2pm to 8pm. Secure loose outdoor items and avoid the pond area.
    - 24 August 2026: Water supply interruption 9am-4pm for scheduled maintenance.
    - 15 August 2026: Annual community meeting at multipurpose hall, 8pm, all residents welcome.
    - 08 August 2026: New recycling points added near guest parking area.
    - 01 August 2026: Tree Planting Day at 8am.
    Categories available: All, Emergency, Maintenance, Community, Events.
  `,
  facilities: `
    Community Facilities Map locations:
    - Tennis court: near front entrance, beside front-facing homes.
    - Clubhouse: main community building, adjoining pool deck and open lawn near the center of neighborhood.
    - Main pool: central pool with sun deck, loungers and umbrellas, right next to the clubhouse.
    - Playground: sand-based play area with slide equipment, just behind the clubhouse.
    - Community park: open green lawn with looping walking path, on the east side of the property.
    - Guest parking: striped parking lot for residents and visitors, just south of the clubhouse.
    - Basketball court: near southwest corner homes.
    - Gym: grey-roofed house beside basketball court.
    - Pond: natural pond along southeast edge, bordered by trees.
    - Recycling points: near guest parking and near bottom row of homes.
  `,
  services: `
    Local Service Directory (8 trusted local services):
    - Ahmad Razali (Plumber): +60 12-345 6789, ahmad.plumb@email.com. Pipe installation, leak repair, bathroom fitting, water heater maintenance.
    - Siti Aminah (Electrician): +60 13-456 7890, siti.elec@email.com. Certified wiring, circuit breaker repair, lighting installation, safety inspection.
    - Raj Kumar (Air-Cond Technician): +60 14-567 8901, raj.ac@email.com. AC servicing, gas top-up, compressor repair, annual maintenance contracts.
    - Lee Wei Ming (Carpenter): +60 15-678 9012, lee.carpentry@email.com. Custom furniture, kitchen cabinet, wardrobe, home renovation woodwork.
    - Nurul Izzati (Cleaner): +60 16-789 0123, nurul.clean@email.com. Deep cleaning, move-in/out cleaning, office cleaning, regular housekeeping.
    - Tan Boon Heng (Painter): +60 17-890 1234, tan.paint@email.com. Interior/exterior painting, waterproof coating, wall texture repair, color consultation.
    - Dr. Priya (Home Doctor): +60 18-901 2345, dr.priya@email.com. General practitioner home visits, health screening, vaccination, elderly care.
    - Zainab Yusof (Landscaper): +60 19-012 3456, zainab.green@email.com. Garden design, lawn maintenance, tree trimming, irrigation system.
  `,
  events: `
    Upcoming Community Events (July 2026):
    - 1 August: Tree Planting Day, 8:00 AM, Community Park. Bring gardening gloves, small shovel, reusable water bottle.
    - 9 August: Neighborhood Cleanup Day, 9:00 AM, Guest Parking Lot. Bring gloves, face mask, tongs; garbage bags provided.
    - 22 August: Fun Run, 7:00 AM, Community Park. 3KM family run and 5KM open run. Light refreshments provided.
  `,
  volunteer: `
    Volunteer Registration activities:
    - Tree Planting Day: 1 August 2026, 8AM, Community Park.
    - Neighborhood Cleanup Day: 9 August 2026, 9AM, Guest Parking Lot.
    - Fun Run Marshal: 22 August 2026, 7AM, Community Park.
    Registration requires full name, phone number, house address. Optional notes for dietary or accessibility needs.
  `,
  faq: `
    Frequently Asked Questions:
    1. How to become a member? Open to all residents. Visit Volunteer Registration or contact community office. New members get welcome package.
    2. What facilities are available? Community Hall (200 capacity), Health Clinic, Children's Playground, Library (10,000+ books), Sports Center with gym and pool, 2-acre Central Park.
    3. How to report maintenance/safety issues? Use chatbot, email facilities@smartcommunity.local, or call 24/7 hotline +60 3-1234 5678. Non-emergency addressed within 48 hours.
    4. Age-specific programs? Yes: toddler storytime, youth sports leagues, teen mentorship, adult fitness classes, senior wellness walks.
    5. Community newsletter? Weekly email every Monday. Subscribe at footer.
    6. Community rules? Quiet hours 10PM-7AM, waste sorting, pet leash in common areas, parking regulations. Full handbook available at office.
  `,
  general: `
    Website name: MYCELIUM Smart Community.
    Tagline: Empowering Health, Enriching Lives.
    Community management contact: +60 10-557 0900, myceliumresidence07@gmail.com.
    Office hours: 9am-6pm weekdays.
  `
};

// Separate Portland demo knowledge prevents US visitors from receiving MY contacts or rules.
const usSiteKnowledge = {
  announcements: "Fictional Portland demo notices: annual fire alarm test 15 Oct 2026, 10 AM–12 PM; compost pickup moves to Tuesdays and Fridays from 27 Oct; scheduled water shut-off 4 Nov 2026, 9–11 AM.",
  facilities: "Portland community facilities: Community Garden; Fitness Center; Co-working Lounge; Bike Hub; EV Charging Stations; Recycling & Compost Center; 0.8-mile Woodland Walking Trail; Clubhouse.",
  services: "US directory: emergency 911; City of Portland non-emergency 311; 988 Suicide & Crisis Lifeline; Poison Control 1-800-222-1222; management office +1 (234) 567-8910, Mon–Fri 9 AM–5 PM Pacific; 24-hour security demo line +1 (234) 567-8910.",
  events: "Fictional Portland demo events: Fall Garden Swap 24 Oct 2026; Fun Run 7 Nov 2026; Neighborhood Food Drive 14 Nov 2026; Community Thanksgiving Potluck 26 Nov 2026.",
  volunteer: "Volunteer interest can be submitted through the site's volunteer registration form. The form asks for name, phone, address, notes and activity. Events shown are fictional demonstration content.",
  faq: "Portland demo community: quiet hours 10 PM–7 AM; clubhouse reservations should be requested from management at least 7 days in advance; report urgent danger to 911, and contact management for community questions.",
  general: "MYCELIUM Residences – Portland, Oregon, USA. Demo contact: John Smith, 123 Main Street, 12345; +1 (234) 567-8910; john.smith@company.com. Local time is Pacific Time, currency USD, distance miles. This location's announcements and events are fictional demonstration content."
};


const knowledgeKeywords = [
  { keywords: ["announcement", "news", "notice", "emergency", "maintenance", "rain", "water supply"], key: "announcements" },
  { keywords: ["facility", "facilities", "map", "gym", "pool", "playground", "park", "tennis", "basketball", "clubhouse", "parking", "pond", "recycling"], key: "facilities" },
  { keywords: ["service", "directory", "plumber", "electrician", "cleaner", "carpenter", "painter", "landscaper", "doctor", "air cond", "repair", "contact"], key: "services" },
  { keywords: ["event", "calendar", "tree planting", "cleanup", "fun run", "july", "activity"], key: "events" },
  { keywords: ["volunteer", "register", "marshal", "help"], key: "volunteer" },
  { keywords: ["faq", "question", "rule", "membership", "report", "issue", "newsletter", "parking rule", "quiet hour"], key: "faq" },
  { keywords: ["mycelium", "community", "website", "contact", "management", "office"], key: "general" }
];


async function callOpenRouter(prompt) {
  if (window.MYCELIUM_LOCAL_PREVIEW) {
    const question = prompt.split("User question:").pop().trim();
    const siteContent = getRelevantSiteContent(question);
    const sampleLines = siteContent.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("-") || /^\d+\./.test(line)).slice(0, 3);
    return sampleLines.length
      ? `Local preview sample (not a live AI response): ${sampleLines.join(" ")}`
      : "Local preview sample: please check the relevant community page or contact the local management office for details.";
  }

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, countryCode: window.MYCELIUM_COUNTRY || "MY" })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Mycelium AI request failed:", {
        httpStatus: response.status,
        reason: data.error || "Unknown server error",
        providerStatus: data.providerStatus || undefined,
      });
      return "The AI assistant is temporarily unavailable. Please try again shortly.";
    }
    return typeof data.text === "string" && data.text.trim()
      ? data.text
      : "The AI assistant did not return an answer. Please try again.";
  } catch (err) {
    console.error("Mycelium AI request failed:", err);
    return "The AI assistant could not connect. Please try again shortly.";
  }
}


function getRelevantSiteContent(userMsg) {
  const msg = userMsg.toLowerCase();
  const knowledge = window.MYCELIUM_COUNTRY === "US" ? usSiteKnowledge : siteKnowledge;
  let matchedContent = "";
  knowledgeKeywords.forEach(item => {
    const hit = item.keywords.some(kw => msg.includes(kw));
    if (hit) matchedContent += knowledge[item.key] + "\n";
  });
  return matchedContent.trim();
}


async function generateResponseAI(incomingChatLi, userMsg) {
  const messageElement = incomingChatLi.querySelector("p");
  const siteContent = getRelevantSiteContent(userMsg);
  const locationName = window.MYCELIUM_COUNTRY === "US" ? "MYCELIUM Residences – Portland, Oregon, USA" : "MYCELIUM Smart Community in Pulau Tikus, Penang, Malaysia";

  if (siteContent) {
    const prompt = `
      You are a helpful community assistant for ${locationName}.
      Use ONLY the following website information to answer the user's question.
      If the answer is not in the information, say you don't know and suggest contacting management.
      Keep the answer friendly, concise and well-structured.
      Answer in the user's language when possible.
      Website information:
      ${siteContent}
      User question: ${userMsg}
    `;
    const reply = await callOpenRouter(prompt);
    messageElement.textContent = reply;
  } else {
    const prompt = `
      You are a friendly assistant for ${locationName}. Do not invent location-specific facts; direct the user to the community office if unsure.
      Answer in the user's language when possible.
      User question: ${userMsg}
    `;
    const reply = await callOpenRouter(prompt);
    messageElement.textContent = reply;
  }
  chatbox.scrollTo(0, chatbox.scrollHeight);
}


const quickReplyBtns = document.querySelectorAll(".quick-reply-btn");
if (quickReplyBtns.length > 0 && chatbox && sendChatBtn && chatInput) {
  quickReplyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const keyword = btn.dataset.keyword;
      if (!keyword) return;
      chatInput.value = keyword;
      handleChat();
    });
  });
}