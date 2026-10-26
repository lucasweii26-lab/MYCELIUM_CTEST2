// ==========================================================================
// app.js — MYCELIUM 智慧社区前端主逻辑
// ==========================================================================

// 全局通用品牌优雅弹窗（替代原生 alert）
function showMyceliumNotice(message, title = "Thank You") {
  const modal = document.getElementById("myceliumNoticeModal");
  if (!modal) {
    window.alert(message);
    return;
  }
  const titleEl = document.getElementById("myceliumNoticeTitle");
  const msgEl = document.getElementById("myceliumNoticeMsg");
  const btn = document.getElementById("myceliumNoticeConfirmBtn");
  
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  
  const close = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    btn.removeEventListener("click", close);
  };
  btn.addEventListener("click", close, { once: true });
}
window.showMyceliumNotice = showMyceliumNotice;

// 背景音效初始化
(function initBgWhiteNoise() {
  const audio = document.getElementById('bgWhiteNoise');
  if (!audio) return;

  audio.volume = 0.3; 
  audio.loop = true;
  audio.preload = 'auto';

  let hasPlaySuccess = false; 

  function tryPlay() {
    if (hasPlaySuccess) return;
    const playPromise = audio.play();
    if (!playPromise) return;

    playPromise.then(() => {
      hasPlaySuccess = true;
      audio.muted = false;
      localStorage.setItem('bgNoiseAutoplayAllowed', 'true');
      removeAllListeners();
    }).catch(() => {});
  }

  function handleUserInteract() {
    if (hasPlaySuccess) return;
    audio.muted = false;
    tryPlay();
  }

  const eventTypes = [
    'click', 'mousedown', 'touchstart', 'pointerdown',
    'keydown', 'scroll', 'wheel', 'input', 'change', 'pointerup'
  ];

  function removeAllListeners() {
    eventTypes.forEach(evt => {
      document.removeEventListener(evt, handleUserInteract, { passive: true });
    });
  }

  eventTypes.forEach(evt => {
    document.addEventListener(evt, handleUserInteract, { passive: true });
  });

  if (localStorage.getItem('bgNoiseAutoplayAllowed') === 'true') {
    tryPlay();
  } else {
    audio.muted = true;
    audio.play().catch(() => {});
  }
})();

const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'preferredLang';

// 提前声明全局语言并挂载至 window，确保依赖此变量的外部脚本零报错
let currentLang = DEFAULT_LANG;
window.currentLang = currentLang;

const LANG_LABELS = {
  'en': 'English',
  'es': 'Español',
  'zh-CN': '简体中文',
  'ms': 'Bahasa Melayu',
  'ta': 'தமிழ்'
};

const i18n = {
  en: {
    nav: {
      announcement: 'ANNOUNCEMENT',
      facilities: 'FACILITIES',
      services: 'LOCAL SERVICE DIRECTORY',
      events: 'EVENTS',
      volunteer: 'VOLUNTEER REGISTRATION',
      faq: 'FAQ',
      searchPlaceholder: 'Search .....'
    },
    common: {
      close: 'Close',
      submit: 'Submit',
      backToTop: 'Back to Top',
      readMore: 'Read More',
      all: 'All',
      searchNoResult: 'No matching section found, please try another keyword'
    },
    announcement: {
      title: 'Community Announcements',
      subtitle: 'Stay informed with the latest news and notices from your community',
      tabAll: 'All',
      tabEmergency: 'Emergency',
      tabMaintenance: 'Maintenance',
      tabCommunity: 'Community',
      tabEvents: 'Events'
    },
    map: {
      title: 'Community Facilities Map',
      hint: 'Click a pin to view facility details'
    },
    calendar: {
      title: 'Community Events Calendar',
      hint: 'Click a starred date to see the upcoming community event',
      prev: '‹',
      next: '›'
    },
    service: {
      title: 'Local Service Directory',
      phone: 'Phone',
      email: 'Email'
    },
    volunteer: {
      kicker: 'Participate',
      title: 'Volunteer Registration',
      subtitle: 'Join our volunteer team and make a positive impact in the community',
      registerNow: 'Register Now',
      formTitle: 'Register as a Volunteer',
      fullName: 'Full Name',
      phone: 'Phone Number',
      address: 'House Address',
      namePlaceholder: 'John Doe',
      addressPlaceholder: 'Elton St 21 22-145',
      notesPlaceholder: 'e.g. dietary restrictions, accessibility needs',
      activityLabel: 'Activity:',
      notes: 'Requirements / Notes (optional)',
      submitBtn: 'Submit Registration',
      submitting: 'Submitting...',
      requiredTip: 'Please fill in your name, phone number and select an activity.',
      successTip: 'Thank you! Your registration has been submitted. We\'ll contact you soon.',
      errorTip: 'Submission failed, please check your network and try again.',
      card1: {
        title: 'Tree Planting Day',
        date: '1 August 2026 · 8:00 AM · Community Park',
        desc: 'Help beautify our neighbourhood and promote environmental awareness by planting trees around the community.',
        bring: 'What to bring: Gardening gloves, a small shovel, a reusable water bottle',
        btn: 'Register Now'
      },
      card2: {
        title: 'Neighborhood Cleanup Day',
        date: '9 August 2026 · 9:00 AM · Guest Parking Lot',
        desc: 'Join a walk-and-clean around the pond and park to help keep our community tidy and green.',
        bring: 'What to bring: Gloves, face mask, tongs (garbage bags provided)',
        btn: 'Register Now'
      },
      card3: {
        title: 'Fun Run Marshal',
        date: '22 August 2026 · 7:00 AM · Community Park',
        desc: 'Support runners along the route as a marshal, guiding directions and handing out refreshments.',
        bring: 'What to bring: Comfortable shoes, cap, reusable water bottle',
        btn: 'Register Now'
      }
    },
    faq: {
      title: 'Frequently Asked Questions'
    },
    chatbot: {
      open: 'Chat',
      title: 'Community Assistant',
      placeholder: 'Enter a message...',
      send: 'Send',
      welcome: 'Hi there. How can I help you today?',
      thinking: 'Thinking...',
      report: 'Report',
      error: "Sorry, I don't quite understand that. You can try asking about events, facilities, services or volunteer registration.",
      thankFeedback: 'Thank you for your feedback',
      quickReply: {
        announcement: 'Announcements',
        facilities: 'Facilities',
        services: 'Services',
        events: 'Events',
        volunteer: 'Volunteer',
        faq: 'FAQ'
      },
      replies: {
        announcement: "Latest Community Announcements:\n\n• 30 July - Heavy rain warning (2pm-8pm)\n• 24 Aug - Water supply interruption (9am-4pm)\n• 15 Aug - Annual community meeting\n\nOpen the Announcements page to view all categories and full details.",
        greeting: "Hello! How can I help you today? You can ask me about events, facilities, services, volunteer registration or FAQs.",
        events: "Upcoming Community Events:\n\n• 1 Aug - Tree Planting Day\n• 9 Aug - Neighbourhood Cleanup Day\n• 22 Aug - Fun Run\n\nOpen the Event Calendar page to view full details and registration info.",
        volunteer: "You can sign up on the Volunteer Registration page. We currently have 3 activities: Tree Planting Day, Neighborhood Cleanup, and Fun Run Marshal. Click 'REGISTER NOW!' on the volunteer slide to fill in the form.",
        facilities: "Open the Interactive Facilities Map to view all amenities. It marks 11 locations including the gym, swimming pool, playground and clubhouse. You can also search for specific facilities in the top search bar.",
        faq: "Visit the FAQ section for answers about membership, facility booking, community rules and maintenance reports. You can also use the search bar to find content quickly.",
        services: "The Local Service Directory has contacts for 8 types of trusted local services including plumbers, electricians and air-condition technicians. Open the directory to view phone numbers and emails.",
        thank: "You're welcome! Feel free to ask if you have any other questions.",
        contact: "You can reach the community management office at +60 10-557 0900 or email myceliumresidence07@gmail.com. Office hours are 9am-6pm on weekdays."
      }
    },
    report: {
      title: 'Submit Feedback',
      name: 'Name',
      surname: 'Surname',
      contactNumber: 'Contact Number',
      email: 'Email Address',
      address: 'Your Address',
      message: 'Write Your Message',
      subscribe: 'I would like to receive updates on campaigns.',
      submit: 'Submit',
      successAlert: 'Thank you for your feedback! We have received your report and will respond within 48 hours.',
      errorAlert: 'Sorry, there was an error submitting your feedback. Please try again or email us directly.'
    },
    slider: {
      announcement: {
        title: 'ANNOUNCEMENT',
        desc: 'Stay informed with the latest news and notices from your community',
        btn: 'CHECK NOW !'
      },
      facilities: {
        title: 'FACILITIES',
        desc: 'Explore community facilities, including the gym, playground, swimming pool and more',
        btn: 'CHECK NOW!'
      },
      services: {
        title: 'LOCAL SERVICE DIRECTORY',
        desc: 'Find trusted local services such as plumbers, electricians, cleaners and technicians',
        btn: 'CONTACT NOW!'
      },
      events: {
        title: 'EVENTS',
        desc: 'Discover upcoming community events, activities and celebrations happening near you',
        btn: 'CHECK NOW!'
      },
      volunteer: {
        title: 'VOLUNTEER REGISTRATION',
        desc: 'Join our volunteer team and make a positive impact in the community',
        btn: 'REGISTER NOW!'
      },
      faq: {
        title: 'FAQ',
        desc: 'Find quick answers to frequently asked questions about community services and facilities',
        btn: 'CHECK NOW!'
      }
    },
    mapPins: {
      tennis: { name: 'Tennis court', desc: 'A tennis court near the front entrance, beside the row of front-facing homes.' },
      clubhouse: { name: 'Clubhouse', desc: 'The main community building, adjoining the pool deck and open lawn near the center of the neighborhood.' },
      pool: { name: 'Main pool', desc: 'The community\'s central pool with a sun deck, loungers, and umbrellas, right next to the clubhouse.' },
      playground: { name: 'Playground', desc: 'A sand-based play area with slide equipment, just behind the clubhouse.' },
      park: { name: 'Community park', desc: 'An open green lawn with a looping walking path, on the east side of the property.' },
      parking: { name: 'Guest parking', desc: 'A striped parking lot for residents and visitors, just south of the clubhouse.' },
      basketball: { name: 'Basketball court', desc: 'A basketball court near the southwest corner homes.' },
      gym: { name: 'Gym', desc: 'The grey-roofed house beside the basketball court, used as the community gym.' },
      pond: { name: 'Pond', desc: 'A natural pond along the southeast edge of the community, bordered by trees.' },
      recycle1: { name: 'Recycling point', desc: 'Recycling point near guest parking.' },
      recycle2: { name: 'Recycling point', desc: 'Recycling point near the bottom row of homes.' }
    },
    features: {
      tooltip: "CLICK TO READ MORE",
      smart: {
        title: "SMART FACILITIES",
        desc: "Access modern facilities and services designed to improve daily community life.",
        modal: {
          title: "Smart Facilities",
          items: {
            digitalPayments: "Digital Payments",
            facilityBooking: "Facility Booking",
            procurement: "Procurement",
            eform: "eForm"
          }
        }
      },
      safety: {
        title: "COMMUNITY SAFETY",
        desc: "Creating a safer and more connected neighborhood.",
        modal: {
          title: "Community Safety",
          items: {
            contractManagement: "Contract Management",
            visitorManagement: "Visitor Management",
            videoAnalytics: "Video Analytics",
            virtualPatrol: "Virtual Patrol"
          }
        }
      },
      green: {
        title: "GREEN LIVING",
        desc: "Promoting a clean, healthy and sustainable environment.",
        modal: {
          title: "Green Living",
          items: {
            smartIrrigation: "Smart Irrigation",
            wasteManagement: "Waste Management",
            evCharging: "EV Charging",
            energyEfficiency: "Energy Efficiency"
          }
        }
      },
      connect: {
        title: "CONNECT WITH US",
        desc: "Share ideas, feedback and stay connected with the community.",
        tooltip: "CLICK TO CONTACT"
      }
    },
    footer: {
      tagline: 'EMPOWERING HEALTH\nENRICHING LIVES',
      desc: 'Building a smarter, greener and more connected community for all residents.',
      quickLinks: 'Quick Links',
      linkAnnouncement: 'Announcements',
      linkMap: 'Facilities Map',
      linkService: 'Service Directory',
      linkEvent: 'Events Calendar',
      linkVolunteer: 'Volunteer',
      linkFaq: 'FAQ',
      contactTitle: 'Contact Us',
      contactAddr: '📍 Management Office, Clubhouse Level 1',
      contactPhone: '📞 +6010-5570900',
      contactEmail: '✉ myceliumresidence07@gmail.com',
      contactHour: '🕘 Mon – Fri: 9.00 AM – 6.00 PM',
      newsletterTitle: 'Newsletter',
      newsletterDesc: 'Subscribe for weekly community updates and event notices.',
      newsletterBtn: 'Subscribe',
      newsletterPlaceholder: 'Enter your email address',
      copyright: '© 2026 MYCELIUM Smart Community. All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      rules: 'Community Rules'
    },
    legalDocs: {
      privacy: {
        title: "Privacy Policy",
        content: `
          <h4>1. Information We Collect</h4>
          <p>We may collect personal information you voluntarily provide, including your name, contact number, email address, and house address when you submit feedback, register for volunteer activities, or use community services.</p>
          <h4>2. How We Use Your Information</h4>
          <ul>
            <li>To provide and maintain community services and facilities</li>
            <li>To send important announcements, event notifications and service updates</li>
            <li>To respond to your inquiries and feedback</li>
            <li>To improve community management and user experience</li>
          </ul>
          <h4>3. Information Sharing</h4>
          <p>We do not sell, rent or disclose your personal information to third parties for commercial purposes.</p>
          <h4>4. Data Security</h4>
          <p>We adopt appropriate technical and organizational measures to protect your personal information.</p>
          <h4>5. Your Rights</h4>
          <p>You have the right to access, correct or request deletion of your personal information.</p>
          <h4>6. Contact Us</h4>
          <p>If you have any questions, please contact myceliumresidence07@gmail.com.</p>
        `
      },
      terms: {
        title: "Terms of Service",
        content: `
          <h4>1. Acceptance of Terms</h4>
          <p>By accessing and using the MYCELIUM Smart Community services, you agree to be bound by these Terms of Service.</p>
          <h4>2. Service Description</h4>
          <p>We provide community information, facility booking, and online services.</p>
          <h4>3. User Obligations</h4>
          <ul>
            <li>Comply with applicable laws and community regulations</li>
            <li>Provide true and accurate information</li>
          </ul>
        `
      },
      rules: {
        title: "Community Rules",
        content: `
          <h4>1. Public Area Etiquette</h4>
          <p>Keep public areas clean and tidy. Take good care of public facilities.</p>
          <h4>2. Quiet Hours</h4>
          <p>Quiet hours are from 10:00 PM to 7:00 AM daily.</p>
          <h4>3. Pet Management</h4>
          <p>Pets must be kept on a leash in public areas.</p>
        `
      }
    },
    searchKeywords: [
      { keywords: ["announcement", "announcements", "news", "notice", "update", "emergency", "maintenance", "rain", "water supply"], action: "announcement", slideIndex: 0 },
      { keywords: ["facility", "facilities", "map", "gym", "pool", "swimming", "playground", "park", "tennis", "basketball", "clubhouse", "parking", "pond", "recycling", "site plan"], action: "map", slideIndex: 1 },
      { keywords: ["service", "directory", "plumber", "electrician", "cleaner", "repair", "air cond", "carpenter", "painter", "landscaper", "doctor", "contact"], action: "service", slideIndex: 2 },
      { keywords: ["event", "calendar", "activity", "tree planting", "cleanup", "fun run", "celebration", "july", "august"], action: "calendar", slideIndex: 3 },
      { keywords: ["volunteer", "register", "join", "sign up", "help", "marshal"], action: "volunteer", slideIndex: 4 },
      { keywords: ["faq", "question", "answer", "how to", "rule", "membership", "report", "issue", "safety", "quiet hours", "pet", "parking", "newsletter"], action: "faq", slideIndex: 5 }
    ]
  },

  'zh-CN': {
    nav: {
      announcement: '社区公告',
      facilities: '设施地图',
      services: '本地服务目录',
      events: '活动日历',
      volunteer: '志愿者报名',
      faq: '常见问题',
      searchPlaceholder: '搜索内容...'
    },
    common: {
      close: '关闭',
      submit: '提交',
      backToTop: '回到顶部',
      readMore: '查看详情',
      all: '全部',
      searchNoResult: '未找到匹配内容，请尝试其他关键词'
    },
    announcement: {
      title: '社区公告',
      subtitle: '获取社区最新新闻、通知及重要公告资讯',
      tabAll: '全部',
      tabEmergency: '紧急通知',
      tabMaintenance: '维修维护',
      tabCommunity: '社区活动',
      tabEvents: '活动预告'
    },
    map: {
      title: '社区设施地图',
      hint: '点击标记查看设施详情'
    },
    calendar: {
      title: '社区活动日历',
      hint: '点击带星号的日期查看活动详情',
      prev: '‹',
      next: '›'
    },
    service: {
      title: '本地服务目录',
      phone: '联系电话',
      email: '电子邮箱'
    },
    volunteer: {
      kicker: '参与',
      title: '志愿者报名',
      subtitle: '加入我们的志愿者团队，为社区带来积极影响',
      registerNow: '立即报名',
      formTitle: '志愿者报名表',
      fullName: '姓名',
      phone: '联系电话',
      address: '居住地址',
      notes: '备注信息（选填）',
      submitBtn: '提交报名',
      submitting: '提交中...',
      requiredTip: '请填写姓名、电话并选择活动。',
      successTip: '感谢报名！我们会尽快与您联系。',
      errorTip: '提交失败，请检查网络后重试。',
      card1: {
        title: '植树日',
        date: '2026年8月1日 · 上午8:00 · 社区公园',
        desc: '一起在社区内种植树木，美化社区环境，提升环保意识。',
        bring: '需携带：园艺手套、小铲子、可重复使用水杯',
        btn: '立即报名'
      },
      card2: {
        title: '社区清洁日',
        date: '2026年8月9日 · 上午9:00 · 访客停车场',
        desc: '环绕池塘与公园进行步行清洁，共同维护社区整洁与绿色环境。',
        bring: '需携带：手套、口罩、垃圾夹（垃圾袋统一提供）',
        btn: '立即报名'
      },
      card3: {
        title: '欢乐跑志愿者',
        date: '2026年8月22日 · 上午7:00 · 社区公园',
        desc: '作为路线志愿者为跑者提供指引、补给发放等支持。',
        bring: '需携带：舒适鞋子、帽子、可重复使用水杯',
        btn: '立即报名'
      }
    },
    faq: {
      title: '常见问题'
    },
    chatbot: {
      open: '聊天',
      title: '社区助手',
      placeholder: '请输入您的问题...',
      send: '发送',
      welcome: '您好，请问有什么可以帮您？',
      thinking: '思考中...',
      report: '反馈',
      error: '抱歉，我不太理解您的问题。您可以尝试询问活动、设施、服务或志愿者报名相关内容。',
      thankFeedback: '感谢您的反馈',
      quickReply: {
        announcement: '社区公告',
        facilities: '社区设施',
        services: '本地服务',
        events: '社区活动',
        volunteer: '志愿者',
        faq: '常见问题'
      },
      replies: {
        announcement: "最新社区公告：\n\n• 7月30日 - 暴雨预警（下午2点-8点）\n• 8月24日 - 供水暂停（上午9点-下午4点）\n• 8月15日 - 年度居民大会\n\n打开「社区公告」页面可查看全部分类和完整详情。",
        greeting: "您好！我可以为您解答社区活动、设施、本地服务、志愿者报名、常见问题等相关问题。",
        events: "近期社区活动：\n\n• 8月1日 - 植树节活动\n• 8月9日 - 社区清洁日\n• 8月22日 - 欢乐跑活动\n\n打开「活动日历」页面可查看完整详情和报名信息。",
        volunteer: "您可以在志愿者报名页面完成登记。目前开放3个活动岗位：植树节、社区清洁日、欢乐跑工作人员。点击志愿者板块的「立即报名」即可填写表单。",
        facilities: "打开「设施地图」可查看全部公共设施位置，包含健身房、游泳池、儿童游乐场、社区会所等11个点位，也可通过顶部搜索栏查找特定设施。",
        faq: "常见问题板块包含会员权益、设施预约、社区守则、报修流程等解答，也可以通过顶部搜索栏快速查找对应内容。",
        services: "本地服务目录收录了水管工、电工、空调维修、木工、保洁等8类可信服务商联系方式，打开目录可查看完整电话和邮箱。",
        thank: "不客气！如有其他问题随时问我。",
        contact: "您可以通过 +60 10-557 0900 或 myceliumresidence07@gmail.com 联系社区管理处，办公时间为工作日上午9点至下午6点。"
      }
    },
    report: {
      title: '提交反馈',
      name: '名字',
      surname: '姓氏',
      contactNumber: '联系电话',
      email: '电子邮箱',
      address: '居住地址',
      message: '留言内容',
      subscribe: '我希望接收活动最新资讯',
      submit: '提交',
      successAlert: '感谢您的反馈！我们已收到您的报告，将在48小时内回复。',
      errorAlert: '抱歉，提交反馈时出错了。请重试或直接发送邮件给我们。'
    },
    slider: {
      announcement: { title: '社区公告', desc: '获取社区最新新闻、通知及重要公告', btn: '立即查看！' },
      facilities: { title: '社区设施', desc: '探索社区设施，包括健身房、游乐场、游泳池等', btn: '立即查看！' },
      services: { title: '本地服务目录', desc: '寻找值得信赖的本地服务，例如水管工、电工、清洁人员及技术人员', btn: '立即联系！' },
      events: { title: '社区活动', desc: '了解您附近即将举行的社区活动、庆典及各类精彩活动', btn: '立即查看！' },
      volunteer: { title: '志愿者报名', desc: '加入我们的志愿者团队，为社区带来积极影响', btn: '立即报名！' },
      faq: { title: '常见问题', desc: '快速查找有关社区服务及设施的常见问题解答', btn: '立即查看！' }
    },
    mapPins: {
      tennis: { name: '网球场', desc: '位于社区入口附近，紧邻前排住宅的标准网球场。' },
      clubhouse: { name: '社区会所', desc: '社区核心建筑，毗邻泳池平台与开放草坪，位于社区中心位置。' },
      pool: { name: '主游泳池', desc: '社区中心泳池，配备日光浴平台、躺椅与遮阳伞，紧邻会所。' },
      playground: { name: '儿童游乐场', desc: '沙质地面游乐区，配备滑梯等设施，位于会所正后方。' },
      park: { name: '社区公园', desc: '开阔的绿色草坪与环形步道，位于社区东侧。' },
      parking: { name: '访客停车场', desc: '划线标准停车场，供居民与访客使用，位于会所南侧。' },
      basketball: { name: '篮球场', desc: '位于西南角住宅附近的标准篮球场。' },
      gym: { name: '健身房', desc: '篮球场旁的灰色屋顶建筑，用作社区健身中心。' },
      pond: { name: '景观池塘', desc: '社区东南侧的自然景观池塘，周边绿树环绕。' },
      recycle1: { name: '垃圾分类点', desc: '访客停车场附近的垃圾分类回收点。' },
      recycle2: { name: '垃圾分类点', desc: '后排住宅附近的垃圾分类回收点。' }
    },
    features: {
      tooltip: "点击了解更多",
      smart: { title: "智能设施", desc: "体验现代化社区设施与服务，提升日常社区生活品质。" },
      safety: { title: "社区安全", desc: "打造更安全、更紧密的社区环境。" },
      green: { title: "绿色生活", desc: "倡导清洁、健康及可持续发展的生活环境。" },
      connect: { title: "联系我们", desc: "分享您的想法、意见反馈，并与社区保持联系。", tooltip: "点击联系我们" }
    },
    footer: {
      tagline: '赋能健康 丰富生活',
      desc: '为所有居民打造更加智能、绿色且紧密相连的社区。',
      quickLinks: '快速链接',
      linkAnnouncement: '社区公告',
      linkMap: '设施地图',
      linkService: '服务目录',
      linkEvent: '活动日历',
      linkVolunteer: '志愿者',
      linkFaq: '常见问题',
      contactTitle: '联系我们',
      contactAddr: '📍 管理办公室，会所一楼',
      contactPhone: '📞 +6010-5570900',
      contactEmail: '✉ myceliumresidence07@gmail.com',
      contactHour: '🕘 周一至周五：上午 9:00 – 下午 6:00',
      newsletterTitle: '社区通讯',
      newsletterDesc: '订阅每周社区最新动态及活动通知。',
      newsletterBtn: '订阅',
      newsletterPlaceholder: '输入您的电子邮箱地址',
      copyright: '© 2026 MYCELIUM 智慧社区。版权所有。',
      privacy: '隐私政策',
      terms: '服务条款',
      rules: '社区守则'
    }
  },

  ms: {
    nav: {
      announcement: 'PENGUMUMAN',
      facilities: 'KEMUDAHAN',
      services: 'DIREKTORI PERKHIDMATAN',
      events: 'ACARA',
      volunteer: 'PENDAFTARAN SUKARELAWAN',
      faq: 'SOALAN LAZIM',
      searchPlaceholder: 'Cari .....'
    },
    common: {
      close: 'Tutup',
      submit: 'Hantar',
      backToTop: 'Kembali ke Atas',
      readMore: 'Baca Lagi',
      all: 'Semua',
      searchNoResult: 'Tiada padanan ditemui, sila cuba kata kunci lain'
    },
    announcement: {
      title: 'Pengumuman Komuniti',
      subtitle: 'Ikuti berita dan notis terkini daripada komuniti anda',
      tabAll: 'Semua',
      tabEmergency: 'Kecemasan',
      tabMaintenance: 'Penyelenggaraan',
      tabCommunity: 'Komuniti',
      tabEvents: 'Acara'
    },
    map: {
      title: 'Peta Kemudahan Komuniti',
      hint: 'Klik pin untuk melihat butiran kemudahan'
    },
    calendar: {
      title: 'Kalendar Acara Komuniti',
      hint: 'Klik tarikh berbintang untuk melihat butiran acara',
      prev: '‹',
      next: '›'
    },
    service: {
      title: 'Direktori Perkhidmatan Tempatan',
      phone: 'Telefon',
      email: 'E-mel'
    },
    volunteer: {
      kicker: 'Sertai',
      title: 'Pendaftaran Sukarelawan',
      subtitle: 'Sertai pasukan sukarelawan kami dan berikan impak positif kepada komuniti',
      registerNow: 'Daftar Sekarang',
      formTitle: 'Borang Pendaftaran Sukarelawan',
      fullName: 'Nama Penuh',
      phone: 'No. Telefon',
      address: 'Alamat Rumah',
      notes: 'Catatan / Keperluan (pilihan)',
      submitBtn: 'Hantar Pendaftaran',
      submitting: 'Menghantar...',
      requiredTip: 'Sila isi nama, telefon dan pilih aktiviti.',
      successTip: 'Terima kasih! Pendaftaran anda telah dihantar. Kami akan menghubungi anda tidak lama lagi.',
      errorTip: 'Penghantaran gagal, sila semak rangkaian dan cuba lagi.',
      card1: {
        title: 'Hari Menanam Pokok',
        date: '1 Ogos 2026 · 8:00 PG · Taman Komuniti',
        desc: 'Bantu mempercantik kejiranan dan meningkatkan kesedaran alam sekitar dengan menanam pokok di seluruh komuniti.',
        bring: 'Perlu dibawa: Sarung tangan berkebun, penyodok kecil, botol air boleh guna semula',
        btn: 'Daftar Sekarang'
      },
      card2: {
        title: 'Hari Pembersihan Komuniti',
        date: '9 Ogos 2026 · 9:00 PG · Tempat Letak Kereta Tetamu',
        desc: 'Sertai aktiviti bersih sambil berjalan mengelilingi kolam dan taman untuk memastikan komuniti kita bersih dan hijau.',
        bring: 'Perlu dibawa: Sarung tangan, pelitup muka, penyepit sampah (beg sampah disediakan)',
        btn: 'Daftar Sekarang'
      },
      card3: {
        title: 'Maraton Fun Run',
        date: '22 Ogos 2026 · 7:00 PG · Taman Komuniti',
        desc: 'Bantu pelari sepanjang laluan sebagai marshal, membimbing arah dan mengagihkan minuman.',
        bring: 'Perlu dibawa: Kasut selesa, topi, botol air boleh guna semula',
        btn: 'Daftar Sekarang'
      }
    },
    faq: { title: 'Soalan Lazim' },
    chatbot: {
      open: 'Bual',
      title: 'Pembantu Komuniti',
      placeholder: 'Taip mesej anda...',
      send: 'Hantar',
      welcome: 'Hai, apa yang boleh saya bantu hari ini?',
      thinking: 'Fikir...',
      report: 'Maklum Balas',
      error: 'Maaf, saya tidak begitu faham. Anda boleh cuba tanya tentang acara, kemudahan, perkhidmatan atau pendaftaran sukarelawan.',
      thankFeedback: 'Terima kasih atas maklum balas anda'
    },
    report: {
      title: 'Hantar Maklum Balas',
      name: 'Nama Pertama',
      surname: 'Nama Keluarga',
      contactNumber: 'No. Telefon',
      email: 'Alamat E-mel',
      address: 'Alamat Rumah',
      message: 'Tulis Mesej Anda',
      subscribe: 'Saya ingin menerima kemas kini tentang kempen',
      submit: 'Hantar',
      successAlert: 'Terima kasih atas maklum balas anda! Kami telah menerima laporan anda dan akan menjawab dalam masa 48 jam.',
      errorAlert: 'Maaf, terdapat ralat semasa menghantar maklum balas anda.'
    },
    footer: {
      tagline: 'MEMPERKASA KESIHATAN MEMPERKAYA KEHIDUPAN',
      desc: 'Membina komuniti yang lebih pintar, hijau dan saling berhubung untuk semua penduduk.',
      quickLinks: 'Pautan Pantas',
      contactTitle: 'Hubungi Kami',
      newsletterTitle: 'Buletin',
      newsletterBtn: 'Langgan',
      newsletterPlaceholder: 'Masukkan alamat e-mel anda',
      copyright: '© 2026 Komuniti Pintar MYCELIUM. Hak cipta terpelihara.'
    }
  },

  ta: {
    nav: {
      announcement: 'அறிவிப்பு',
      facilities: 'வசதிகள்',
      services: 'உள்ளூர் சேவை அடைவு',
      events: 'நிகழ்வுகள்',
      volunteer: 'தொண்டு பதிவு',
      faq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
      searchPlaceholder: 'தேடு .....'
    },
    common: {
      close: 'மூடு',
      submit: 'சமர்ப்பிக்கவும்',
      backToTop: 'மேலே செல்',
      readMore: 'மேலும் வாசிக்க',
      all: 'அனைத்தும்',
      searchNoResult: 'பொருத்தமான பிரிவு கிடைக்கவில்லை, வேறு சொல்லை முயற்சிக்கவும்'
    },
    announcement: {
      title: 'சமூக அறிவிப்புகள்',
      subtitle: 'உங்கள் சமூகத்தின் சமீபத்திய செய்திகள் மற்றும் அறிவிப்புகளை அறிந்து கொள்ளுங்கள்'
    },
    map: { title: 'சமூக வசதி வரைபடம்', hint: 'வசதி விவரங்களைக் காண முள்ளைக் கிளிக் செய்யவும்' },
    calendar: { title: 'சமூக நிகழ்வு நாட்காட்டி', hint: 'நிகழ்வு விவரங்களைக் காண நட்சத்திர தேதியைக் கிளிக் செய்யவும்' },
    service: { title: 'உள்ளூர் சேவை அடைவு', phone: 'தொலைபேசி', email: 'மின்னஞ்சல்' },
    volunteer: {
      kicker: 'பங்கேற்கவும்',
      registerNow: 'இப்போதே பதிவு செய்யவும்',
      formTitle: 'தொண்டு பதிவு படிவம்',
      fullName: 'முழு பெயர்',
      phone: 'தொலைபேசி எண்',
      address: 'வீட்டு முகவரி',
      notes: 'குறிப்புகள் / தேவைகள் (விரும்பினால்)',
      submitBtn: 'பதிவை சமர்ப்பிக்கவும்',
      submitting: 'அனுப்புகிறது...',
      requiredTip: 'தயவுசெய்து உங்கள் பெயர், தொலைபேசி எண்ணை நிரப்பி நடவடிக்கையைத் தேர்ந்தெடுக்கவும்.',
      successTip: 'நன்றி! உங்கள் பதிவு சமர்ப்பிக்கப்பட்டது.',
      errorTip: 'சமர்ப்பிப்பது தோல்வியடைந்தது.'
    },
    faq: { title: 'அடிக்கடி கேட்கப்படும் கேள்விகள்' },
    chatbot: { open: 'பேச்சு', title: 'சமூக உதவியாளர்', placeholder: 'உங்கள் செய்தியை உள்ளிடவும்...', send: 'அனுப்பவும்', welcome: 'வணக்கம், இன்று என்ன உதவி செய்யலாம்?' },
    report: { title: 'கருத்தை சமர்ப்பிக்கவும்', submit: 'சமர்ப்பிக்கவும்' },
    footer: { tagline: 'ஆரோக்கியத்தை மேம்படுத்தி வாழ்க்கையை வளப்படுத்துகிறோம்', copyright: '© 2026 MYCELIUM ஸ்மார்ட் சமூகம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டுள்ளன.' }
  }
};

// 合并西班牙语支持
function mergeLocale(base, translated) {
  const merged = { ...base };
  Object.entries(translated).forEach(([key, value]) => {
    merged[key] = value && typeof value === "object" && !Array.isArray(value)
      ? mergeLocale(base?.[key] && typeof base[key] === "object" ? base[key] : {}, value)
      : value;
  });
  return merged;
}

i18n.es = mergeLocale(i18n.en, {
  nav: { announcement: "ANUNCIOS", facilities: "INSTALACIONES", services: "DIRECTORIO DE SERVICIOS", events: "EVENTOS", volunteer: "INSCRIPCIÓN DE VOLUNTARIOS", faq: "PREGUNTAS FRECUENTES", searchPlaceholder: "Buscar..." },
  common: { close: "Cerrar", submit: "Enviar", backToTop: "Volver arriba", readMore: "Leer más", all: "Todos", searchNoResult: "No se encontraron secciones. Prueba con otra búsqueda." },
  announcement: { title: "Anuncios de la comunidad", subtitle: "Mantente al día con las noticias y avisos de tu comunidad.", tabAll: "Todos", tabEmergency: "Emergencias", tabMaintenance: "Mantenimiento", tabCommunity: "Comunidad", tabEvents: "Eventos" },
  map: { title: "Mapa de instalaciones", hint: "Selecciona un marcador para ver los detalles." },
  calendar: { title: "Calendario de eventos", hint: "Selecciona una fecha marcada para consultar el evento.", prev: "‹", next: "›" },
  service: { title: "Directorio de servicios", phone: "Teléfono", email: "Correo electrónico" },
  volunteer: {
    kicker: "Participa", title: "Inscripción de voluntarios", subtitle: "Únete al equipo de voluntariado y contribuye a la comunidad.", registerNow: "Inscribirme", formTitle: "Formulario de voluntariado", fullName: "Nombre completo", phone: "Número de teléfono", address: "Dirección", namePlaceholder: "Nombre y apellidos", addressPlaceholder: "Calle, número, ciudad y código postal", notesPlaceholder: "Por ejemplo: restricciones alimentarias o necesidades de accesibilidad", activityLabel: "Actividad:", notes: "Requisitos o notas (opcional)", submitBtn: "Enviar inscripción", submitting: "Enviando...", requiredTip: "Indica tu nombre, teléfono y selecciona una actividad.", successTip: "¡Gracias! Recibimos tu inscripción y nos pondremos en contacto pronto.", errorTip: "No se pudo enviar la inscripción. Comprueba tu conexión e inténtalo de nuevo."
  },
  faq: { title: "Preguntas frecuentes" },
  chatbot: { open: "Chat", title: "Asistente comunitario", placeholder: "Escribe un mensaje...", send: "Enviar", welcome: "Hola. ¿En qué puedo ayudarte?" }
});

// 统一英雄区域文案
i18n.en.heroIntro = { description: "A gated residential community built for wellness, safety and connection.", explore: "EXPLORE THE COMMUNITY", chooseLocation: "CHOOSE YOUR LOCATION" };
i18n.es.heroIntro = { description: "Una comunidad residencial privada diseñada para el bienestar, la seguridad y la conexión.", explore: "EXPLORAR LA COMUNIDAD", chooseLocation: "ELIGE TU UBICACIÓN" };
i18n["zh-CN"].heroIntro = { description: "一个以身心健康、安全与联结为核心的封闭式住宅社区。", explore: "探索社区", chooseLocation: "选择所在地区" };
i18n.ms.heroIntro = { description: "Komuniti kediaman berpagar yang dibina demi kesejahteraan, keselamatan dan hubungan erat.", explore: "TEROKAI KOMUNITI", chooseLocation: "PILIH LOKASI ANDA" };
i18n.ta.heroIntro = { description: "நல்வாழ்வு, பாதுகாப்பு மற்றும் சமூகத் தொடர்பை மையமாகக் கொண்டு உருவாக்கப்பட்ட பாதுகாப்பான குடியிருப்பு சமூகம்.", explore: "சமூகத்தை ஆராயுங்கள்", chooseLocation: "உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்" };

i18n.en.newsletter = { invalidEmail: "Please enter a valid email address.", submitting: "Submitting...", success: "Subscription successful! Thank you for subscribing.", failure: "Subscription failed, please try again later." };
i18n["zh-CN"].newsletter = { invalidEmail: "请输入有效的电子邮箱地址。", submitting: "正在提交…", success: "订阅成功！感谢您的订阅。", failure: "订阅失败，请稍后重试。" };
i18n.ms.newsletter = { invalidEmail: "Sila masukkan alamat e-mel yang sah.", submitting: "Sedang menghantar...", success: "Langganan berjaya! Terima kasih.", failure: "Langganan gagal. Sila cuba lagi kemudian." };
i18n.ta.newsletter = { invalidEmail: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.", submitting: "சமர்ப்பிக்கிறது...", success: "சந்தா வெற்றிகரமாக பதிவு செய்யப்பட்டது. நன்றி!", failure: "சந்தா பதிவு தோல்வியடைந்தது. பின்னர் மீண்டும் முயற்சிக்கவும்." };

function t(key) {
  return key.split('.').reduce((obj, k) => obj?.[k], i18n[currentLang]) || key;
}
window.t = t;

function setLanguage(langCode) {
  if (!i18n[langCode]) langCode = DEFAULT_LANG;
  const siteConfig = window.MYCELIUM_COUNTRY_CONFIG;
  if (siteConfig?.languages && !siteConfig.languages.includes(langCode)) langCode = siteConfig.languages[0] || DEFAULT_LANG;
  
  currentLang = langCode;
  window.currentLang = langCode;
  localStorage.setItem(STORAGE_KEY, langCode);
  document.documentElement.lang = langCode;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  const currentLangText = document.getElementById('currentLangText');
  if (currentLangText) {
    currentLangText.textContent = LANG_LABELS[langCode];
  }
  const languageIcon = document.querySelector('.lang-icon');
  if (languageIcon) languageIcon.textContent = ({ en: 'EN', es: 'ES', 'zh-CN': 'ZH', ms: 'MS', ta: 'TA' })[langCode] || 'EN';

  document.querySelectorAll('.lang-item').forEach(item => {
    const available = !siteConfig?.languages || siteConfig.languages.includes(item.dataset.lang);
    item.hidden = !available;
    item.classList.toggle('active', item.dataset.lang === langCode);
  });

  if (typeof renderFAQItems === 'function') renderFAQItems();
  if (typeof renderServiceCards === 'function') renderServiceCards();
  if (typeof renderAnnouncementList === 'function') renderAnnouncementList('all');
  if (typeof buildCalendar === 'function') buildCalendar();
  if (typeof updateMapPinsLanguage === 'function') updateMapPinsLanguage(); 
  window.dispatchEvent(new CustomEvent('mycelium:languagechange', { detail: langCode }));
}

// 兼容判断：只要是槟城或默认马来西亚，均使用内置点位
function isDefaultMalaysia(code) {
  const c = String(code || "").toUpperCase();
  return c === "MY" || c === "MY_PP";
}

// ---- Facility photos shown in the map info card -------------------------------------------
// Files live in img/Facilities/ (see the README there). The extension is probed: .jpg, .webp, .png.
const FACILITY_PIN_PHOTOS = {
  basketball: "basketball-court", tennis: "tennis-court", gym: "gym", pool: "swimming-pool",
  playground: "playground", clubhouse: "clubhouse", park: "community-park", parking: "guest-parking",
  recycle1: "recycling-point", recycle2: "recycling-point", pond: "pond",
};
let facilityPhotoToken = 0;
function facilityPhotoBase(pin) {
  if (!pin) return "";
  if (pin.dataset.photo) return pin.dataset.photo;

  const file = FACILITY_PIN_PHOTOS[pin.dataset.pinId];
  return file ? `/img/Facilities/${file}` : "";
}
function showFacilityPhoto(base, label) {
  const wrap = document.getElementById("mapInfoPhoto");
  const img = wrap?.querySelector("img");
  if (!wrap || !img) return;
  const token = ++facilityPhotoToken;
  wrap.classList.remove("has-photo");
  img.removeAttribute("src");
  img.alt = label || "";
  if (!base) return;
  const extensions = /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(base) ? [""] : [".jpg", ".jpeg", ".webp", ".png", ".avif"];
  let attempt = 0;
  const tryNext = () => {
    if (token !== facilityPhotoToken || attempt >= extensions.length) return;
    img.onload = () => { if (token === facilityPhotoToken) wrap.classList.add("has-photo"); };
    img.onerror = () => { attempt += 1; tryNext(); };
    img.src = base + extensions[attempt];
  };
  tryNext();
}

function updateMapPinsLanguage() {
  if (window.MYCELIUM_COUNTRY_CONFIG?.mapPins) return;
  const pins = document.querySelectorAll("#mapOverlay .pin");
  const mapInfoTitle = document.getElementById("mapInfoTitle");
  const mapInfoDesc = document.getElementById("mapInfoDesc");
  const pinData = i18n[currentLang]?.mapPins;
  if (!pinData) return;

  pins.forEach(pin => {
    pin.hidden = false;
    pin.style.display = "";
    const pinId = pin.dataset.pinId;
    if (!pinId || !pinData[pinId]) return;
    
    pin.dataset.name = pinData[pinId].name;
    pin.dataset.desc = pinData[pinId].desc;
    pin.setAttribute("aria-label", pinData[pinId].name);

    if (pin.classList.contains("active")) {
      if (mapInfoTitle) mapInfoTitle.textContent = pinData[pinId].name;
      if (mapInfoDesc) mapInfoDesc.textContent = pinData[pinId].desc;
    }
  });
}

function initLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const targetLang = saved && i18n[saved] ? saved : DEFAULT_LANG;
  setLanguage(targetLang);

  const langToggleBtn = document.getElementById('langToggleBtn');
  const langPanel = document.getElementById('langPanel');
  
  if (langToggleBtn && langPanel) {
    langToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langPanel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!langPanel.contains(e.target) && e.target !== langToggleBtn) {
        langPanel.classList.remove('active');
      }
    });

    document.querySelectorAll('.lang-item').forEach(item => {
      item.addEventListener('click', () => {
        setLanguage(item.dataset.lang);
        langPanel.classList.remove('active');
      });
    });
  }
}

const wrapper = document.querySelector(".sliderWrapper");
const menuItems = document.querySelectorAll(".menuItem");

(function initLoadingScreen() {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    const langSwitcher = document.querySelector('.lang-switcher-wrap');
    if (langSwitcher) requestAnimationFrame(() => langSwitcher.classList.add('show'));
  }, { once: true });
})();

function scrollPageToElement(element, options = {}) {
  if (!element) return;
  if (window.MYCELIUM_LENIS) {
    window.MYCELIUM_LENIS.scrollTo(element, { offset: options.block === "nearest" ? -16 : -8, duration: 0.9 });
    return;
  }
  element.scrollIntoView(options);
}

function getSliderCenterTarget() {
  const slider = document.querySelector('.slider');
  if (!slider) return 0;
  const sliderTopToPage = slider.getBoundingClientRect().top + window.scrollY;
  const sliderHeight = slider.offsetHeight;
  const viewportHeight = window.innerHeight;
  return Math.max(0, sliderTopToPage + (sliderHeight / 2) - (viewportHeight / 2));
}

function scrollToSlider() {
  const targetScroll = getSliderCenterTarget();
  if (window.MYCELIUM_LENIS) window.MYCELIUM_LENIS.scrollTo(targetScroll, { duration: 0.9 });
  else window.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

function scrollToNav() {
  scrollToSlider();
}
window.scrollToNav = scrollToNav;

function initApp() {
  initLanguage();
  const activeCountryCode = window.MYCELIUM_COUNTRY || "MY_PP";
  let regionServices = null;
  let regionFaqs = null;
  let regionFacilities = [];
  let regionEvents = [];

// =========================================================================
  // 导航栏滚动收缩（Shrink on Scroll）核心监听
  // =========================================================================
  const navEl = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const sliderEl = document.querySelector(".slider");

  if (navEl) {
    // 移动端汉堡菜单切换
    if (navToggle) {
      navToggle.addEventListener("click", () => {
        const open = !navEl.classList.contains("nav-open");
        navEl.classList.toggle("nav-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
      });
    }

    // 滚动收缩阈值计算函数
    const handleNavShrinkOnScroll = () => {
      if (!sliderEl) {
        navEl.classList.toggle("is-shrunk", window.scrollY > 100);
        return;
      }

      // 获取 slider（menuitem屏）顶部相对于视口的距离
      const sliderRect = sliderEl.getBoundingClientRect();
      
      // 当 slider 的上半部分已经被向上滚出视口（用户深入下方内容）时触发收缩
      // 当用户滚回 slider 时，自动恢复完整尺寸
      const shouldShrink = sliderRect.top < -80;
      navEl.classList.toggle("is-shrunk", shouldShrink);
      syncLocationButtonMode();
    };

    // While the nav is condensed, the city button is only an information label.
    const locationSwitcher = document.getElementById("countrySwitcher");
    const syncLocationButtonMode = () => {
      if (!locationSwitcher) return;
      const condensed = navEl.classList.contains("is-shrunk");
      locationSwitcher.setAttribute("aria-disabled", String(condensed));
      if (condensed) locationSwitcher.title = "Scroll up to change location";
      else locationSwitcher.removeAttribute("title");
    };
    // Capture phase: runs before country-selector.js opens the picker. In the condensed state a click
    // only scrolls back up until the full nav (with the real "choose location" button) is restored.
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest && event.target.closest("#countrySwitcher");
      if (!trigger || !navEl.classList.contains("is-shrunk")) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof window.scrollToNav === "function") window.scrollToNav();
    }, true);

    window.addEventListener("scroll", handleNavShrinkOnScroll, { passive: true });
    window.addEventListener("resize", handleNavShrinkOnScroll, { passive: true });
    // 初始化执行一次，防止刷新在页面中段
    handleNavShrinkOnScroll();
  }
  // 苹果风格平滑展开搜索栏交互
  const searchContainer = document.getElementById("navSearchContainer");
  const searchTriggerBtn = document.getElementById("searchTriggerBtn");
  const searchCloseBtn = document.getElementById("searchCloseBtn");
  const customSearchImg = document.getElementById("customSearchImg");

  if (customSearchImg && customSearchImg.getAttribute("src") && customSearchImg.getAttribute("src").trim() !== "") {
    customSearchImg.style.display = "block";
    const svg = searchTriggerBtn?.querySelector(".search-icon-svg");
    if (svg) svg.style.display = "none";
  }

  if (searchTriggerBtn && searchContainer) {
    searchTriggerBtn.addEventListener("click", () => {
      const isActive = searchContainer.classList.toggle("is-active");
      searchTriggerBtn.setAttribute("aria-expanded", String(isActive));
      if (isActive) {
        setTimeout(() => searchInput?.focus(), 150);
      }
    });

    searchCloseBtn?.addEventListener("click", () => {
      searchContainer.classList.remove("is-active");
      searchTriggerBtn.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (e) => {
      if (!searchContainer.contains(e.target)) {
        searchContainer.classList.remove("is-active");
        searchTriggerBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchContainer.classList.contains("is-active")) {
        searchContainer.classList.remove("is-active");
        searchTriggerBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  const products = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
  let currentIndex = 0;
  const total = products.length;

  document.querySelectorAll(".hero-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.index);
      if (menuItems[index]) menuItems[index].click();
    });
  });

  menuItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      currentIndex = index;
      if (navEl) {
        navEl.classList.remove("nav-open");
        if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      }
      wrapper.style.transform = `translateX(${-100 * index}vw)`;
      updateActiveMenuItem(index);
      closeAllSections();
      scrollToSlider();
    });
  });
    
  const mapOverlay = document.getElementById("mapOverlay");
  const openMapBtn = document.getElementById("openMapBtn");
  const mapCloseBtn = document.getElementById("mapCloseBtn");
  const mapPins = document.querySelectorAll("#mapOverlay .pin");
  const mapInfoBox = document.getElementById("mapInfoBox");
  const mapInfoTitle = document.getElementById("mapInfoTitle");
  const mapInfoDesc = document.getElementById("mapInfoDesc");

  mapPins.forEach((pin) => {
    pin.setAttribute("aria-pressed", pin.classList.contains("active") ? "true" : "false");
    if (pin.dataset.name) pin.setAttribute("aria-label", pin.dataset.name);
  });

  const setMapOpen = (isOpen) => {
    document.body.classList.toggle("show-map", isOpen);
    if (mapOverlay) mapOverlay.setAttribute("aria-hidden", String(!isOpen));
    if (!isOpen && mapInfoBox) mapInfoBox.classList.remove("is-visible");

    if (isOpen && mapOverlay) {
      scrollPageToElement(mapOverlay, { behavior: "smooth", block: "start" });
      mapCloseBtn?.focus({ preventScroll: true });
    } else if (!isOpen) {
      openMapBtn?.focus({ preventScroll: true });
    }
  };

  if (openMapBtn && mapOverlay && mapCloseBtn) {
    openMapBtn.addEventListener("click", () => {
      setMapOpen(true);
      setCalendarOpen(false);
    });
    mapCloseBtn.addEventListener("click", () => setMapOpen(false));
  }
  
  document
    .querySelectorAll(".slider .buyButton, .slider .buyButton3, .slider .buyButton5, .slider .buyButton6")
    .forEach((btn) => {
      btn.addEventListener("click", () => setMapOpen(false));
    });

  const announcementOverlay = document.getElementById("announcementOverlay");
  const openAnnouncementBtn = document.getElementById("openAnnouncementBtn");
  const announcementCloseBtn = document.getElementById("announcementCloseBtn");
  const announcementListEl = document.querySelector(".announcementList");

  let announcementData = [];

  // Data lives at countries/{CC}/cities/{CITY}/{collection} (see region-paths.js).
  const REGION = window.MYCELIUM_REGION_PATHS;
  const isMalaysiaSite = String(activeCountryCode).toUpperCase().startsWith("MY");
  function locationCollection(collectionName) {
    return REGION.ref(window.db, activeCountryCode, collectionName);
  }

  async function loadRegionalDirectoryContent() {
    if (isDefaultMalaysia(activeCountryCode)) return;
    // Pins come from the site config, so they appear even if the database is empty or unreachable.
    applyRegionalMapFacilities([]);
    try {
      const database = window.db;
      const [serviceSnapshot, faqSnapshot, facilitySnapshot, eventSnapshot, communityRulesDoc] = await Promise.all([
        REGION.readCollection(database, activeCountryCode, "services"),
        REGION.readCollection(database, activeCountryCode, "faqs"),
        REGION.readCollection(database, activeCountryCode, "facilities"),
        REGION.readCollection(database, activeCountryCode, "events"),
        REGION.readDoc(database, activeCountryCode, "rules", "community"),
      ]);
      regionServices = serviceSnapshot.docs.map(doc => doc.data());
      regionFaqs = faqSnapshot.docs.map(doc => doc.data());
      regionFacilities = facilitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      regionEvents = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      window.MYCELIUM_REGION_RULES = communityRulesDoc.exists ? communityRulesDoc.data() : null;
      renderServiceCards();
      renderFAQItems();
      applyRegionalMapFacilities(regionFacilities);
      renderRegionalVolunteerCards();
    } catch (error) {
      console.error(`[${activeCountryCode}] regional directory could not load:`, error);
    }
  }

  // Built-in labels so every Portland pin works even before its Firestore document exists.
  const REGIONAL_PIN_FALLBACK = {
    "community-garden": { name_en: "Community Garden", description_en: "Raised beds, shared tools and a seasonal planting calendar." },
    "fitness-center": { name_en: "Fitness Center", description_en: "Cardio, free weights and a stretching area." },
    "coworking-lounge": { name_en: "Co-working Lounge", description_en: "Quiet desks, fast Wi-Fi and two bookable meeting rooms." },
    "bike-hub": { name_en: "Bike Hub", description_en: "Secure bike storage, a repair stand and an air pump." },
    "ev-charging": { name_en: "EV Charging Stations", description_en: "Level 2 chargers in the visitor and resident parking areas." },
    "recycling-compost": { name_en: "Recycling & Compost Center", description_en: "Sorted bins for recycling, food scraps and glass." },
    "walking-trail": { name_en: "Woodland Walking Trail", description_en: "A loop through native plantings with benches along the way." },
    clubhouse: { name_en: "Clubhouse", description_en: "Shared kitchen, lounge and event hall for resident gatherings." },
  };

  function applyRegionalMapFacilities(facilities) {
    const positions = window.MYCELIUM_COUNTRY_CONFIG?.mapPins;
    // Sites without a custom site plan (e.g. Johor Bahru) use the default pins.
    if (!positions) {
      document.querySelectorAll("#mapOverlay .pin").forEach((pin) => {
        pin.hidden = false;
        pin.style.display = "";
      });
      updateMapPinsLanguage();
      return;
    }

    const assignments = {
      "community-garden": ["basketball", "communityGarden"],
      "fitness-center": ["gym", "fitnessCenter"],
      "coworking-lounge": ["pool", "coWorkingLounge"],
      "bike-hub": ["tennis", "bikeHub"],
      "ev-charging": ["parking", "evCharging"],
      "recycling-compost": ["recycle2", "recyclingCompost"],
      "walking-trail": ["park", "walkingTrail"],
      clubhouse: ["clubhouse", "clubhouse"],
    };
    const byId = new Map((facilities || []).map((facility) => [facility.id, facility]));
    const visibleIds = new Set();
    Object.entries(assignments).forEach(([facilityId, [pinId, positionKey]]) => {
      const position = positions[positionKey];
      const pin = document.querySelector(`#mapOverlay .pin[data-pin-id="${pinId}"]`);
      if (!pin || !position) return;
      const facility = { ...(REGIONAL_PIN_FALLBACK[facilityId] || {}), ...(byId.get(facilityId) || {}) };
      visibleIds.add(pinId);
      pin.hidden = false;
      pin.style.display = "";
      pin.style.left = `${position.x}%`;
      pin.style.top = `${position.y}%`;
      pin.dataset.name = facility[`name_${currentLang}`] || facility.name_en || facilityId;
      pin.dataset.desc = facility[`description_${currentLang}`] || facility.description_en || "";
      pin.dataset.photo = facility.photoUrl || `./img/Facilities/${facilityId}`;
      pin.setAttribute("aria-label", pin.dataset.name);
    });
    document.querySelectorAll("#mapOverlay .pin").forEach((pin) => {
      pin.hidden = !visibleIds.has(pin.dataset.pinId);
      pin.style.display = pin.hidden ? "none" : "";
    });
  }

  window.addEventListener("mycelium:languagechange", () => {
    renderServiceCards();
    renderFAQItems();
    if (!isDefaultMalaysia(activeCountryCode)) {
      if (regionFacilities.length) applyRegionalMapFacilities(regionFacilities);
      if (regionEvents.length) renderRegionalVolunteerCards();
    } else {
      updateMapPinsLanguage();
    }
  });

  function renderRegionalVolunteerCards() {
    if (isDefaultMalaysia(activeCountryCode) || !regionEvents.length) return;
    const locale = ({ en: "en-US", es: "es-US", "zh-CN": "zh-CN" })[currentLang] || "en-US";
    const bringText = {
      en: "See the event details and contact management if you need accommodations.",
      es: "Consulta los detalles del evento y contacta con la administración si necesitas apoyo.",
      "zh-CN": "请查看活动详情；如需协助，请联系物业办公室。",
    }[currentLang] || "See the event details and contact management if you need accommodations.";
    document.querySelectorAll(".volunteerCard").forEach((card, index) => {
      const event = regionEvents[index];
      if (!event) { card.hidden = true; return; }
      card.hidden = false;
      const title = event[`title_${currentLang}`] || event.title_en || event.id;
      const description = event[`description_${currentLang}`] || event.description_en || "";
      const [year, month, day] = String(event.date || "").split("-").map(Number);
      const parsedDate = year && month && day ? new Date(year, month - 1, day, 12) : null;
      const dateText = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(parsedDate)
        : event.date || "";
      card.querySelector(".volunteerCardTitle").textContent = title;
      card.querySelector(".volunteerCardDate").textContent = `${dateText} · Portland`;
      card.querySelector(".volunteerCardDesc").textContent = description;
      card.querySelector(".volunteerCardBring").textContent = bringText;
      const button = card.querySelector(".volunteerRegisterBtn");
      button.dataset.activity = title;
      button.textContent = t("volunteer.registerNow");
      card.querySelector(".volunteerImg").alt = title;
    });
  }

  async function loadAnnouncementsFromFirebase() {
    try {
      const snapshot = await REGION.readCollection(window.db, activeCountryCode, "announcements");
      announcementData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          // The city path already scopes the records. Only the OLD shared root collection needs filtering.
          if (!snapshot.legacy || !isDefaultMalaysia(activeCountryCode)) return true;
          const itemCode = String(item.countryCode || "").toUpperCase();
          return !itemCode || itemCode === "MY" || itemCode === "MY_PP";
        })
        .filter(item => item.isPublished !== false)
        .sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));
      renderAnnouncementList("all");
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  }

  function renderAnnouncementList(category) {
    if (!announcementListEl) return;
    announcementListEl.innerHTML = "";

    const filtered = category === "all" 
      ? announcementData 
      : announcementData.filter(item => item.category === category);

    filtered.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "announcementItem";
      li.dataset.category = item.category;

      const shortText = item[`shortText_${currentLang}`] || item.shortText_en || item.shortText;
      const readMoreText = t("common.readMore");

      li.innerHTML = `
        <span class="announcementDate">${item.displayDate || item.date}</span>
        <p class="announcementText">${shortText}</p>
        <button class="announcementReadMoreBtn" data-index="${index}">${readMoreText}</button>
      `;

      li.querySelector(".announcementReadMoreBtn").addEventListener("click", () => {
        openAnnouncementDetail(index);
      });

      announcementListEl.appendChild(li);
    });
  }

  const setAnnouncementOpen = (isOpen) => {
    document.body.classList.toggle("show-announcement", isOpen);
    if (announcementOverlay) announcementOverlay.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen && announcementOverlay) {
      scrollPageToElement(announcementOverlay, { behavior: "smooth", block: "start" });
      loadAnnouncementsFromFirebase();
    }
  };

  if (openAnnouncementBtn && announcementOverlay && announcementCloseBtn) {
    openAnnouncementBtn.addEventListener("click", () => {
      setMapOpen(false);
      setCalendarOpen(false);
      setServiceOpen(false);
      setAnnouncementOpen(true);
    });
    announcementCloseBtn.addEventListener("click", () => setAnnouncementOpen(false));
  }

  document
    .querySelectorAll(".slider .buyButton2, .slider .buyButton3, .slider .buyButton4, .slider .buyButton5, .slider .buyButton6")
    .forEach((btn) => {
      btn.addEventListener("click", () => setAnnouncementOpen(false));
    });

  const announcementTabs = document.querySelectorAll(".announcementTab");
  announcementTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      announcementTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const category = tab.dataset.category;
      renderAnnouncementList(category);
    });
  });

  const announcementModal = document.getElementById("announcementDetailModal");
  const announcementModalTitle = document.getElementById("announcementModalTitle");
  const announcementModalContent = document.getElementById("announcementModalContent");
  const announcementModalClose = document.querySelector(".announcement-modal-close");

  function openAnnouncementDetail(index) {
    const detail = announcementData[index];
    if (!detail || !announcementModal) return;
    
    const title = detail[`title_${currentLang}`] || detail.title_en || detail.title;
    const content = detail[`fullContent_${currentLang}`] || detail.fullContent_en || detail.fullContent;

    announcementModalTitle.textContent = title;
    announcementModalContent.textContent = content;
    announcementModal.classList.add("active");
    announcementModal.setAttribute("aria-hidden", "false");
  }

  function closeAnnouncementDetail() {
    if (!announcementModal) return;
    announcementModal.classList.remove("active");
    announcementModal.setAttribute("aria-hidden", "true");
  }

  if (announcementModalClose) {
    announcementModalClose.addEventListener("click", closeAnnouncementDetail);
  }
  if (announcementModal) {
    announcementModal.addEventListener("click", (e) => {
      if (e.target === announcementModal) closeAnnouncementDetail();
    });
  }

  const calendarOverlay = document.getElementById("calendarOverlay");
  const openCalendarBtn = document.getElementById("openCalendarBtn");
  const calendarCloseBtn = document.getElementById("calendarCloseBtn");
  const calendarBody = document.getElementById("calendarBody");
  const calendarInfoHint = document.getElementById("calendarInfoHint");
  const calendarInfoTitle = document.getElementById("calendarInfoTitle");
  const calendarInfoDesc = document.getElementById("calendarInfoDesc");

  const firebaseConfig = {
    apiKey: "AIzaSyCenfhVQjmGSVOflXL0wOqK9GqUCAzfL34",
    authDomain: "mycelium-residence.firebaseapp.com",
    projectId: "mycelium-residence",
    storageBucket: "mycelium-residence.firebasestorage.app",
    messagingSenderId: "982178911104",
    appId: "1:982178911104:web:948912553056b2ea162765"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  window.db = db;
  window.firebase = firebase;

  const READ_EVENTS_KEY = "calendar_read_event_ids";
  function getReadEventIds() {
    const stored = localStorage.getItem(READ_EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  function markEventAsRead(eventId) {
    const readIds = getReadEventIds();
    if (!readIds.includes(eventId)) {
      readIds.push(eventId);
      localStorage.setItem(READ_EVENTS_KEY, JSON.stringify(readIds));
    }
  }

  let events = [];
  let currentCalendarDate = new Date(); 

  async function loadEventsFromFirebase() {
    try {
      const snapshot = await REGION.readCollection(window.db, activeCountryCode, "events");
      events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          if (!snapshot.legacy || !isDefaultMalaysia(activeCountryCode)) return true;
          const itemCode = String(item.countryCode || "").toUpperCase();
          return !itemCode || itemCode === "MY" || itemCode === "MY_PP";
        });
      buildCalendar();
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  }

  // 日历生成：整个日期格子均支持点击查看事件
  function buildCalendar() {
    if (!calendarBody) return;
    calendarBody.innerHTML = "";

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const readIds = getReadEventIds();

    const monthTitleEl = document.querySelector(".calendar-month");
    if (monthTitleEl) {
      monthTitleEl.textContent = currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let row = document.createElement("tr");
    
    for (let i = 0; i < firstDay; i++) {
      row.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const col = (firstDay + day - 1) % 7;
      const td = document.createElement("td");

      const num = document.createElement("span");
      num.textContent = day;
      if (col === 0) num.className = "calendar-day-sun";
      if (col === 6) num.className = "calendar-day-sat";
      td.appendChild(num);

      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const dayEvents = events.filter(ev => ev.date === dateStr);

      if (dayEvents.length > 0) {
        td.classList.add("has-event");
        td.style.cursor = "pointer";
        td.setAttribute("role", "button");
        td.setAttribute("tabindex", "0");
        td.setAttribute("aria-label", "View event for day " + day);

        const showDayEvent = () => {
          const ev = dayEvents[0];
          markEventAsRead(ev.id);
          td.querySelector(".unread-dot")?.remove();

          const eventTitle = ev[`title_${currentLang}`] || ev.title_en || ev.title;
          const eventDesc = ev[`description_${currentLang}`] || ev.description_en || ev.description;

          if (calendarInfoHint) calendarInfoHint.style.display = "none";
          if (calendarInfoTitle) {
            calendarInfoTitle.textContent = eventTitle;
            calendarInfoTitle.style.display = "block";
          }
          if (calendarInfoDesc) {
            calendarInfoDesc.textContent = eventDesc;
            calendarInfoDesc.style.display = "block";
          }
        };

        td.addEventListener("click", showDayEvent);
        td.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showDayEvent();
          }
        });

        const star = document.createElement("button");
        star.type = "button";
        star.className = "calendar-star";
        star.setAttribute("aria-label", "Show event for day " + day);
        star.textContent = "\u2605";
        star.addEventListener("click", (e) => {
          e.stopPropagation();
          showDayEvent();
        });
        td.appendChild(star);

        const hasUnread = dayEvents.some(ev => !readIds.includes(ev.id));
        if (hasUnread) {
          const dot = document.createElement("span");
          dot.className = "unread-dot";
          td.appendChild(dot);
        }
      }

      row.appendChild(td);
      if (col === 6) {
        calendarBody.appendChild(row);
        row = document.createElement("tr");
      }
    }

    if (row.children.length > 0) {
      while (row.children.length < 7) {
        row.appendChild(document.createElement("td"));
      }
      calendarBody.appendChild(row);
    }
  }

  function switchMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    buildCalendar();
    resetCalendarDetail();
  }

  function resetCalendarDetail() {
    if (!calendarInfoHint) return;
    calendarInfoHint.style.display = "block";
    if (calendarInfoTitle) calendarInfoTitle.style.display = "none";
    if (calendarInfoDesc) calendarInfoDesc.style.display = "none";
  }

  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => switchMonth(-1));
  if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => switchMonth(1));

  const setCalendarOpen = (isOpen) => {
    document.body.classList.toggle("show-calendar", isOpen);
    if (calendarOverlay) calendarOverlay.setAttribute("aria-hidden", String(!isOpen));
    if (!isOpen) {
      resetCalendarDetail();
    }
    if (isOpen && calendarOverlay) {
      scrollPageToElement(calendarOverlay, { behavior: "smooth", block: "start" });
      loadEventsFromFirebase();
    }
  };

  if (openCalendarBtn && calendarOverlay && calendarCloseBtn) {
    openCalendarBtn.addEventListener("click", () => {
      setMapOpen(false);
      setCalendarOpen(true);
    });
    calendarCloseBtn.addEventListener("click", () => setCalendarOpen(false));
  }

  document
    .querySelectorAll(".slider .buyButton, .slider .buyButton2, .slider .buyButton3, .slider .buyButton5, .slider .buyButton6")
    .forEach((btn) => {
      btn.addEventListener("click", () => setCalendarOpen(false));
    });

  // 设施地图 Pin 点击事件：针对手机端优化，杜绝跳屏，对齐电脑端体验
  mapPins.forEach((pin) => {
    pin.addEventListener("click", () => {
      mapPins.forEach((p) => {
        p.classList.remove("active");
        p.setAttribute("aria-pressed", "false");
      });
      pin.classList.add("active");
      pin.setAttribute("aria-pressed", "true");
      if (mapInfoTitle) mapInfoTitle.textContent = pin.dataset.name || "";
      if (mapInfoDesc) mapInfoDesc.textContent = pin.dataset.desc || "";
      showFacilityPhoto(facilityPhotoBase(pin), pin.dataset.name);
      
      if (mapInfoBox) {
        mapInfoBox.classList.remove("is-visible");
        
        requestAnimationFrame(() => {
          mapInfoBox.classList.add("is-visible");
          setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            const rect = mapInfoBox.getBoundingClientRect();
            
            if (isMobile) {
              if (rect.bottom > window.innerHeight) {
                const scrollAmount = rect.bottom - window.innerHeight + 16;
                if (window.MYCELIUM_LENIS) {
                  window.MYCELIUM_LENIS.scrollTo(window.scrollY + scrollAmount, { duration: 0.5 });
                } else {
                  window.scrollBy({ top: scrollAmount, behavior: "smooth" });
                }
              }
            } else {
              const targetY = window.scrollY + rect.top - window.innerHeight / 2;
              if (window.MYCELIUM_LENIS) {
                window.MYCELIUM_LENIS.scrollTo(targetY, { duration: 0.7 });
              } else {
                window.scrollTo({ top: targetY, behavior: "smooth" });
              }
            }
          }, 60);
        });
      }
    });
  });

  const SERVICE_DATA = {
    en: [
      { name: "Ahmad Razali", role: "Plumber", phone: "+60 12-345 6789", email: "ahmad.plumb@email.com", desc: "Expert in pipe installation, leak repair, bathroom fitting and water heater maintenance for residential properties." },
      { name: "Siti Aminah", role: "Electrician", phone: "+60 13-456 7890", email: "siti.elec@email.com", desc: "Certified electrical wiring, circuit breaker repair, lighting installation and safety inspection services." },
      { name: "Raj Kumar", role: "Air-Cond Technician", phone: "+60 14-567 8901", email: "raj.ac@email.com", desc: "Air-conditioner servicing, gas top-up, compressor repair and annual maintenance contracts." },
      { name: "Lee Wei Ming", role: "Carpenter", phone: "+60 15-678 9012", email: "lee.carpentry@email.com", desc: "Custom furniture, kitchen cabinet, wardrobe and home renovation woodwork craftsmanship." },
      { name: "Nurul Izzati", role: "Cleaner", phone: "+60 16-789 0123", email: "nurul.clean@email.com", desc: "Deep cleaning, move-in/out cleaning, office cleaning and regular housekeeping services." },
      { name: "Tan Boon Heng", role: "Painter", phone: "+60 17-890 1234", email: "tan.paint@email.com", desc: "Interior/exterior painting, waterproof coating, wall texture repair and color consultation." },
      { name: "Dr. Priya", role: "Home Doctor", phone: "+60 18-901 2345", email: "dr.priya@email.com", desc: "General practitioner home visits, health screening, vaccination and elderly care services." },
      { name: "Zainab Yusof", role: "Landscaper", phone: "+60 19-012 3456", email: "zainab.green@email.com", desc: "Garden design, lawn maintenance, tree trimming, irrigation system and landscaping consultation." }
    ],
    'zh-CN': [
      { name: "Ahmad Razali", role: "水管工", phone: "+60 12-345 6789", email: "ahmad.plumb@email.com", desc: "专业管道安装、漏水维修、卫浴安装及住宅热水器维护服务。" },
      { name: "Siti Aminah", role: "电工", phone: "+60 13-456 7890", email: "siti.elec@email.com", desc: "持证电路布线、断路器维修、灯具安装及安全检测服务。" },
      { name: "Raj Kumar", role: "空调维修师", phone: "+60 14-567 8901", email: "raj.ac@email.com", desc: "空调保养、加氟、压缩机维修及年度维保套餐。" },
      { name: "Lee Wei Ming", role: "木工", phone: "+60 15-678 9012", email: "lee.carpentry@email.com", desc: "定制家具、橱柜、衣柜及全屋装修木工工艺。" },
      { name: "Nurul Izzati", role: "保洁", phone: "+60 16-789 0123", email: "nurul.clean@email.com", desc: "深度清洁、入住/退租清洁、办公室清洁及定期家政服务。" },
      { name: "Tan Boon Heng", role: "油漆工", phone: "+60 17-890 1234", email: "tan.paint@email.com", desc: "室内外粉刷、防水涂层、墙面修复及配色咨询。" },
      { name: "Dr. Priya", role: "家庭医生", phone: "+60 18-901 2345", email: "dr.priya@email.com", desc: "全科医生上门问诊、健康筛查、疫苗接种及长者护理服务。" },
      { name: "Zainab Yusof", role: "园艺师", phone: "+60 19-012 3456", email: "zainab.green@email.com", desc: "花园设计、草坪养护、树木修剪、灌溉系统及园艺咨询。" }
    ]
  };  

  let serviceCarouselIndex = 0;
  let serviceWheelRemainder = 0;
  let serviceWheelArmed = false;

  function renderServiceCards() {
    const track = document.getElementById("serviceTrack");
    if (!track) return;

    const data = (isDefaultMalaysia(activeCountryCode) || (isMalaysiaSite && !(regionServices || []).length))
      ? (SERVICE_DATA[currentLang] || SERVICE_DATA.en)
      : (regionServices || []).map((service) => ({
        role: service[`category_${currentLang}`] || service.category_en || "Community service",
        name: service[`name_${currentLang}`] || service.name_en || "Service",
        desc: service[`note_${currentLang}`] || service.note_en || "",
        phone: service.contact || "",
        email: service.email || "",
      }));

    track.innerHTML = data.map((srv, i) => `
      <div class="service-card" data-index="${i}">
        <span class="card-badge">${srv.role}</span>
        <h4 class="card-name">${srv.name}</h4>
        <p class="card-desc">${srv.desc}</p>
        <hr class="card-divider" />
        <div class="card-contact-row">
          <span class="card-contact-label">${t("service.phone")}</span>
          <a href="tel:${srv.phone.replace(/\s+/g, '')}" class="card-phone">${srv.phone}</a>
          ${srv.email ? `<span class="card-contact-label" style="margin-top:6px;">${t("service.email")}</span><a href="mailto:${srv.email}" class="card-email">${srv.email}</a>` : ""}
        </div>
      </div>
    `).join('');

    serviceCarouselIndex = 0;
    updateCarouselPosition();
    updateNavButtons();
  }

  function updateCarouselPosition() {
    const track = document.getElementById("serviceTrack");
    if (!track) return;
    const cards = track.querySelectorAll(".service-card");
    if (cards.length === 0) return;
    const card = cards[0];
    const offset = serviceCarouselIndex * (card.offsetWidth + 24);
    track.style.transform = `translateX(-${offset}px)`;
  }

  function updateNavButtons() {
    const prevBtn = document.getElementById("servicePrevBtn");
    const nextBtn = document.getElementById("serviceNextBtn");
    if (!prevBtn || !nextBtn) return;
    const track = document.getElementById("serviceTrack");
    if (!track) return;
    const cards = track.querySelectorAll(".service-card");
    const totalCards = cards.length;
    if (totalCards === 0) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }
    const wrapperWidth = track.parentElement.offsetWidth;
    const card = cards[0];
    const visibleCards = Math.floor((wrapperWidth - card.offsetWidth) / (card.offsetWidth + 24)) + 1;
    const maxIndex = Math.max(0, totalCards - visibleCards);
    prevBtn.disabled = serviceCarouselIndex <= 0;
    nextBtn.disabled = serviceCarouselIndex >= maxIndex;
  }

  function slideServiceCards(direction) {
    const track = document.getElementById("serviceTrack");
    if (!track) return;
    const cards = track.querySelectorAll(".service-card");
    if (cards.length === 0) return;
    const wrapperWidth = track.parentElement.offsetWidth;
    const card = cards[0];
    const visibleCards = Math.floor((wrapperWidth - card.offsetWidth) / (card.offsetWidth + 24)) + 1;
    const maxIndex = Math.max(0, cards.length - visibleCards);

    serviceCarouselIndex += direction;
    if (serviceCarouselIndex < 0) serviceCarouselIndex = 0;
    if (serviceCarouselIndex > maxIndex) serviceCarouselIndex = maxIndex;

    updateCarouselPosition();
    updateNavButtons();
  }
  
  const openServiceDirectoryBtn = document.getElementById("openServiceDirectoryBtn");
  const serviceSection = document.getElementById("serviceSection");
  const serviceCloseBtn = document.getElementById("serviceCloseBtn");
  const servicePrevBtn = document.getElementById("servicePrevBtn");
  const serviceNextBtn = document.getElementById("serviceNextBtn");

  const setServiceOpen = (isOpen) => {
    if (!serviceSection) return;
    if (isOpen) {
      serviceWheelArmed = true;
      document.body.classList.add("show-service");
      renderServiceCards();
      serviceSection.setAttribute("aria-hidden", "false");
      setTimeout(() => {
        scrollPageToElement(serviceSection, { behavior: "smooth", block: "start" });
        serviceSection.focus({ preventScroll: true });
      }, 100);
    } else {
      serviceWheelArmed = false;
      document.body.classList.remove("show-service");
      serviceSection.setAttribute("aria-hidden", "true");
      openServiceDirectoryBtn?.focus({ preventScroll: true });
    }
  };

  if (openServiceDirectoryBtn && serviceSection) {
    openServiceDirectoryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setServiceOpen(true);
    });
  }

  if (serviceCloseBtn && serviceSection) {
    serviceCloseBtn.addEventListener("click", () => setServiceOpen(false));
  }
  if (servicePrevBtn) servicePrevBtn.addEventListener("click", () => slideServiceCards(-1));
  if (serviceNextBtn) serviceNextBtn.addEventListener("click", () => slideServiceCards(1));

  if (serviceSection) {
    document.addEventListener("wheel", (event) => {
      if (!document.body.classList.contains("show-service") || (!serviceWheelArmed && !serviceSection.contains(event.target))) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      const canMove = delta > 0 ? serviceNextBtn && !serviceNextBtn.disabled : servicePrevBtn && !servicePrevBtn.disabled;
      if (!canMove) {
        serviceWheelRemainder = 0;
        if (event.deltaY && window.MYCELIUM_LENIS) {
          event.preventDefault();
          window.MYCELIUM_LENIS.scrollTo(window.MYCELIUM_LENIS.scroll + event.deltaY, { duration: 0.55 });
        }
        return;
      }
      event.preventDefault();
      serviceWheelRemainder += delta;
      if (Math.abs(serviceWheelRemainder) < 42) return;
      slideServiceCards(serviceWheelRemainder > 0 ? 1 : -1);
      serviceWheelRemainder = 0;
    }, { passive: false, capture: true });

    document.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("show-service")) return;
      if (!serviceSection.contains(event.target) && !openServiceDirectoryBtn?.contains(event.target)) {
        serviceWheelArmed = false;
      }
    });

    serviceSection.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      slideServiceCards(event.key === "ArrowRight" ? 1 : -1);
    });
  }

  window.addEventListener("resize", () => {
    updateCarouselPosition();
    updateNavButtons();
  });

  document
    .querySelectorAll(".slider .buyButton, .slider .buyButton2, .slider .buyButton4, .slider .buyButton5, .slider .buyButton6")
    .forEach((btn) => {
      btn.addEventListener("click", () => setServiceOpen(false));
    });

  const FAQ_DATA = {
    en: [
      { q: "How do I become a member of Smart Community?", a: "Membership is open to all residents and community stakeholders. Simply visit the Volunteer Registration section or contact our community office. New members receive a welcome package, community guide, and access to all digital platforms." },
      { q: "What facilities are available in the community?", a: "Our community features a Community Hall, Health Clinic, Children's Playground, Sports Center with gym and pool, and a 2-acre Central Park. All facilities are accessible to all residents." },
      { q: "How can I report a maintenance issue or safety concern?", a: "You can report issues through the Community Assistant chatbot, email myceliumresidence07@gmail.com, or call our 24/7 hotline at +60 10-557 0900. All non-emergency reports are addressed within 48 hours." },
      { q: "Are there age-specific programs and activities?", a: "Yes! We offer programs for all ages: toddler storytime, youth sports leagues, adult fitness classes, and senior wellness walks." },
      { q: "How does the community newsletter work?", a: "Our weekly newsletter is delivered every Monday morning via email. Subscribe at the bottom of this page or at the community office." },
      { q: "What are the community rules and guidelines?", a: "Key guidelines include: quiet hours from 10 PM to 7 AM, proper waste sorting, pet leash requirements, and parking regulations." }
    ],
    'zh-CN': [
      { q: "如何成为社区会员？", a: "所有居民和社区相关人士均可申请会员。只需访问志愿者报名板块或联系社区办公室即可。" },
      { q: "社区有哪些设施？", a: "社区设有社区礼堂、健康诊所、儿童游乐场、带健身房和泳池的运动中心，以及占地2英亩的中央公园。" },
      { q: "如何报修或反馈安全问题？", a: "您可以通过社区助手聊天机器人、发送邮件至 myceliumresidence07@gmail.com，或拨打热线 +60 10-557 0900 反馈。" },
      { q: "有分年龄段的活动吗？", a: "有的！我们覆盖全年龄段活动。完整活动安排请查看活动日历。" },
      { q: "社区通讯如何订阅？", a: "我们每周一上午通过邮件发送社区周报，可在页面底部订阅。" },
      { q: "社区有哪些规章制度？", a: "核心规定包括：晚10点至早7点为静音时段、垃圾分类回收要求、公共区域宠物需牵绳等。" }
    ]
  };

  function renderFAQItems() {
    const body = document.getElementById("faqBody");
    if (!body) return;
    const data = (isDefaultMalaysia(activeCountryCode) || (isMalaysiaSite && !(regionFaqs || []).length))
      ? (FAQ_DATA[currentLang] || FAQ_DATA.en)
      : (regionFaqs || []).map((faq) => ({
        q: faq[`q_${currentLang}`] || faq.q_en || "",
        a: faq[`a_${currentLang}`] || faq.a_en || "",
      }));

    body.innerHTML = data.map((faq, i) => `
      <div class="faq-item" data-index="${i}">
        <div class="faq-question">
          <h3>${faq.q}</h3>
          <div class="faq-toggle">+</div>
        </div>
        <div class="faq-answer">
          <div class="faq-answer-inner">
            <p>${faq.a}</p>
          </div>
        </div>
      </div>
    `).join('');

    const items = body.querySelectorAll(".faq-item");
    items.forEach(item => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        items.forEach(other => {
          other.classList.remove("active");
          other.querySelector(".faq-answer").style.maxHeight = "0";
        });
        if (!isActive) {
          item.classList.add("active");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    });
  }  
  
  const openFAQBtn = document.getElementById("openFAQBtn");
  const faqSection = document.getElementById("faqSection");
  const faqCloseBtn = document.getElementById("faqCloseBtn");

  const setFAQOpen = (isOpen) => {
    if (!faqSection) return;
    if (isOpen) {
      document.body.classList.add("show-faq");
      renderFAQItems();
      faqSection.setAttribute("aria-hidden", "false");
      setTimeout(() => {
        scrollPageToElement(faqSection, { behavior: "smooth", block: "start" });
      }, 100);
    } else {
      document.body.classList.remove("show-faq");
      faqSection.setAttribute("aria-hidden", "true");
      const items = faqSection.querySelectorAll(".faq-item");
      items.forEach(item => {
        item.classList.remove("active");
        item.querySelector(".faq-answer").style.maxHeight = "0";
      });
    }
  };

  if (openFAQBtn && faqSection) {
    openFAQBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setFAQOpen(true);
    });
  }

  if (faqCloseBtn && faqSection) {
    faqCloseBtn.addEventListener("click", () => setFAQOpen(false));
  }

  document
    .querySelectorAll(".slider .buyButton, .slider .buyButton2, .slider .buyButton3, .slider .buyButton4, .slider .buyButton5")
    .forEach((btn) => {
      btn.addEventListener("click", () => setFAQOpen(false));
    });

  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    const communityNav = document.getElementById("nav");
    const heroTrack = document.getElementById("heroSequence");
    const getNavPageTop = () => {
      if (!communityNav) return 0;
      if (heroTrack) {
        const overlap = Number.parseFloat(window.getComputedStyle(communityNav).marginTop) || 0;
        return Math.max(0, heroTrack.getBoundingClientRect().bottom + window.scrollY + overlap);
      }
      return Math.max(0, communityNav.getBoundingClientRect().top + window.scrollY);
    };

    const toggleBackToTopBtn = () => {
      const sliderEl = document.querySelector('.slider');
      const offset = sliderEl ? sliderEl.offsetHeight : (communityNav ? communityNav.offsetHeight : 600);
      const showAfter = getNavPageTop() + offset - (window.innerHeight * 0.3);
      backToTopBtn.classList.toggle("show", window.scrollY > showAfter);
    };
    toggleBackToTopBtn();
    window.addEventListener("scroll", toggleBackToTopBtn);
    window.addEventListener("resize", toggleBackToTopBtn, { passive: true });
    document.addEventListener("fullscreenchange", toggleBackToTopBtn);

    backToTopBtn.addEventListener("click", () => {
      const target = getNavPageTop();
      if (window.MYCELIUM_LENIS) {
        window.MYCELIUM_LENIS.scrollTo(target, { duration: 0.9 });
        return;
      }
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  }

  const volunteerOverlay = document.getElementById("volunteer");
  const openVolunteerBtn = document.getElementById("openVolunteerBtn");

  const setVolunteerOpen = (isOpen) => {
    document.body.classList.toggle("show-volunteer", isOpen);
    if (volunteerOverlay) volunteerOverlay.setAttribute("aria-hidden", String(!isOpen));
    if (isOpen) {
      requestAnimationFrame(() => {
        if (volunteerOverlay) {
          scrollPageToElement(volunteerOverlay, { behavior: "smooth", block: "start" });
        }
        // delay strip activate so page scroll finishes first
        setTimeout(() => {
          if (window.MYCELIUM_VOLUNTEER_STRIP && typeof window.MYCELIUM_VOLUNTEER_STRIP.open === "function") {
            window.MYCELIUM_VOLUNTEER_STRIP.open();
          } else if (window.MYCELIUM_VOLUNTEER_STRIP && window.MYCELIUM_VOLUNTEER_STRIP.refresh) {
            window.MYCELIUM_VOLUNTEER_STRIP.refresh();
          }
        }, 400);
      });
    } else {
      // always restore page scroll when closing
      document.documentElement.classList.remove("vi-lock");
      document.body.classList.remove("vi-lock");
      if (window.MYCELIUM_VOLUNTEER_STRIP && typeof window.MYCELIUM_VOLUNTEER_STRIP.close === "function") {
        window.MYCELIUM_VOLUNTEER_STRIP.close();
      }
      if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.start === "function") {
        try { window.MYCELIUM_LENIS.start(); } catch (e) {}
      }
    }
  };

  if (openVolunteerBtn && volunteerOverlay) {
    openVolunteerBtn.addEventListener("click", () => {
      setMapOpen(false);
      setAnnouncementOpen(false);
      setCalendarOpen(false);
      setServiceOpen(false);
      setFAQOpen(false);
      setVolunteerOpen(true);
    });
  }

  const volunteerCloseBtn = document.getElementById("volunteerCloseBtn");
  if (volunteerCloseBtn) {
    volunteerCloseBtn.addEventListener("click", () => setVolunteerOpen(false));
  }

  document
    .querySelectorAll(".slider .buyButton, .slider .buyButton2, .slider .buyButton3, .slider .buyButton4, .slider .buyButton6")
    .forEach((btn) => {
      btn.addEventListener("click", () => setVolunteerOpen(false));
    });

  const volunteerRegisterBtns = document.querySelectorAll(".volunteerRegisterBtn");
  const volunteerFormOverlay = document.getElementById("volunteerFormOverlay");
  const volunteerFormClose = document.getElementById("volunteerFormClose");
  const volunteerFormActivity = document.getElementById("volunteerFormActivity");
  const volunteerFormEl = document.getElementById("volunteerFormEl");

  const openVolunteerForm = (activityName) => {
    if (!volunteerFormOverlay) return;
    volunteerFormActivity.textContent = t("volunteer.activityLabel") + " " + activityName;
    volunteerFormEl.dataset.activity = activityName;
    volunteerFormOverlay.classList.add("active");
  };

  const closeVolunteerForm = () => {
    if (!volunteerFormOverlay) return;
    volunteerFormOverlay.classList.remove("active");
    volunteerFormEl.reset();
  };

  volunteerRegisterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      openVolunteerForm(btn.dataset.activity);
    });
  });

  if (volunteerFormClose) {
    volunteerFormClose.addEventListener("click", closeVolunteerForm);
  }

  if (volunteerFormOverlay) {
    volunteerFormOverlay.addEventListener("click", (e) => {
      if (e.target === volunteerFormOverlay) closeVolunteerForm();
    });
  }

  // 志愿者表单提交：采用品牌弹窗提醒并直接存入 Firestore
  if (volunteerFormEl) {
    volunteerFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = document.getElementById("volFullName").value.trim();
      const phone = document.getElementById("volPhone").value.trim();
      const address = document.getElementById("volAddress").value.trim();
      const notes = document.getElementById("volNotes").value.trim();
      const activity = volunteerFormEl.dataset.activity;

      if (!fullName || !phone || !activity) {
        showMyceliumNotice(t("volunteer.requiredTip"), "Notice");
        return;
      }

      const submitBtn = volunteerFormEl.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t("volunteer.submitting");
      }

      try {
        const volunteerRecord = {
          countryCode: activeCountryCode,
          fullName: fullName,
          phone: phone,
          address: address,
          notes: notes,
          activity: activity,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await locationCollection("volunteers").add(volunteerRecord);

        showMyceliumNotice(fullName + ", " + t("volunteer.successTip"), "Registration Submitted");
        closeVolunteerForm();
      } catch (err) {
        console.error("Registration submission failed:", err);
        showMyceliumNotice(t("volunteer.errorTip"), "Submission Error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = t("volunteer.submitBtn");
        }
      }
    });
  }
  
  function updateActiveMenuItem(index) {
    const activeChanged = !menuItems[index]?.classList.contains("active");
    menuItems.forEach((item, i) => {
      const active = i === index;
      if (i === index) item.classList.add("active");
      else item.classList.remove("active");
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    document.querySelectorAll(".hero-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
    document.querySelectorAll("[data-hero-index]").forEach((el) => {
      el.textContent = String(index + 1).padStart(2, "0");
    });
    if (activeChanged) window.dispatchEvent(new CustomEvent("mycelium:slidechange", { detail: { index } }));
  }

  function closeAllSections() {
    setAnnouncementOpen(false);
    setMapOpen(false);
    setServiceOpen(false);
    setCalendarOpen(false);
    setVolunteerOpen(false);
    setFAQOpen(false);
    closeAnnouncementDetail();
  }

  function syncMenuOnScroll() {
    const sliderEl = document.querySelector(".slider");
    if (!sliderEl) return;
    const rect = sliderEl.getBoundingClientRect();
    if (rect.top > 0) return;
    if (currentIndex >= 0 && currentIndex < menuItems.length) {
      updateActiveMenuItem(currentIndex);
    }
  }

  let scrollTick = false;
  window.addEventListener("scroll", () => {
    if (!scrollTick) {
      window.requestAnimationFrame(() => {
        syncMenuOnScroll();
        scrollTick = false;
      });
      scrollTick = true;
    }
  });

  updateActiveMenuItem(0);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
      slideSwitch(currentIndex);
      updateActiveMenuItem(currentIndex);
    }
    if (e.key === "ArrowRight") {
      currentIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
      slideSwitch(currentIndex);
      updateActiveMenuItem(currentIndex);
    }
  });

  function slideSwitch(targetIdx) {
    closeAllSections();
    wrapper.style.transform = `translateX(${-100 * targetIdx}vw)`;
    const bottomWrapper = document.querySelector(".bottomSliderWrapper");
    if (bottomWrapper) {
      bottomWrapper.style.transform = `translateX(${-100 * targetIdx}vw)`;
    }
    updateActiveMenuItem(targetIdx);
    scrollToSlider();
    resetCalendarDetail();
  }

  const searchInput = document.getElementById("navSearchInput");

  let searchTip = document.querySelector(".search-tip");
  if (!searchTip) {
    searchTip = document.createElement("div");
    searchTip.className = "search-tip";
    document.body.prepend(searchTip);
  }

  function showTip(text) {
    searchTip.textContent = text;
    searchTip.classList.add("show");
    setTimeout(() => searchTip.classList.remove("show"), 3000);
  }

  function performSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    const keywordMap = i18n[currentLang]?.searchKeywords || [];
    let matched = null;
    let matchedPinId = null;

    let maxMatch = 0;
    keywordMap.forEach(entry => {
      let matchCount = 0;
      entry.keywords.forEach(kw => {
        if (q.includes(kw.toLowerCase())) matchCount++;
      });
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        matched = entry;
      }
    });

    if (matched && matched.action === "map") {
      const mapPinsData = i18n[currentLang]?.mapPins || {};
      for (const pinId in mapPinsData) {
        const pin = mapPinsData[pinId];
        if (q.includes(pin.name.toLowerCase())) {
          matchedPinId = pinId;
          break;
        }
      }
    }

    if (matched) {
      currentIndex = matched.slideIndex;
      wrapper.style.transform = `translateX(${-100 * currentIndex}vw)`;
      const bottomWrapper = document.querySelector(".bottomSliderWrapper");
      if (bottomWrapper) bottomWrapper.style.transform = `translateX(${-100 * currentIndex}vw)`;
      updateActiveMenuItem(currentIndex);
      closeAllSections();

      switch (matched.action) {
        case "announcement": setAnnouncementOpen(true); break;
        case "map":
          setMapOpen(true);
          if (matchedPinId) {
            const pinEl = document.querySelector(`.pin[data-pin-id="${matchedPinId}"]`);
            if (pinEl) {
              document.querySelectorAll("#mapOverlay .pin").forEach(p => {
                p.classList.remove("active");
                p.setAttribute("aria-pressed", "false");
              });
              pinEl.classList.add("active");
              pinEl.setAttribute("aria-pressed", "true");
              const pinData = i18n[currentLang].mapPins[matchedPinId];
              if (mapInfoTitle && mapInfoDesc && mapInfoBox && pinData) {
                mapInfoTitle.textContent = pinData.name;
                mapInfoDesc.textContent = pinData.desc;
                showFacilityPhoto(facilityPhotoBase(pinEl), pinData.name);
                mapInfoBox.classList.add("is-visible");
              }
            }
          }
          break;
        case "service": setServiceOpen(true); break;
        case "calendar": setCalendarOpen(true); break;
        case "volunteer": setVolunteerOpen(true); break;
        case "faq": setFAQOpen(true); break;
      }

      setTimeout(() => {
        const targetSection = document.querySelector(`.${matched.action}-overlay, #${matched.action}Section, #${matched.action}`);
        if (targetSection) scrollPageToElement(targetSection, { behavior: "smooth", block: "start" });
      }, 200);
    } else {
      showTip(t("common.searchNoResult"));
    }

    searchInput.value = "";
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch(searchInput.value);
      }
    });
  }  

  const featureTriggers = document.querySelectorAll(".feature-modal-trigger");
  const modalOverlays = document.querySelectorAll(".feature-modal-overlay");
  const modalCloseBtns = document.querySelectorAll(".feature-modal-close");
  const connectBtn = document.getElementById("connectWithUsBtn");
  const footerEl = document.querySelector(".footer");

  let tooltipTimer = null;
  featureTriggers.forEach(card => {
    card.addEventListener("mouseenter", () => {
      const tooltip = card.querySelector(".feature-tooltip");
      clearTimeout(tooltipTimer);
      tooltipTimer = setTimeout(() => {
        tooltip?.classList.add("show");
      }, 1000);
    });

    card.addEventListener("mouseleave", () => {
      const tooltip = card.querySelector(".feature-tooltip");
      clearTimeout(tooltipTimer);
      tooltip?.classList.remove("show");
    });
  });

  if (connectBtn && footerEl) {
    connectBtn.addEventListener("click", () => {
      if (connectBtn.classList.contains("feature-modal-trigger")) return;
      scrollPageToElement(footerEl, { behavior: "smooth", block: "start" });
    });
  }

  featureTriggers.forEach(card => {
    card.addEventListener("click", () => {
      const modalId = card.dataset.modal;
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        targetModal.classList.add("active");
        targetModal.setAttribute("aria-hidden", "false");
      }
    });
  });

  modalCloseBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".feature-modal-overlay");
      modal?.classList.remove("active");
      modal?.setAttribute("aria-hidden", "true");
    });
  });

  modalOverlays.forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
      }
    });
  });

  const legalModal = document.getElementById('legalModal'); 
  const legalModalTitle = document.getElementById('legalModalTitle');
  const legalModalContent = document.getElementById('legalModalContent');
  const legalModalClose = document.getElementById('legalModalClose');

  function openLegalDoc(docKey) {
    if (!legalModal) return;
    const docData = i18n[currentLang].legalDocs[docKey];
    if (docData) {
      legalModalTitle.textContent = docData.title;
      if (!isDefaultMalaysia(window.MYCELIUM_COUNTRY) && docKey === "rules") {
        const rules = window.MYCELIUM_REGION_RULES;
        const items = rules?.[`items_${currentLang}`] || rules?.items_en;
        if (Array.isArray(items) && items.length) {
          const escapeHtml = (val) => String(val).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
          legalModalContent.innerHTML = `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
        } else {
          legalModalContent.innerHTML = docData.content;
        }
      } else {
        legalModalContent.innerHTML = docData.content;
      }
      document.body.classList.add('show-legal');
      legalModal.classList.add('active');
      legalModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeLegalDoc() {
    if (!legalModal) return;
    document.body.classList.remove('show-legal');
    legalModal.classList.remove('active');
    legalModal.setAttribute('aria-hidden', 'true');
  }

  if (legalModalClose) legalModalClose.addEventListener('click', closeLegalDoc);
  if (legalModal) {
    legalModal.addEventListener('click', (e) => {
      if (e.target === legalModal) closeLegalDoc();
    });
  }

  document.querySelectorAll('[data-doc]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openLegalDoc(link.dataset.doc);
    });
  });

  document.querySelectorAll(".footer-links [data-slide]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetIndex = Number(link.dataset.slide);
      if (menuItems[targetIndex]) menuItems[targetIndex].click();
    });
  });

  // Newsletter 表单提交：采用品牌弹窗提醒并直接存入 Firestore
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = newsletterEmail.value.trim();
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(email)) {
        showMyceliumNotice(t('newsletter.invalidEmail'), "Notice");
        return;
      }

      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = t('newsletter.submitting');

      try {
        const newsletterRecord = {
          countryCode: activeCountryCode,
          email: email,
          subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
          language: currentLang, 
          source: 'website_footer'
        };

        await locationCollection('newsletter_subscribers').add(newsletterRecord);

        showMyceliumNotice(t('newsletter.success'), "Subscribed");
        newsletterForm.reset();
      } catch (err) {
        console.error('Subscription failed:', err);
        showMyceliumNotice(t('newsletter.failure'), "Subscription Error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  // 非默认马来西亚地区异步拉取远程目录数据
  if (!isDefaultMalaysia(activeCountryCode)) {
    loadRegionalDirectoryContent();
  } else {
    updateMapPinsLanguage();
  }
}