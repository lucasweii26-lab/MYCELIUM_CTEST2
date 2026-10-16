
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
    }).catch(() => {
      
    });
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
    open:'Chat',
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
      <p>We do not sell, rent or disclose your personal information to third parties for commercial purposes. We may only share data with trusted service providers necessary for community operation, and require them to comply with confidentiality obligations.</p>

      <h4>4. Data Security</h4>
      <p>We adopt appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure or destruction.</p>

      <h4>5. Your Rights</h4>
      <p>You have the right to access, correct or request deletion of your personal information. You may also unsubscribe from promotional messages at any time.</p>

      <h4>6. Contact Us</h4>
      <p>If you have any questions about this Privacy Policy, please contact us at myceliumresidence07@gmail.com.</p>
      <p><em>Last updated: August 2026</em></p>
    `
  },
  terms: {
    title: "Terms of Service",
    content: `
      <h4>1. Acceptance of Terms</h4>
      <p>By accessing and using the MYCELIUM Smart Community website and services, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.</p>
      
      <h4>2. Service Description</h4>
      <p>We provide community information display, facility introduction, event notification, service directory and online feedback functions. Services are provided on an "as is" basis.</p>

      <h4>3. User Obligations</h4>
      <ul>
        <li>Use the website and services in compliance with all applicable laws and regulations</li>
        <li>Do not upload or transmit malicious code, illegal or infringing content</li>
        <li>Do not interfere with or disrupt the normal operation of the website</li>
        <li>Provide true and accurate information when submitting forms</li>
      </ul>

      <h4>4. Disclaimer</h4>
      <p>We do not guarantee uninterrupted or error-free service. We are not liable for any indirect, incidental or consequential damages arising from your use of the service.</p>

      <h4>5. Service Modification</h4>
      <p>We reserve the right to modify or discontinue part or all of the services at any time without prior notice.</p>

      <h4>6. Governing Law</h4>
      <p>These terms are governed by the laws of the jurisdiction where the community is located.</p>
      <p><em>Last updated: August 2026</em></p>
    `
  },
  rules: {
    title: "Community Rules",
    content: `
      <h4>1. Public Area Etiquette</h4>
      <ul>
        <li>Keep public areas clean and tidy; do not litter or dump waste illegally</li>
        <li>Take good care of public facilities and equipment; damage shall be compensated according to price</li>
        <li>Do not occupy public passages or stack private items in common areas</li>
      </ul>

      <h4>2. Quiet Hours</h4>
      <p>Quiet hours are from 10:00 PM to 7:00 AM daily. Please avoid making loud noises that disturb other residents during this period.</p>

      <h4>3. Facility Use Rules</h4>
      <ul>
        <li>Use gym, swimming pool, function room and other facilities in accordance with regulations</li>
        <li>Make reservations in advance where required, and arrive on time</li>
        <li>Minors must be accompanied by adults when using public facilities</li>
      </ul>

      <h4>4. Pet Management</h4>
      <p>Pets must be kept on a leash in public areas. Owners are responsible for cleaning up pet waste. Aggressive pets are prohibited from entering public areas.</p>

      <h4>5. Waste Sorting</h4>
      <p>Please sort domestic waste according to community regulations and dispose of it at designated recycling points.</p>

      <h4>6. Violation Handling</h4>
      <p>Violations of community rules will be reminded first; repeated violations may result in restriction of facility use or further measures in accordance with regulations.</p>
      <p><em>Last updated: August 2026</em></p>
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
      open:'聊天',
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
  announcement: {
    title: '社区公告',
    desc: '获取社区最新新闻、通知及重要公告',
    btn: '立即查看！'
  },
  facilities: {
    title: '社区设施',
    desc: '探索社区设施，包括健身房、游乐场、游泳池等',
    btn: '立即查看！'
  },
  services: {
    title: '本地服务目录',
    desc: '寻找值得信赖的本地服务，例如水管工、电工、清洁人员及技术人员',
    btn: '立即联系！'
  },
  events: {
    title: '社区活动',
    desc: '了解您附近即将举行的社区活动、庆典及各类精彩活动',
    btn: '立即查看！'
  },
  volunteer: {
    title: '志愿者报名',
    desc: '加入我们的志愿者团队，为社区带来积极影响',
    btn: '立即报名！'
  },
  faq: {
    title: '常见问题',
    desc: '快速查找有关社区服务及设施的常见问题解答',
    btn: '立即查看！'
  }
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
  smart: {
    title: "智能设施",
    desc: "体验现代化社区设施与服务，提升日常社区生活品质。",
    modal: {
      title: "智能设施",
      items: {
        digitalPayments: "数字化支付",
        facilityBooking: "设施预约",
        procurement: "采购管理",
        eform: "电子表单"
      }
    }
  },
  safety: {
    title: "社区安全",
    desc: "打造更安全、更紧密的社区环境。",
    modal: {
      title: "社区安全",
      items: {
        contractManagement: "合同管理",
        visitorManagement: "访客管理",
        videoAnalytics: "视频分析",
        virtualPatrol: "虚拟巡逻"
      }
    }
  },
  green: {
    title: "绿色生活",
    desc: "倡导清洁、健康及可持续发展的生活环境。",
    modal: {
      title: "绿色生活",
      items: {
        smartIrrigation: "智能灌溉",
        wasteManagement: "垃圾分类管理",
        evCharging: "新能源充电",
        energyEfficiency: "节能增效"
      }
    }
  },
  connect: {
    title: "联系我们",
    desc: "分享您的想法、意见反馈，并与社区保持联系。",
    tooltip: "点击联系我们"
  }
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
},

legalDocs: {
  privacy: {
    title: "隐私政策",
    content: `
      <h4>1. 我们收集的信息</h4>
      <p>当您提交反馈、报名志愿者活动或使用社区服务时，我们可能会收集您主动提供的个人信息，包括姓名、联系电话、电子邮箱和居住地址。</p>
      
      <h4>2. 信息的使用方式</h4>
      <ul>
        <li>提供和维护社区服务与设施</li>
        <li>发送重要公告、活动通知和服务更新</li>
        <li>回复您的咨询与反馈</li>
        <li>优化社区管理与使用体验</li>
      </ul>

      <h4>3. 信息共享</h4>
      <p>我们不会出售、出租或向第三方披露您的个人信息用于商业目的。仅在社区运营必要时，与可信的服务供应商共享数据，并要求其履行保密义务。</p>

      <h4>4. 数据安全</h4>
      <p>我们采取适当的技术与管理措施，保护您的个人信息免遭未经授权的访问、修改、泄露或销毁。</p>

      <h4>5. 您的权利</h4>
      <p>您有权访问、更正或请求删除您的个人信息，也可以随时退订推广类消息。</p>

      <h4>6. 联系我们</h4>
      <p>如对本隐私政策有任何疑问，请通过 info@mycelium-community.com 联系我们。</p>
      <p><em>最后更新：2026年8月</em></p>
    `
  },
  terms: {
    title: "服务条款",
    content: `
      <h4>1. 条款的接受</h4>
      <p>访问和使用 MYCELIUM 智慧社区网站及服务，即表示您同意受本服务条款约束。如不同意，请立即停止使用。</p>
      
      <h4>2. 服务说明</h4>
      <p>我们提供社区信息展示、设施介绍、活动通知、服务目录和在线反馈等功能。服务按"现状"提供。</p>

      <h4>3. 用户义务</h4>
      <ul>
        <li>遵守所有适用法律法规使用网站及服务</li>
        <li>不上传或传播恶意代码、违法或侵权内容</li>
        <li>不干扰或破坏网站的正常运行</li>
        <li>提交表单时提供真实、准确的信息</li>
      </ul>

      <h4>4. 免责声明</h4>
      <p>我们不保证服务不中断或无错误。对因使用服务而产生的任何间接、附带或后果性损失，我们不承担责任。</p>

      <h4>5. 服务变更</h4>
      <p>我们保留随时修改或终止部分或全部服务的权利，无需提前通知。</p>

      <h4>6. 适用法律</h4>
      <p>本条款受社区所在地法律管辖。</p>
      <p><em>最后更新：2026年8月</em></p>
    `
  },
  rules: {
    title: "社区公约",
    content: `
      <h4>1. 公共区域礼仪</h4>
      <ul>
        <li>保持公共区域整洁，不乱扔垃圾、不违规倾倒废弃物</li>
        <li>爱护公共设施设备，损坏需按价赔偿</li>
        <li>不占用公共通道，不在公共区域堆放私人物品</li>
      </ul>

      <h4>2. 作息与噪音</h4>
      <p>每日 22:00 至次日 7:00 为静音时段。请勿在此期间制造影响其他居民的噪音。</p>

      <h4>3. 设施使用规范</h4>
      <ul>
        <li>按规定使用健身房、泳池、多功能厅等设施</li>
        <li>需预约的设施请提前预约并准时到场</li>
        <li>未成年人使用公共设施须有成人陪同</li>
      </ul>

      <h4>4. 宠物管理</h4>
      <p>宠物进入公共区域必须牵绳，主人负责清理宠物粪便。烈性犬禁止进入公共区域。</p>

      <h4>5. 垃圾分类</h4>
      <p>请按社区规定对生活垃圾进行分类，并投放至指定回收点。</p>

      <h4>6. 违规处理</h4>
      <p>违反社区公约将先予以提醒；屡教不改者可能被限制使用公共设施，或按规定采取进一步措施。</p>
      <p><em>最后更新：2026年8月</em></p>
    `
  }
},
searchKeywords: [
  { keywords: ["公告", "通知", "新闻", "消息", "更新", "紧急", "维修", "下雨", "停水"], action: "announcement", slideIndex: 0 },
  { keywords: ["设施", "地图", "健身房", "泳池", "游泳池", "游乐场", "公园", "网球", "篮球", "会所", "停车场", "池塘", "垃圾分类", "平面图"], action: "map", slideIndex: 1 },
  { keywords: ["服务", "目录", "水管工", "电工", "保洁", "维修", "空调", "木工", "油漆", "园艺", "医生", "联系"], action: "service", slideIndex: 2 },
  { keywords: ["活动", "日历", "植树", "清洁", "跑步", "庆典", "七月", "八月"], action: "calendar", slideIndex: 3 },
  { keywords: ["志愿者", "报名", "加入", "帮忙", "注册", "义工"], action: "volunteer", slideIndex: 4 },
  { keywords: ["常见问题", "问题", "解答", "规则", "会员", "报修", "安全", "静音", "宠物", "停车", "订阅"], action: "faq", slideIndex: 5 }
]
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
    faq: {
      title: 'Soalan Lazim'
    },

    chatbot: {
      open:'Bual',
  title: 'Pembantu Komuniti',
  placeholder: 'Taip mesej anda...',
  send: 'Hantar',
  welcome: 'Hai, apa yang boleh saya bantu hari ini?',
  thinking: 'Fikir...',
  report: 'Maklum Balas',
  error: 'Maaf, saya tidak begitu faham. Anda boleh cuba tanya tentang acara, kemudahan, perkhidmatan atau pendaftaran sukarelawan.',
  thankFeedback: 'Terima kasih atas maklum balas anda',
  quickReply: {
    announcement: 'Pengumuman',
    facilities: 'Kemudahan',
    services: 'Perkhidmatan',
    events: 'Acara',
    volunteer: 'Sukarelawan',
    faq: 'Soalan Lazim'
  },
  replies: {
    announcement: "Pengumuman Komuniti Terkini:\n\n• 30 Jul - Amaran hujan lebat (2pm-8pm)\n• 24 Ogos - Gangguan bekalan air (9am-4pm)\n• 15 Ogos - Mesyuarat tahunan komuniti\n\nBuka halaman Pengumuman untuk melihat semua kategori dan butiran penuh.",
    greeting: "Hai! Apa yang boleh saya bantu hari ini? Anda boleh tanya tentang acara, kemudahan, perkhidmatan, pendaftaran sukarelawan atau soalan lazim.",
    events: "Acara Komuniti Akan Datang:\n\n• 1 Ogos - Hari Menanam Pokok\n• 9 Ogos - Hari Pembersihan Kejiranan\n• 22 Ogos - Fun Run\n\nBuka halaman Kalendar Acara untuk melihat butiran penuh dan maklumat pendaftaran.",
    volunteer: "Anda boleh mendaftar di halaman Pendaftaran Sukarelawan. Kami ada 3 aktiviti: Hari Menanam Pokok, Pembersihan Kejiranan dan Marshal Fun Run. Klik 'DAFTAR SEKARANG!' pada slaid sukarelawan untuk isi borang.",
    facilities: "Buka Peta Kemudahan Interaktif untuk melihat semua kemudahan. Ia menandakan 11 lokasi termasuk gimnasium, kolam renang, taman permainan dan rumah kelab. Anda juga boleh cari kemudahan tertentu di bar carian atas.",
    faq: "Lawati bahagian Soalan Lazim untuk jawatan tentang keahlian, tempahan kemudahan, peraturan komuniti dan laporan penyelenggaraan. Anda juga boleh guna bar carian untuk cari kandungan dengan cepat.",
    services: "Direktori Perkhidmatan Tempatan ada hubungan untuk 8 jenis perkhidmatan tempatan dipercayai termasuk tukang paip, juruelektrik dan juruteknik penyaman udara. Buka direktori untuk lihat nombor telefon dan e-mel.",
    thank: "Sama-sama! Jangan segan tanya jika ada soalan lain.",
    contact: "Anda boleh hubungi pejabat pengurusan komuniti di +60 10-557 0900 atau e-mel myceliumresidence07@gmail.com. Waktu pejabat adalah 9am-6pm pada hari bekerja."
  }
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
  errorAlert: 'Maaf, terdapat ralat semasa menghantar maklum balas anda. Sila cuba lagi atau e-mel kami terus.'
},
    slider: {
  announcement: {
    title: 'PENGUMUMAN',
    desc: 'Ikuti berita dan notis terkini daripada komuniti anda',
    btn: 'LIHAT SEKARANG!'
  },
  facilities: {
    title: 'KEMUDAHAN',
    desc: 'Terokai kemudahan komuniti termasuk gimnasium, taman permainan, kolam renang dan banyak lagi',
    btn: 'LIHAT SEKARANG!'
  },
  services: {
    title: 'DIREKTORI PERKHIDMATAN TEMPATAN',
    desc: 'Cari perkhidmatan tempatan yang dipercayai seperti tukang paip, juruelektrik, pembersih dan juruteknik',
    btn: 'HUBUNGI SEKARANG!'
  },
  events: {
    title: 'ACARA',
    desc: 'Temui acara, aktiviti dan sambutan komuniti yang akan datang berhampiran anda',
    btn: 'LIHAT SEKARANG!'
  },
  volunteer: {
    title: 'PENDAFTARAN SUKARELAWAN',
    desc: 'Sertai pasukan sukarelawan kami dan berikan impak positif kepada komuniti',
    btn: 'DAFTAR SEKARANG!'
  },
  faq: {
    title: 'SOALAN LAZIM',
    desc: 'Dapatkan jawapan pantas kepada soalan lazim mengenai perkhidmatan dan kemudahan komuniti',
    btn: 'LIHAT SEKARANG!'
  }
},

mapPins: {
      tennis: { name: 'Padang tenis', desc: 'Padang tenis berhampiran pintu masuk depan, bersebelahan barisan rumah hadapan.' },
      clubhouse: { name: 'Rumah Kelab', desc: 'Bangunan utama komuniti, bersebelahan dek kolam dan padang rumput terbuka di tengah kawasan perumahan.' },
      pool: { name: 'Kolam utama', desc: 'Kolam renang utama komuniti dengan dek matahari, kerusi berehat dan payung, betul-betul sebelah rumah kelab.' },
      playground: { name: 'Taman permainan', desc: 'Kawasan permainan berasaskan pasir dengan peralatan gelongsor, betul-betul di belakang rumah kelab.' },
      park: { name: 'Taman komuniti', desc: 'Padang rumput hijau terbuka dengan laluan jalan kaki bulat, di sebelah timur harta tanah.' },
      parking: { name: 'Tempat letak kereta tetamu', desc: 'Tempat letak kereta bergaris untuk penduduk dan pelawat, di selatan rumah kelab.' },
      basketball: { name: 'Padang bola keranjang', desc: 'Padang bola keranjang berhampiran rumah sudut barat daya.' },
      gym: { name: 'Gimnasium', desc: 'Rumah bumbung kelabu di sebelah padang bola keranjang, digunakan sebagai gim komuniti.' },
      pond: { name: 'Kolam hiasan', desc: 'Kolam semula jadi di pinggir tenggara komuniti, dikelilingi pokok-pokok.' },
      recycle1: { name: 'Pusat kitar semula', desc: 'Pusat kitar semula berhampiran tempat letak kereta tetamu.' },
      recycle2: { name: 'Pusat kitar semula', desc: 'Pusat kitar semula berhampiran barisan rumah belakang.' }
    },

    features: {
  tooltip: "KLIK UNTUK MAKLUMAT LANJUTAN",
  smart: {
    title: "KEMUDAHAN PINTAR",
    desc: "Nikmati kemudahan dan perkhidmatan moden untuk meningkatkan kualiti hidup komuniti.",
    modal: {
      title: "Kemudahan Pintar",
      items: {
        digitalPayments: "Pembayaran Digital",
        facilityBooking: "Tempahan Kemudahan",
        procurement: "Perolehan",
        eform: "Borang Elektronik"
      }
    }
  },
  safety: {
    title: "KESELAMATAN KOMUNITI",
    desc: "Mewujudkan persekitaran kejiranan yang lebih selamat dan terhubung.",
    modal: {
      title: "Keselamatan Komuniti",
      items: {
        contractManagement: "Pengurusan Kontrak",
        visitorManagement: "Pengurusan Pelawat",
        videoAnalytics: "Analisis Video",
        virtualPatrol: "Rondaan Maya"
      }
    }
  },
  green: {
    title: "HIDUP HIJAU",
    desc: "Menggalakkan persekitaran yang bersih, sihat dan mampan.",
    modal: {
      title: "Hidup Hijau",
      items: {
        smartIrrigation: "Pengairan Pintar",
        wasteManagement: "Pengurusan Sisa",
        evCharging: "Pengecasan EV",
        energyEfficiency: "Kecekapan Tenaga"
      }
    }
  },
  connect: {
    title: "HUBUNGI KAMI",
    desc: "Kongsi idea, maklum balas dan kekal berhubung dengan komuniti.",
    tooltip: "KLIK UNTUK HUBUNGI"
  }
},

footer: {
  tagline: 'MEMPERKASA KESIHATAN MEMPERKAYA KEHIDUPAN',
  desc: 'Membina komuniti yang lebih pintar, hijau dan saling berhubung untuk semua penduduk.',
  quickLinks: 'Pautan Pantas',
  linkAnnouncement: 'Pengumuman',
  linkMap: 'Peta Kemudahan',
  linkService: 'Direktori Perkhidmatan',
  linkEvent: 'Kalendar Acara',
  linkVolunteer: 'Sukarelawan',
  linkFaq: 'Soalan Lazim',
  contactTitle: 'Hubungi Kami',
  contactAddr: '📍 Pejabat Pengurusan, Rumah Kelab Aras 1',
  contactPhone: '📞 +6010-5570900',
  contactEmail: '✉ myceliumresidence07@gmail.com',
  contactHour: '🕘 Isnin – Jumaat: 9.00 pagi – 6.00 petang',
  newsletterTitle: 'Buletin',
  newsletterDesc: 'Langgan untuk mendapatkan kemas kini komuniti dan notis acara setiap minggu.',
  newsletterBtn: 'Langgan',
  newsletterPlaceholder: 'Masukkan alamat e-mel anda',
  copyright: '© 2026 Komuniti Pintar MYCELIUM. Hak cipta terpelihara.',
  privacy: 'Dasar Privasi',
  terms: 'Terma Perkhidmatan',
  rules: 'Peraturan Komuniti'
},

legalDocs: {
  privacy: {
    title: "Dasar Privasi",
    content: `
      <h4>1. Maklumat Yang Kami Kumpul</h4>
      <p>Kami mungkin mengumpul maklumat peribadi yang anda berikan secara sukarela, termasuk nama, nombor telefon, alamat e-mel dan alamat rumah apabila anda menghantar maklum balas, mendaftar aktiviti sukarelawan atau menggunakan perkhidmatan komuniti.</p>
      
      <h4>2. Cara Kami Menggunakan Maklumat Anda</h4>
      <ul>
        <li>Menyediakan dan menyelenggara perkhidmatan serta kemudahan komuniti</li>
        <li>Menghantar pengumuman penting, notis acara dan kemas kini perkhidmatan</li>
        <li>Menjawab pertanyaan dan maklum balas anda</li>
        <li>Meningkatkan pengurusan komuniti dan pengalaman pengguna</li>
      </ul>

      <h4>3. Perkongsian Maklumat</h4>
      <p>Kami tidak menjual, menyewa atau mendedahkan maklumat peribadi anda kepada pihak ketiga untuk tujuan komersial. Kami hanya mungkin berkongsi data dengan pembekal perkhidmatan yang dipercayai untuk operasi komuniti, dan mewajibkan mereka mematuhi kewajipan sulit.</p>

      <h4>4. Keselamatan Data</h4>
      <p>Kami mengambil langkah teknikal dan organisasi yang sesuai untuk melindungi maklumat peribadi anda daripada akses tanpa kebenaran, pengubahan, pendedahan atau pemusnahan.</p>

      <h4>5. Hak Anda</h4>
      <p>Anda mempunyai hak untuk mengakses, membetulkan atau meminta penghapusan maklumat peribadi anda. Anda juga boleh berhenti menerima mesej promosi pada bila-bila masa.</p>

      <h4>6. Hubungi Kami</h4>
      <p>Sekiranya anda mempunyai sebarang soalan mengenai Dasar Privasi ini, sila hubungi kami di info@mycelium-community.com.</p>
      <p><em>Kemas kini terakhir: Ogos 2026</em></p>
    `
  },
  terms: {
    title: "Terma Perkhidmatan",
    content: `
      <h4>1. Penerimaan Terma</h4>
      <p>Dengan mengakses dan menggunakan laman web serta perkhidmatan MYCELIUM Smart Community, anda bersetuju untuk terikat oleh Terma Perkhidmatan ini. Jika anda tidak bersetuju, sila hentikan penggunaan dengan segera.</p>
      
      <h4>2. Penerangan Perkhidmatan</h4>
      <p>Kami menyediakan fungsi paparan maklumat komuniti, pengenalan kemudahan, notis acara, direktori perkhidmatan dan maklum balas dalam talian. Perkhidmatan disediakan berdasarkan keadaan sedia ada.</p>

      <h4>3. Kewajipan Pengguna</h4>
      <ul>
        <li>Menggunakan laman web dan perkhidmatan dengan mematuhi semua undang-undang dan peraturan yang berkuat kuasa</li>
        <li>Tidak memuat naik atau menghantar kod berniat jahat, kandungan haram atau melanggar hak cipta</li>
        <li>Tidak mengganggu atau mengganggu operasi normal laman web</li>
        <li>Memberi maklumat yang benar dan tepat apabila menghantar borang</li>
      </ul>

      <h4>4. Penafian Tanggungjawab</h4>
      <p>Kami tidak menjamin perkhidmatan tidak terganggu atau bebas daripada kesilapan. Kami tidak bertanggungjawab ke atas sebarang kerosakan tidak langsung, sampingan atau akibat yang timbul daripada penggunaan perkhidmatan anda.</p>

      <h4>5. Pengubahsuaian Perkhidmatan</h4>
      <p>Kami berhak untuk mengubah atau memberhentikan sebahagian atau keseluruhan perkhidmatan pada bila-bila masa tanpa notis terlebih dahulu.</p>

      <h4>6. Undang-undang Yang Berkuat Kuasa</h4>
      <p>Terma ini tertakluk kepada undang-undang bidang kuasa di mana komuniti terletak.</p>
      <p><em>Kemas kini terakhir: Ogos 2026</em></p>
    `
  },
  rules: {
    title: "Peraturan Komuniti",
    content: `
      <h4>1. Etika Kawasan Awam</h4>
      <ul>
        <li>Kekalkan kebersihan kawasan awam; jangan buang sampah merata atau buang sisa secara haram</li>
        <li>Jaga kemudahan dan peralatan awam dengan baik; kerosakan perlu diberi ganti mengikut harga</li>
        <li>Jangan menduduki laluan awam atau menyusun barang peribadi di kawasan bersama</li>
      </ul>

      <h4>2. Waktu Senyap</h4>
      <p>Waktu senyap adalah dari 10:00 malam hingga 7:00 pagi setiap hari. Sila elakkan membuat bunyi bising yang mengganggu penduduk lain dalam tempoh ini.</p>

      <h4>3. Peraturan Penggunaan Kemudahan</h4>
      <ul>
        <li>Gunakan gimnasium, kolam renang, dewan serbaguna dan kemudahan lain mengikut peraturan</li>
        <li>Buat tempahan awal jika diperlukan, dan tiba tepat pada masanya</li>
        <li>Kanak-kanak bawah umur mesti ditemani orang dewasa apabila menggunakan kemudahan awam</li>
      </ul>

      <h4>4. Pengurusan Haiwan Peliharaan</h4>
      <p>Haiwan peliharaan mesti diikat tali di kawasan awam. Pemilik bertanggungjawab membersihkan sisa haiwan. Haiwan yang agresif dilarang memasuki kawasan awam.</p>

      <h4>5. Pengasingan Sisa</h4>
      <p>Sila asingkan sisa domestik mengikut peraturan komuniti dan buang di titik kitar semula yang ditetapkan.</p>

      <h4>6. Pengendalian Pelanggaran</h4>
      <p>Pelanggaran peraturan komuniti akan diberi peringatan terlebih dahulu; pelanggaran berulang boleh mengakibatkan sekatan penggunaan kemudahan atau langkah selanjutnya mengikut peraturan.</p>
      <p><em>Kemas kini terakhir: Ogos 2026</em></p>
    `
  }
},
searchKeywords: [
  { keywords: ["pengumuman", "berita", "notis", "kemas kini", "kecemasan", "penyelenggaraan", "hujan", "bekalan air"], action: "announcement", slideIndex: 0 },
  { keywords: ["kemudahan", "peta", "gim", "kolam", "berenang", "taman permainan", "taman", "tenis", "kereta", "rumah kelab", "tempat letak kereta", "kolam", "kitar semula", "pelan tapak"], action: "map", slideIndex: 1 },
  { keywords: ["perkhidmatan", "direktori", "tukang paip", "juruelektrik", "pembersih", "baiki", "penyaman udara", "tukang kayu", "tukang cat", "tukang landskap", "doktor", "hubungi"], action: "service", slideIndex: 2 },
  { keywords: ["acara", "kalendar", "aktiviti", "tanam pokok", "pembersihan", "lari santai", "sambutan", "julai", "ogos"], action: "calendar", slideIndex: 3 },
  { keywords: ["sukarelawan", "daftar", "sertai", "bantu", "daftar masuk", "marshal"], action: "volunteer", slideIndex: 4 },
  { keywords: ["soalan lazim", "soalan", "jawapan", "cara", "peraturan", "keahlian", "lapor", "masalah", "keselamatan", "waktu senyap", "haiwan peliharaan", "letak kereta", "surat berita"], action: "faq", slideIndex: 5 }
]
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
      subtitle: 'உங்கள் சமூகத்தின் சமீபத்திய செய்திகள் மற்றும் அறிவிப்புகளை அறிந்து கொள்ளுங்கள்',
      tabAll: 'அனைத்தும்',
      tabEmergency: 'அவசரம்',
      tabMaintenance: 'பராமரிப்பு',
      tabCommunity: 'சமூகம்',
      tabEvents: 'நிகழ்வுகள்'
    },
    map: {
      title: 'சமூக வசதி வரைபடம்',
      hint: 'வசதி விவரங்களைக் காண முள்ளைக் கிளிக் செய்யவும்'
    },
    calendar: {
      title: 'சமூக நிகழ்வு நாட்காட்டி',
      hint: 'நிகழ்வு விவரங்களைக் காண நட்சத்திர தேதியைக் கிளிக் செய்யவும்',
      prev: '‹',
      next: '›'
    },
    service: {
      title: 'உள்ளூர் சேவை அடைவு',
      phone: 'தொலைபேசி',
      email: 'மின்னஞ்சல்'
    },
    volunteer: {
      registerNow: 'இப்போதே பதிவு செய்யவும்',
      formTitle: 'தொண்டு பதிவு படிவம்',
      fullName: 'முழு பெயர்',
      phone: 'தொலைபேசி எண்',
      address: 'வீட்டு முகவரி',
      notes: 'குறிப்புகள் / தேவைகள் (விரும்பினால்)',
      submitBtn: 'பதிவை சமர்ப்பிக்கவும்',
      submitting: 'அனுப்புகிறது...',
      requiredTip: 'தயவுசெய்து உங்கள் பெயர், தொலைபேசி எண்ணை நிரப்பி நடவடிக்கையைத் தேர்ந்தெடுக்கவும்.',
      successTip: 'நன்றி! உங்கள் பதிவு சமர்ப்பிக்கப்பட்டது. விரைவில் நாங்கள் உங்களைத் தொடர்பு கொள்வோம்.',
      errorTip: 'சமர்ப்பிப்பது தோல்வியடைந்தது, நெட்வொர்க்கைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
          card1: {
      title: 'மர நாட்டும் நாள்',
      date: '1 ஆகஸ்ட் 2026 · காலை 8:00 · சமூக பூங்கா',
      desc: 'சமூகம் முழுவதும் மரங்களை நட்டு எங்கள் சுற்றுப்புறத்தை அழகாக்கி சுற்றுச்சூழல் விழிப்புணர்வை அதிகரிக்க உதவுங்கள்.',
      bring: 'கொண்டு வர வேண்டியவை: தோட்டக் கையுறை, சிற்றுண்டி, மறுபயன்பாடு நீர் பாட்டில்',
      btn: 'இப்போதே பதிவு செய்யவும்'
    },
    card2: {
      title: 'சுற்றுப்புற சுத்திகரிப்பு நாள்',
      date: '9 ஆகஸ்ட் 2026 · காலை 9:00 · விருந்தினர் பார்க்கிங்',
      desc: 'குளம் மற்றும் பூங்காவை சுற்றி நடந்து சுத்தம் செய்யுங்கள், எங்கள் சமூகத்தை நேர்த்தியாகவும் பசுமையாகவும் வைத்திருக்க உதவுங்கள்.',
      bring: 'கொண்டு வர வேண்டியவை: கையுறை, முகக்கவசம், குப்பை பிடிப்பான் (குப்பை பைகள் வழங்கப்படும்)',
      btn: 'இப்போதே பதிவு செய்யவும்'
    },
    card3: {
      title: 'ஃபன் ரன் மார்ஷல்',
      date: '22 ஆகஸ்ட் 2026 · காலை 7:00 · சமூக பூங்கா',
      desc: 'ஓட்டப் பாதையில் மார்ஷலாக ஓடுபவர்களுக்கு வழிகாட்டுதல் மற்றும் பானங்களை விநியோகித்தல்.',
      bring: 'கொண்டு வர வேண்டியவை: வசதியான காலணிகள், தொப்பி, மறுபயன்பாடு நீர் பாட்டில்',
      btn: 'இப்போதே பதிவு செய்யவும்'
    }
    },
    faq: {
      title: 'அடிக்கடி கேட்கப்படும் கேள்விகள்'
    },

    chatbot: {
      open:'பேச்சு',
  title: 'சமூக உதவியாளர்',
  placeholder: 'உங்கள் செய்தியை உள்ளிடவும்...',
  send: 'அனுப்பவும்',
  welcome: 'வணக்கம், இன்று என்ன உதவி செய்யலாம்?',
  thinking: 'யோசிக்கிறது...',
  report: 'கருத்து',
  error: 'மன்னிக்கவும், அதை நான் நன்றாக புரிந்து கொள்ளவில்லை. நிகழ்வுகள், வசதிகள், சேவைகள் அல்லது தன்னார்வ பதிவு பற்றி கேட்கலாம்.',
  thankFeedback: 'உங்கள் கருத்துக்கு நன்றி',
  quickReply: {
    announcement: 'அறிவிப்புகள்',
    facilities: 'வசதிகள்',
    services: 'சேவைகள்',
    events: 'நிகழ்வுகள்',
    volunteer: 'தன்னார்வலர்',
    faq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்'
  },
  replies: {
    announcement: "சமீபத்திய சமூக அறிவிப்புகள்:\n\n• ஜூலை 30 - கடுமையான மழை எச்சரிக்கை (மதியம் 2 மணி - மாலை 8 மணி)\n• ஆகஸ்ட் 24 - நீர் வழங்கல் குறைபாடு (காலை 9 மணி - மாலை 4 மணி)\n• ஆகஸ்ட் 15 - வருடாந்திர சமூக கூட்டம்\n\nஅனைத்து வகைகளையும் முழு விவரங்களுடன் பார்க்க அறிவிப்புகள் பக்கத்தைத் திறக்கவும்.",
    greeting: "வணக்கம்! இன்று என்ன உதவி செய்யலாம்? நிகழ்வுகள், வசதிகள், சேவைகள், தன்னார்வ பதிவு அல்லது அடிக்கடி கேட்கப்படும் கேள்விகள் பற்றி கேட்கலாம்.",
    events: "வரவிருக்கும் சமூக நிகழ்வுகள்:\n\n• ஆகஸ்ட் 1 - மர நாட்டும் நாள்\n• ஆகஸ்ட் 9 - சுற்றுப்புற சுத்திகரிப்பு நாள்\n• ஆகஸ்ட் 22 - வேடிக்கை ஓட்டம்\n\nமுழு விவரங்கள் மற்றும் பதிவு தகவல்களுக்கு நிகழ்வு நாட்காட்டி பக்கத்தைத் திறக்கவும்.",
    volunteer: "தன்னார்வ பதிவு பக்கத்தில் பதிவு செய்யலாம். தற்போது 3 செயல்பாடுகள் உள்ளன: மர நாட்டும் நாள், சுற்றுப்புற சுத்திகரிப்பு, வேடிக்கை ஓட்ட மார்ஷல். தன்னார்வ ஸ்லைடில் 'இப்போதே பதிவு செய்யவும்' என்பதைக் கிளிக் செய்து படிவத்தை நிரப்பவும்.",
    facilities: "உரையாடல் வசதி வரைபடத்தைத் திறந்து அனைத்து வசதிகளையும் பார்க்கலாம். ஜிம், நீச்சல் குளம், குழந்தைகள் விளையாட்டு மைதானம், கிளப் ஹவுஸ் உட்பட 11 இடங்களைக் குறிக்கிறது. மேல் தேடல் பட்டியில் குறிப்பிட்ட வசதிகளைத் தேடலாம்.",
    faq: "அங்காதார உறுப்பினர், வசதி முன்பதிவு, சமூக விதிகள், பராமரிப்பு அறிக்கை பற்றிய பதில்களுக்கு அடிக்கடி கேட்கப்படும் கேள்விகள் பக்கத்தைப் பார்க்கவும். தேடல் பட்டியைப் பயன்படுத்தி விரைவாக உள்ளடக்கத்தைக் கண்டறியலாம்.",
    services: "உள்ளூர் சேவை அடைவில் குழாய் தொழிலாளி, மின் நிபுணர், காலர் டெக்னிஷன் உள்பட 8 வகை நம்பகமான உள்ளூர் சேவைகளின் தொடர்புகள் உள்ளன. தொலைபேசி எண்கள் மற்றும் மின்னஞ்சல்களைப் பார்க்க அடைவைத் திறக்கவும்.",
    thank: "சரி மன்னிக்கவும். வேறு ஏதேனும் கேள்விகள் இருந்தால் தயங்காமல் கேளுங்கள்.",
    contact: "சமூக நிர்வாக அலுவலகத்தை +60 10-557 0900 அல்லது myceliumresidence07@gmail.com மின்னஞ்சல் மூலம் தொடர்பு கொள்ளலாம். அலுவலக நேரம் வார நாட்கள் காலை 9 மணி முதல் மாலை 6 மணி வரை."
  }
},
report: {
  title: 'கருத்தை சமர்ப்பிக்கவும்',
  name: 'பெயர்',
  surname: 'குடும்ப பெயர்',
  contactNumber: 'தொடர்பு எண்',
  email: 'மின்னஞ்சல் முகவரி',
  address: 'வீட்டு முகவரி',
  message: 'உங்கள் செய்தியை எழுதவும்',
  subscribe: 'பிரச்சாரங்கள் பற்றிய புதுப்பிப்புகளைப் பெற விரும்புகிறேன்',
  submit: 'சமர்ப்பிக்கவும்',
  successAlert: 'உங்கள் கருத்துக்கு நன்றி! உங்கள் அறிக்கையை நாம் பெற்றுவிட்டோம், 48 மணி நேரத்திற்குள் பதிலளிப்போம்.',
  errorAlert: 'மன்னிக்கவும், உங்கள் கருத்தை சமர்ப்பிக்கும் போது பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும் அல்லது நேரடியாக எங்களுக்கு மின்னஞ்சல் அனுப்பவும்.'
},
    slider: {
  announcement: {
    title: 'அறிவிப்புகள்',
    desc: 'உங்கள் சமூகத்தின் சமீபத்திய செய்திகள் மற்றும் அறிவிப்புகளை அறிந்து கொள்ளுங்கள்',
    btn: 'இப்போது பார்க்கவும்!'
  },
  facilities: {
    title: 'வசதிகள்',
    desc: 'உடற்பயிற்சி கூடம், விளையாட்டு மைதானம், நீச்சல் குளம் உள்ளிட்ட சமூக வசதிகளை அறிந்து கொள்ளுங்கள்',
    btn: 'இப்போது பார்க்கவும்!'
  },
  services: {
    title: 'உள்ளூர் சேவை அடைவு',
    desc: 'குழாய் பழுதுபார்ப்பாளர், மின்சார நிபுணர், தூய்மை பணியாளர் மற்றும் தொழில்நுட்ப நிபுணர்கள் போன்ற நம்பகமான உள்ளூர் சேவைகளை கண்டறியுங்கள்',
    btn: 'இப்போது தொடர்பு கொள்ளுங்கள்!'
  },
  events: {
    title: 'நிகழ்வுகள்',
    desc: 'உங்களுக்கு அருகில் நடைபெறவுள்ள சமூக நிகழ்வுகள், செயல்பாடுகள் மற்றும் கொண்டாட்டங்களை அறிந்து கொள்ளுங்கள்',
    btn: 'இப்போது பார்க்கவும்!'
  },
  volunteer: {
    title: 'தன்னார்வலர் பதிவு',
    desc: 'எங்கள் தன்னார்வலர் குழுவில் இணைந்து சமூகத்தில் நேர்மறையான மாற்றத்தை ஏற்படுத்துங்கள்',
    btn: 'இப்போது பதிவு செய்யுங்கள்!'
  },
  faq: {
    title: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    desc: 'சமூக சேவைகள் மற்றும் வசதிகள் தொடர்பான அடிக்கடி கேட்கப்படும் கேள்விகளுக்கான விரைவான பதில்களைப் பெறுங்கள்',
    btn: 'இப்போது பார்க்கவும்!'
  }
},
mapPins: {
      tennis: { name: 'டென்னிஸ் கோர்ட்', desc: 'முன் நுழைவு வாசலுக்கு அருகில், முன் வீடுகள் வரிசைக்கு அருகில் உள்ள டென்னிஸ் கோர்ட்.' },
      clubhouse: { name: 'கிளப்ஹவுஸ்', desc: 'சமூக முக்கிய கட்டிடம், குளம் திட்டம் மற்றும் திறந்த புல் சமூக மையத்திற்கு அருகில் அமைந்துள்ளது.' },
      pool: { name: 'முக்கிய குளம்', desc: 'சூரிய ஒளி திட்டம், படுக்கை நாற்காலிகள் மற்றும் குடைகள் கொண்ட சமூக முக்கிய குளம், கிளப்ஹவுஸுக்கு அடுத்தது.' },
      playground: { name: 'விளையாட்டு மைதானம்', desc: 'மண் அடிப்படையிலான விளையாட்டு பகுதி, சறுக்கல் உபகரணங்கள் கொண்டது, கிளப்ஹவுஸுக்கு பின்னால் உள்ளது.' },
      park: { name: 'சமூக பூங்கா', desc: 'திறந்த பசுமை புல் மற்றும் வட்ட நடைபாதை உள்ளது, சொத்தின் கிழக்கு பக்கத்தில் உள்ளது.' },
      parking: { name: 'விருந்தினர் பார்க்கிங்', desc: 'குடியிருப்பாளர்கள் மற்றும் பார்வையாளர்களுக்கான வரிசை பார்க்கிங் பகுதி, கிளப்ஹவுஸிற்கு தெற்கே உள்ளது.' },
      basketball: { name: 'கைப்பந்து கோர்ட்', desc: 'தென்மேற்கு மூல வீடுகளுக்கு அருகில் உள்ள கைப்பந்து கோர்ட்.' },
      gym: { name: 'ஜிம்', desc: 'கைப்பந்து கோர்ட்டுக்கு அருகில் சாம்பல் கூரை வீடு, சமூக உடற்பயிற்சி மையமாக பயன்படுத்தப்படுகிறது.' },
      pond: { name: 'குளம்', desc: 'சமூகத்தின் தென்கிழக்கு விளிம்பில் மரங்களால் சூழப்பட்ட இயற்கை குளம்.' },
      recycle1: { name: 'மறுசுழற்சி மையம்', desc: 'விருந்தினர் பார்க்கிங்கிற்கு அருகில் மறுசுழற்சி மையம்.' },
      recycle2: { name: 'மறுசுழற்சி மையம்', desc: 'கீழ் வரிசை வீடுகளுக்கு அருகில் மறுசுழற்சி மையம்.' }
    },

    features: {
  tooltip: "மேலும் அறிய கிளிக் செய்யவும்",
  smart: {
    title: "ஸ்மார்ட் வசதிகள்",
    desc: "அன்றாட சமூக வாழ்க்கையை மேம்படுத்த வடிவமைக்கப்பட்ட நவீன வசதிகள் மற்றும் சேவைகளைப் பயன்படுத்துங்கள்.",
    modal: {
      title: "ஸ்மார்ட் வசதிகள்",
      items: {
        digitalPayments: "டிஜிட்டல் கட்டணங்கள்",
        facilityBooking: "வசதி முன்பதிவு",
        procurement: "கொள்முதல்",
        eform: "மின்னணு படிவம்"
      }
    }
  },
  safety: {
    title: "சமூக பாதுகாப்பு",
    desc: "பாதுகாப்பான மற்றும் இணைந்த சுற்றுப்புறத்தை உருவாக்குதல்.",
    modal: {
      title: "சமூக பாதுகாப்பு",
      items: {
        contractManagement: "ஒப்பந்த மேலாண்மை",
        visitorManagement: "பார்வையாளர் மேலாண்மை",
        videoAnalytics: "வீடியோ பகுப்பாய்வு",
        virtualPatrol: "மெய்நிகர் ரோந்து"
      }
    }
  },
  green: {
    title: "பசுமை வாழ்க்கை",
    desc: "சுத்தமான, ஆரோக்கியமான மற்றும் நிலையான சூழலை ஊக்குவித்தல்.",
    modal: {
      title: "பசுமை வாழ்க்கை",
      items: {
        smartIrrigation: "ஸ்மார்ட் நீர்ப்பாசனம்",
        wasteManagement: "கழிவு மேலாண்மை",
        evCharging: "மின்சார வாகன சார்ஜ்",
        energyEfficiency: "ஆற்றல் திறன்"
      }
    }
  },
  connect: {
    title: "எங்களைத் தொடர்பு கொள்ளுங்கள்",
    desc: "உங்கள் யோசனைகள், கருத்துக்களைப் பகிர்ந்து சமூகத்துடன் தொடர்பு கொண்டிருங்கள்.",
    tooltip: "தொடர்பு கொள்ள கிளிக் செய்யவும்"
  }
},

footer: {
  tagline: 'ஆரோக்கியத்தை மேம்படுத்தி வாழ்க்கையை வளப்படுத்துகிறோம்',
  desc: 'அனைத்து குடியிருப்பாளர்களுக்கும் புத்திசாலித்தனமான, பசுமையான மற்றும் ஒன்றிணைந்த சமூகத்தை உருவாக்குகிறோம்.',
  quickLinks: 'விரைவு இணைப்புகள்',
  linkAnnouncement: 'அறிவிப்புகள்',
  linkMap: 'வசதிகள் வரைபடம்',
  linkService: 'உள்ளூர் சேவை அடைவு',
  linkEvent: 'நிகழ்வுகள் நாட்காட்டி',
  linkVolunteer: 'தன்னார்வலர்',
  linkFaq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
  contactTitle: 'எங்களை தொடர்புகொள்ளுங்கள்',
  contactAddr: '📍 நிர்வாக அலுவலகம், கிளப்ஹவுஸ் முதல் தளம்',
  contactPhone: '📞 +6010-5570900',
  contactEmail: '✉ myceliumresidence07@gmail.com',
  contactHour: '🕘 திங்கள் – வெள்ளி: காலை 9:00 – மாலை 6:00',
  newsletterTitle: 'செய்திமடல்',
  newsletterDesc: 'வாராந்திர சமூக புதுப்பிப்புகள் மற்றும் நிகழ்வு அறிவிப்புகளைப் பெற பதிவு செய்யுங்கள்.',
  newsletterBtn: 'பதிவு செய்யவும்',
  newsletterPlaceholder: 'மின்னஞ்சல் ',
  copyright: '© 2026 MYCELIUM ஸ்மார்ட் சமூகம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டுள்ளன.',
  privacy: 'தனியுரிமைக் கொள்கை',
  terms: 'சேவை விதிமுறைகள்',
  rules: 'சமூக விதிமுறைகள்'
},

legalDocs: {
  privacy: {
    title: "தனியுரிமைக் கொள்கை",
    content: `
      <h4>1. நாம் சேகரிக்கும் தகவல்</h4>
      <p>நீங்கள் கருத்தை சமர்ப்பிக்கும்போது, தன்னார்வ நடவடிக்கைகளுக்குப் பதிவு செய்யும்போது அல்லது சமூக சேவைகளைப் பயன்படுத்தும்போது, நீங்கள் தன்னிச்சையாக வழங்கும் தனிப்பட்ட தகவல்களை (பெயர், தொடர்பு எண், மின்னஞ்சல் முகவரி, வீட்டு முகவரி உட்பட) நாம் சேகரிக்கலாம்.</p>
      
      <h4>2. உங்கள் தகவலை நாம் எவ்வாறு பயன்படுத்துகிறோம்</h4>
      <ul>
        <li>சமூக சேவைகள் மற்றும் வசதிகளை வழங்குவதற்கும் பராமரிப்பதற்கும்</li>
        <li>முக்கிய அறிவிப்புகள், நிகழ்வு அறிவிப்புகள் மற்றும் சேவை புதுப்பிப்புகளை அனுப்புவதற்கு</li>
        <li>உங்கள் விசாரணைகளுக்கும் கருத்துகளுக்கும் பதிலளிப்பதற்கு</li>
        <li>சமூக நிர்வாகத்தையும் பயனர் அனுபவத்தையும் மேம்படுத்துவதற்கு</li>
      </ul>

      <h4>3. தகவல் பகிர்வு</h4>
      <p>வணிக நோக்கத்திற்காக உங்கள் தனிப்பட்ட தகவல்களை நாம் விற்க மாட்டோம், வாடகைக்கு கொடுக்க மாட்டோம் அல்லது மூன்றாம் நபர்களுக்கு வெளிப்படுத்த மாட்டோம். சமூக இயக்கத்திற்கு அவசியமான நம்பகமான சேவை வழங்குனர்களுடன் மட்டும் தரவைப் பகிர்ந்து, அவர்கள் இரகசியத் துறைமுக கடமைகளை பின்பற்ற வேண்டும் என்று கற்பிப்போம்.</p>

      <h4>4. தரவு பாதுகாப்பு</h4>
      <p>உங்கள் தனிப்பட்ட தகவல்களை அங்கீகரிக்கப்படாத அணுகல், மாற்றம், வெளிப்பாடு அல்லது அழிவு ஆகியவற்றிலிருந்து பாதுகாக்க, பொருத்தமான தொழில்நுட்ப மற்றும் நிர்வாக நடவடிக்கைகளை நாம் மேற்கொள்கிறோம்.</p>

      <h4>5. உங்கள் உரிமைகள்</h4>
      <p>உங்கள் தனிப்பட்ட தகவல்களை அணுகவும், சரிசெய்யவும் அல்லது நீக்குமாறு கோரவும் உங்களுக்கு உரிமை உண்டு. ஊக்குவிப்பு செய்திகளிலிருந்து எப்போதும் விலகலாம்.</p>

      <h4>6. எங்களைத் தொடர்பு கொள்ள</h4>
      <p>இந்த தனியுரிமைக் கொள்கையைப் பற்றி ஏதேனும் கேள்விகள் இருந்தால், info@mycelium-community.com முகவரிக்கு எங்களைத் தொடர்பு கொள்ளவும்.</p>
      <p><em>கடைசியாக புதுப்பிக்கப்பட்டது: ஆகஸ்ட் 2026</em></p>
    `
  },
  terms: {
    title: "சேவை விதிமுறைகள்",
    content: `
      <h4>1. விதிமுறைகளை ஏற்றுக்கொள்ளுதல்</h4>
      <p>MYCELIUM ஸ்மார்ட் கம்யூனிடி வலைத்தளம் மற்றும் சேவைகளை அணுகவும் பயன்படுத்தவும் செய்வதன் மூலம், இந்த சேவை விதிமுறைகளுக்கு நீங்கள் உட்பட்டீர்கள் என்று கருதப்படுகிறது. ஏற்கவில்லை என்றால், உடனே பயன்படுத்துவதை நிறுத்தவும்.</p>
      
      <h4>2. சேவை விளக்கம்</h4>
      <p>சமூக தகவல் காட்சி, வசதி அறிமுகம், நிகழ்வு அறிவிப்பு, சேவை அடைவு மற்றும் ஆன்லைன் கருத்து போன்ற செயல்பாடுகளை நாம் வழங்குகிறோம். சேவைகள் "நிலுவையில் உள்ளபடி" வழங்கப்படுகின்றன.</p>

      <h4>3. பயனர் கடமைகள்</h4>
      <ul>
        <li>பொருந்தும் அனைத்து சட்டங்களையும் கடைபிடித்து வலைத்தளம் மற்றும் சேவைகளைப் பயன்படுத்தவும்</li>
        <li>தீங்கு விளைவிக்கும் குறியீடு, சட்டவிரோதமான அல்லது உரிமை மீறும் உள்ளடக்கத்தை பதிவேற்றவும் அல்லது அனுப்பவும் கூடாது</li>
        <li>வலைத்தளத்தின் இயல்பான இயக்கத்தை குறுக்கிடவும் சீர்குலைக்கவும் கூடாது</li>
        <li>பதிவுப் படிவங்களை நிரப்பும்போது உண்மையான, துல்லியமான தகவல்களை வழங்கவும்</li>
      </ul>

      <h4>4. பொறுப்பு நீக்குதல் அறிவிப்பு</h4>
      <p>சேவைகள் இடையூறு இல்லாமல் இருக்கும் அல்லது பிழைகள் இல்லாமல் இருக்கும் என்று நாம் உறுதியளிக்க மாட்டோம். சேவையைப் பயன்படுத்துவதால் ஏற்படும் எந்தவொரு மறைமுக, துணை அல்லது விளைவு இழப்பிற்கும் நாம் பொறுப்பேற்க மாட்டோம்.</p>

      <h4>5. சேவை மாற்றம்</h4>
      <p>முன்கூட்டியே அறிவிக்காமல், எப்போதும் சேவைகளின் ஒரு பகுதியை அல்லது முழுவதும் மாற்ற அல்லது நிறுத்த நாம் வைத்திருக்கும் உரிமை.</p>

      <h4>6. அமலாக்க சட்டம்</h4>
      <p>இந்த விதிமுறைகள் சமூகம் அமைந்துள்ள இடத்தின் சட்டங்களுக்கு உட்பட்டது.</p>
      <p><em>கடைசியாக புதுப்பிக்கப்பட்டது: ஆகஸ்ட் 2026</em></p>
    `
  },
  rules: {
    title: "சமூக விதிகள்",
    content: `
      <h4>1. பொது பகுதி ஒழுக்கம்</h4>
      <ul>
        <li>பொது பகுதிகளை சுத்தமாக வைத்திருக்கவும்; குப்பையை எங்கும் போடக்கூடாது அல்லது சட்டவிரோதமாக கழிவுகளை கொட்டக்கூடாது</li>
        <li>பொது வசதிகள் மற்றும் உபகரணங்களை நன்றாக பார்த்துக்கொள்ளவும்; சேதம் ஏற்பட்டால் விலைக்கு ஈடு செலுத்த வேண்டும்</li>
        <li>பொது பாதைகளை ஆக்கிரமிக்க கூடாது அல்லது பொது பகுதிகளில் தனிப்பட்ட பொருட்களை குவித்து வைக்க கூடாது</li>
      </ul>

      <h4>2. அமைதி நேரம்</h4>
      <p>தினமும் இரவு 10 மணி முதல் காலை 7 மணி வரை அமைதி நேரம். இந்த காலத்தில் மற்ற குடியிருப்பாளர்களைத் தொந்தரவு செய்யும் வகையில் உரத்த ஒலியை ஏற்படுத்த வேண்டாம்.</p>

      <h4>3. வசதி பயன்பாட்டு விதிகள்</h4>
      <ul>
        <li>ஜிம், நீச்சல் குளம், பல்நோக்கு மண்டபம் போன்ற வசதிகளை விதிகளின்படி பயன்படுத்தவும்</li>
        <li>தேவையான இடங்களில் முன்பதிவு செய்து, சரியான நேரத்திற்கு வரவும்</li>
        <li>பொது வசதிகளைப் பயன்படுத்தும்போது குழந்தைகள் பெரியவர்களின் துணையில் இருக்க வேண்டும்</li>
      </ul>

      <h4>4. செல்லப்பிராணி மேலாண்மை</h4>
      <p>பொது பகுதிகளில் செல்லப்பிராணிகளுக்கு கயிறு கட்ட வேண்டும். செல்லப்பிராணியின் கழிவுகளை சுத்தம் செய்வது உரிமையாளரின் பொறுப்ப். ஆக்ரோஷமாக இருக்கும் செல்லப்பிராணிகள் பொது பகுதிகளுக்கு நுழைக்க தடை.</p>

      <h4>5. கழிவு பிரித்தல்</h4>
      <p>சமூக விதிகளின்படி வீட்டு கழிவுகளை பிரித்து, குறிப்பிட்ட மறுசுழற்சி புள்ளிகளில் போடவும்.</p>

      <h4>6. மீறல் கையாளுதல்</h4>
      <p>சமூக விதிகளை மீறினால் முதலில் எச்சரிக்கப்படும்; மீண்டும் மீறினால் வசதி பயன்பாட்டுக்கு கட்டுப்பாடு வைக்கப்படலாம் அல்லது விதிகளின்படி மேலும் நடவடிக்கைகள் எடுக்கப்படலாம்.</p>
      <p><em>கடைசியாக புதுப்பிக்கப்பட்டது: ஆகஸ்ட் 2026</em></p>
    `
  }
},
searchKeywords: [
  { keywords: ["அறிவிப்பு", "செய்தி", "அறிவுத்திறன்", "மேம்படுத்தல்", "அவசரம்", "பராமரிப்பு", "மழை", "நீர் வழங்கல்"], action: "announcement", slideIndex: 0 },
  { keywords: ["வசதிகள்", "வரைபடம்", "ஜிம்", "குளம்", "நீச்சல்", "விளையாட்டு மைதானம்", "பூங்கா", "டென்னிஸ்", "கைப்பந்து", "கிளப்ஹவுஸ்", "பார்க்கிங்", "குளம்", "மறுசுழற்சி", "தளப்படம்"], action: "map", slideIndex: 1 },
  { keywords: ["சேவைகள்", "கோப்பை", "குழாய் தொழிலாளி", "மின் தொழிலாளி", "தூய்மைப் பணி", "பழுது", "காலர்", "மரப்பணி", "வண்ணம்", "தோட்டம்", "மருத்துவர்", "தொடர்பு"], action: "service", slideIndex: 2 },
  { keywords: ["நிகழ்வுகள்", "நாட்காட்டி", "செயல்பாடு", "மர நடவு", "சுத்திகரிப்பு", "வேடிக்கை ஓட்டம்", "கொண்டாட்டம்", "ஜூலை", "ஆகஸ்ட்"], action: "calendar", slideIndex: 3 },
  { keywords: ["தொன்றூராளர்", "பதிவு", "சேர", "உதவி", "பதிவு செய்", "மார்ஷல்"], action: "volunteer", slideIndex: 4 },
  { keywords: ["அடிக்கடி கேட்கப்படும் கேள்விகள்", "கேள்வி", "பதில்", "எப்படி", "விதிகள்", "உறுப்பினர்", "ஏற்பாடு", "பிரச்சனை", "பாதுகாப்பு", "அமைதி நேரம்", "செல்லப்பிராணி", "பார்க்கிங்", "செய்தித்தாள்"], action: "faq", slideIndex: 5 }
],
  }
};

// Merge Spanish UI strings over English so any future untranslated key still has a safe fallback.
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
    kicker: "Participa", title: "Inscripción de voluntarios", subtitle: "Únete al equipo de voluntariado y contribuye a la comunidad.", registerNow: "Inscribirme", formTitle: "Formulario de voluntariado", fullName: "Nombre completo", phone: "Número de teléfono", address: "Dirección", namePlaceholder: "Nombre y apellidos", addressPlaceholder: "Calle, número, ciudad y código postal", notesPlaceholder: "Por ejemplo: restricciones alimentarias o necesidades de accesibilidad", activityLabel: "Actividad:", notes: "Requisitos o notas (opcional)", submitBtn: "Enviar inscripción", submitting: "Enviando...", requiredTip: "Indica tu nombre, teléfono y selecciona una actividad.", successTip: "¡Gracias! Recibimos tu inscripción y nos pondremos en contacto pronto.", errorTip: "No se pudo enviar la inscripción. Comprueba tu conexión e inténtalo de nuevo.",
    card1: { title: "Intercambio de semillas de otoño", date: "24 de octubre de 2026 · Portland", desc: "Comparte semillas, bulbos y esquejes con tus vecinos en el huerto comunitario.", bring: "Consulta con la oficina qué materiales se necesitan.", btn: "Inscribirme" },
    card2: { title: "Carrera comunitaria", date: "7 de noviembre de 2026 · Portland", desc: "Participa en una carrera familiar de 5 km por el sendero arbolado.", bring: "Trae calzado cómodo y agua reutilizable.", btn: "Inscribirme" },
    card3: { title: "Colecta de alimentos", date: "14 de noviembre de 2026 · Portland", desc: "Dona alimentos no perecederos en la casa club para apoyar a los vecinos.", bring: "Trae alimentos no perecederos sin abrir.", btn: "Inscribirme" }
  },
  faq: { title: "Preguntas frecuentes" },
  chatbot: {
    open: "Chat", title: "Asistente comunitario", placeholder: "Escribe un mensaje...", send: "Enviar", welcome: "Hola. ¿En qué puedo ayudarte?", thinking: "Pensando...", report: "Informar", error: "No entendí la pregunta. Puedes consultar los anuncios, las instalaciones, los servicios, los eventos o la inscripción de voluntarios.", thankFeedback: "Gracias por tus comentarios.",
    quickReply: { announcement: "Anuncios", facilities: "Instalaciones", services: "Servicios", events: "Eventos", volunteer: "Voluntariado", faq: "Preguntas frecuentes" },
    replies: {
      announcement: "Consulta la sección de anuncios para ver los avisos actuales de tu comunidad.", greeting: "¡Hola! Puedes preguntarme sobre eventos, instalaciones, servicios, voluntariado o preguntas frecuentes.", events: "Consulta el calendario para ver los próximos eventos y sus detalles.", volunteer: "Abre la sección de voluntariado y selecciona una actividad para inscribirte.", facilities: "Abre el mapa interactivo para ver las instalaciones de esta comunidad.", faq: "Consulta las preguntas frecuentes para obtener información sobre las instalaciones, las reservas y las normas.", services: "Abre el directorio de servicios para consultar los contactos disponibles.", thank: "¡De nada! Si tienes otra pregunta, aquí estoy.", contact: "Consulta la información de contacto que aparece en esta página para comunicarte con la administración local."
    }
  },
  report: { title: "Enviar comentarios", name: "Nombre", surname: "Apellidos", contactNumber: "Teléfono de contacto", email: "Correo electrónico", address: "Dirección", message: "Escribe tu mensaje", subscribe: "Quiero recibir novedades sobre campañas.", submit: "Enviar", successAlert: "¡Gracias por tus comentarios! Recibimos tu informe.", errorAlert: "No se pudo enviar el informe. Inténtalo de nuevo." },
  slider: {
    announcement: { title: "ANUNCIOS", desc: "Consulta las últimas noticias y avisos de tu comunidad.", btn: "VER AHORA" },
    facilities: { title: "INSTALACIONES", desc: "Explora el mapa de instalaciones de la comunidad.", btn: "VER AHORA" },
    services: { title: "DIRECTORIO DE SERVICIOS", desc: "Encuentra servicios locales disponibles para la comunidad.", btn: "CONSULTAR" },
    events: { title: "EVENTOS", desc: "Descubre las actividades y celebraciones de la comunidad.", btn: "VER AHORA" },
    volunteer: { title: "VOLUNTARIADO", desc: "Únete al equipo de voluntariado y contribuye a la comunidad.", btn: "INSCRIBIRME" },
    faq: { title: "PREGUNTAS FRECUENTES", desc: "Encuentra respuestas sobre los servicios e instalaciones.", btn: "VER AHORA" }
  },
  mapPins: {
    tennis: { name: "Cancha de tenis", desc: "Cancha de tenis junto a la entrada principal." }, clubhouse: { name: "Casa club", desc: "Edificio comunitario principal." }, pool: { name: "Piscina principal", desc: "Piscina comunitaria con terraza y tumbonas." }, playground: { name: "Área de juegos", desc: "Zona de juegos infantil detrás de la casa club." }, park: { name: "Parque comunitario", desc: "Zona verde con sendero para caminar." }, parking: { name: "Estacionamiento de visitas", desc: "Estacionamiento para residentes y visitantes." }, basketball: { name: "Cancha de baloncesto", desc: "Cancha de baloncesto en el sector suroeste." }, gym: { name: "Gimnasio", desc: "Gimnasio comunitario junto a la cancha." }, pond: { name: "Estanque", desc: "Estanque natural rodeado de árboles." }, recycle1: { name: "Punto de reciclaje", desc: "Punto de reciclaje cerca del estacionamiento." }, recycle2: { name: "Punto de reciclaje", desc: "Punto de reciclaje junto a las viviendas del extremo sur." }
  },
  features: {
    tooltip: "HAZ CLIC PARA SABER MÁS",
    smart: { title: "INSTALACIONES INTELIGENTES", desc: "Accede a instalaciones y servicios modernos para la vida diaria.", modal: { title: "Instalaciones inteligentes", items: { digitalPayments: "Pagos digitales", facilityBooking: "Reserva de instalaciones", procurement: "Adquisiciones", eform: "Formulario electrónico" } } },
    safety: { title: "SEGURIDAD COMUNITARIA", desc: "Un vecindario más seguro y conectado.", modal: { title: "Seguridad comunitaria", items: { contractManagement: "Gestión de contratos", visitorManagement: "Gestión de visitantes", videoAnalytics: "Análisis de vídeo", virtualPatrol: "Vigilancia virtual" } } },
    green: { title: "VIDA SOSTENIBLE", desc: "Promovemos un entorno limpio, saludable y sostenible.", modal: { title: "Vida sostenible", items: { smartIrrigation: "Riego inteligente", wasteManagement: "Gestión de residuos", evCharging: "Carga para vehículos eléctricos", energyEfficiency: "Eficiencia energética" } } },
    connect: { title: "CONECTA CON NOSOTROS", desc: "Comparte ideas y comentarios y mantente en contacto con la comunidad.", tooltip: "HAZ CLIC PARA CONTACTAR" }
  },
  footer: { tagline: "IMPULSAMOS LA SALUD\nENRIQUECEMOS VIDAS", desc: "Creamos una comunidad más inteligente, sostenible y conectada.", quickLinks: "Enlaces rápidos", linkAnnouncement: "Anuncios", linkMap: "Mapa de instalaciones", linkService: "Directorio de servicios", linkEvent: "Calendario de eventos", linkVolunteer: "Voluntariado", linkFaq: "Preguntas frecuentes", contactTitle: "Contacto", contactAddr: "📍 Oficina de administración, primer piso de la casa club", contactPhone: "📞 +1 (234) 567-8910", contactEmail: "✉ john.smith@company.com", contactHour: "🕘 De lunes a viernes: 9:00–17:00 (hora del Pacífico)", newsletterTitle: "Boletín", newsletterDesc: "Suscríbete para recibir noticias y avisos semanales.", newsletterBtn: "Suscribirme", newsletterPlaceholder: "Escribe tu correo electrónico", copyright: "© 2026 MYCELIUM. Todos los derechos reservados.", privacy: "Política de privacidad", terms: "Términos del servicio", rules: "Normas de la comunidad" },
  legalDocs: {
    privacy: { title: "Política de privacidad", content: "<h4>1. Información que recopilamos</h4><p>Podemos recopilar los datos personales que facilites al enviar comentarios, inscribirte en actividades o utilizar los servicios de la comunidad.</p><h4>2. Uso de la información</h4><p>Usamos la información para prestar servicios, responder consultas y mejorar la gestión de la comunidad.</p><h4>3. Protección de datos</h4><p>No vendemos tus datos personales. Aplicamos medidas para protegerlos frente al acceso no autorizado.</p><h4>4. Contacto</h4><p>Para consultas sobre privacidad, escribe a john.smith@company.com.</p>" },
    terms: { title: "Términos del servicio", content: "<h4>1. Aceptación</h4><p>Al utilizar este sitio, aceptas estos términos.</p><h4>2. Servicios</h4><p>El sitio ofrece información comunitaria, anuncios, eventos, un directorio y formularios en línea.</p><h4>3. Uso responsable</h4><p>Proporciona información correcta y no interfieras con el funcionamiento del sitio.</p><h4>4. Cambios</h4><p>Los servicios pueden actualizarse cuando sea necesario.</p>" },
    rules: { title: "Normas de la comunidad", content: "<h4>1. Áreas comunes</h4><p>Mantén limpias las áreas comunes y cuida las instalaciones.</p><h4>2. Horario de silencio</h4><p>El horario de silencio es de 22:00 a 7:00.</p><h4>3. Mascotas</h4><p>Lleva a las mascotas con correa y recoge sus desechos.</p><h4>4. Residuos</h4><p>Separa los residuos y utiliza los contenedores indicados.</p>" }
  },
  searchKeywords: [
    { keywords: ["anuncios", "avisos", "noticias", "emergencia", "mantenimiento"], action: "announcement", slideIndex: 0 },
    { keywords: ["instalaciones", "mapa", "gimnasio", "piscina", "parque", "casa club", "reciclaje"], action: "map", slideIndex: 1 },
    { keywords: ["servicios", "directorio", "contacto", "reparación"], action: "service", slideIndex: 2 },
    { keywords: ["eventos", "calendario", "actividad"], action: "calendar", slideIndex: 3 },
    { keywords: ["voluntario", "voluntariado", "inscribirme", "registro"], action: "volunteer", slideIndex: 4 },
    { keywords: ["preguntas", "normas", "ayuda", "boletín", "estacionamiento"], action: "faq", slideIndex: 5 }
  ],
  newsletter: { invalidEmail: "Escribe una dirección de correo válida.", submitting: "Enviando...", success: "¡Suscripción completada! Gracias por suscribirte.", failure: "No se pudo completar la suscripción. Inténtalo de nuevo más tarde." }
});

// The intro hero localizes only its description and primary explore action.
i18n.en.heroIntro = {
  description: "A gated residential community built for wellness, safety and connection.",
  explore: "EXPLORE THE COMMUNITY",
  chooseLocation: "CHOOSE YOUR LOCATION",
};
i18n.es.heroIntro = {
  description: "Una comunidad residencial privada diseñada para el bienestar, la seguridad y la conexión.",
  explore: "EXPLORAR LA COMUNIDAD",
  chooseLocation: "ELIGE TU UBICACIÓN",
};
i18n["zh-CN"].heroIntro = {
  description: "一个以身心健康、安全与联结为核心的封闭式住宅社区。",
  explore: "探索社区",
  chooseLocation: "选择所在地区",
};
i18n.ms.heroIntro = {
  description: "Komuniti kediaman berpagar yang dibina demi kesejahteraan, keselamatan dan hubungan erat.",
  explore: "TEROKAI KOMUNITI",
  chooseLocation: "PILIH LOKASI ANDA",
};
i18n.ta.heroIntro = {
  description: "நல்வாழ்வு, பாதுகாப்பு மற்றும் சமூகத் தொடர்பை மையமாகக் கொண்டு உருவாக்கப்பட்ட பாதுகாப்பான குடியிருப்பு சமூகம்.",
  explore: "சமூகத்தை ஆராயுங்கள்",
  chooseLocation: "உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்",
};

// Complete small notification strings in every supported locale as well.
i18n.en.newsletter = { invalidEmail: "Please enter a valid email address.", submitting: "Submitting...", success: "Subscription successful! Thank you for subscribing.", failure: "Subscription failed, please try again later." };
i18n.en.volunteer = { ...i18n.en.volunteer, kicker: "Participate", namePlaceholder: "John Doe", addressPlaceholder: "Street, city and ZIP code", notesPlaceholder: "e.g. dietary restrictions, accessibility needs", activityLabel: "Activity:" };
i18n["zh-CN"].volunteer = { ...i18n["zh-CN"].volunteer, kicker: "参与社区", namePlaceholder: "姓名", addressPlaceholder: "街道、城市和邮政编码", notesPlaceholder: "例如：饮食限制或无障碍需求", activityLabel: "活动：" };
i18n.ms.volunteer = { ...i18n.ms.volunteer, kicker: "Sertai", namePlaceholder: "Nama penuh", addressPlaceholder: "Jalan, bandar dan poskod", notesPlaceholder: "Contoh: pantang makanan atau keperluan aksesibiliti", activityLabel: "Aktiviti:" };
i18n.ta.volunteer = { ...i18n.ta.volunteer, kicker: "பங்கேற்கவும்", namePlaceholder: "முழுப் பெயர்", addressPlaceholder: "தெரு, நகரம் மற்றும் அஞ்சல் குறியீடு", notesPlaceholder: "உதாரணம்: உணவு கட்டுப்பாடுகள் அல்லது அணுகல் தேவைகள்", activityLabel: "செயல்பாடு:" };
i18n["zh-CN"].newsletter = { invalidEmail: "请输入有效的电子邮箱地址。", submitting: "正在提交…", success: "订阅成功！感谢您的订阅。", failure: "订阅失败，请稍后重试。" };
i18n.ms.newsletter = { invalidEmail: "Sila masukkan alamat e-mel yang sah.", submitting: "Sedang menghantar...", success: "Langganan berjaya! Terima kasih.", failure: "Langganan gagal. Sila cuba lagi kemudian." };
i18n.ta.newsletter = { invalidEmail: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.", submitting: "சமர்ப்பிக்கிறது...", success: "சந்தா வெற்றிகரமாக பதிவு செய்யப்பட்டது. நன்றி!", failure: "சந்தா பதிவு தோல்வியடைந்தது. பின்னர் மீண்டும் முயற்சிக்கவும்." };

let currentLang = DEFAULT_LANG;


function t(key) {
  return key.split('.').reduce((obj, k) => obj?.[k], i18n[currentLang]) || key;
}
window.t = t;


function setLanguage(langCode) {
  if (!i18n[langCode]) langCode = DEFAULT_LANG;
  const siteConfig = window.MYCELIUM_COUNTRY_CONFIG;
  if (siteConfig?.languages && !siteConfig.languages.includes(langCode)) langCode = siteConfig.languages[0] || DEFAULT_LANG;
  currentLang = langCode;
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

  if (window.MYCELIUM_COUNTRY === "US") {
    const volunteerPhone = document.getElementById("volPhone");
    if (volunteerPhone) volunteerPhone.placeholder = "+1 (234) 555-0100";
    const footerPhone = document.querySelector('[data-i18n="footer.contactPhone"]');
    if (footerPhone) footerPhone.textContent = "+1 (234) 567-8910";
  }

  
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


function updateMapPinsLanguage() {
  if (window.MYCELIUM_COUNTRY && window.MYCELIUM_COUNTRY !== "MY") return;
  const pins = document.querySelectorAll("#mapOverlay .pin");
  const mapInfoTitle = document.getElementById("mapInfoTitle");
  const mapInfoDesc = document.getElementById("mapInfoDesc");
  const pinData = i18n[currentLang].mapPins;

  pins.forEach(pin => {
    const pinId = pin.dataset.pinId;
    if (!pinId || !pinData[pinId]) return;
    
    
    pin.dataset.name = pinData[pinId].name;
    pin.dataset.desc = pinData[pinId].desc;
    pin.setAttribute("aria-label", pinData[pinId].name);

    
    if (pin.classList.contains("active")) {
      mapInfoTitle.textContent = pinData[pinId].name;
      mapInfoDesc.textContent = pinData[pinId].desc;
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
  // [MYCELIUM UPGRADE] Wait for later deferred scripts before app init; they provide shared globals.
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

function scrollToSlider() {
  const slider = document.querySelector('.slider');
  if (!slider) return;
  const sliderTopToPage = slider.getBoundingClientRect().top + window.scrollY;
  const sliderHeight = slider.offsetHeight;
  const viewportHeight = window.innerHeight;
  const targetScroll = sliderTopToPage + sliderHeight / 2 - viewportHeight / 2;
  if (window.MYCELIUM_LENIS) window.MYCELIUM_LENIS.scrollTo(Math.max(0, targetScroll), { duration: 0.9 });
  else window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
}

// [MYCELIUM UPGRADE] Keep the intro hero action connected to the existing community navigation.
function scrollToNav() {
  const nav = document.getElementById('nav');
  if (!nav) return scrollToSlider();
  scrollPageToElement(nav, { behavior: 'smooth', block: 'start' });
}

function initApp() {
  initLanguage();
  const activeCountryCode = window.MYCELIUM_COUNTRY || "MY";
  let regionServices = null;
  let regionFaqs = null;
  let regionFacilities = [];
  let regionEvents = [];

  const navEl = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  if (navEl && navToggle) {
    navToggle.addEventListener("click", () => {
      const open = !navEl.classList.contains("nav-open");
      navEl.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    window.addEventListener("scroll", () => {
      navEl.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });
  }
  const products = [
    {
      id: 1,
    },
    {
      id: 2,
    },
    {
      id: 3,
    },
    {
      id: 4,
    },
    {
      id: 5,
    },
    {
      id: 6,
    },
  ];

  let choosenProduct = products[0];
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
    
    const bottomWrapper = document.querySelector(".bottomSliderWrapper");
    if (bottomWrapper) {
      bottomWrapper.style.transform = `translateX(${-100 * index}vw)`;
    }
    
    choosenProduct = products[index];
    
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

// Malaysia keeps its original top-level Firestore collections for compatibility.
// New locations use isolated subcollections, for example locations/US/events.
function locationCollection(collectionName) {
  return activeCountryCode === "MY"
    ? db.collection(collectionName)
    : db.collection("locations").doc(activeCountryCode).collection(collectionName);
}

async function loadRegionalDirectoryContent() {
  if (activeCountryCode === "MY") return;
  try {
    const [serviceSnapshot, faqSnapshot, facilitySnapshot, eventSnapshot, communityRulesDoc] = await Promise.all([
      locationCollection("services").get(),
      locationCollection("faqs").get(),
      locationCollection("facilities").get(),
      locationCollection("events").get(),
      locationCollection("rules").doc("community").get(),
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

function applyRegionalMapFacilities(facilities) {
  const positions = window.MYCELIUM_COUNTRY_CONFIG?.mapPins || {};
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
  const visibleIds = new Set();
  facilities.forEach((facility) => {
    const assignment = assignments[facility.id];
    const position = assignment && positions[assignment[1]];
    const pin = assignment && document.querySelector(`#mapOverlay .pin[data-pin-id="${assignment[0]}"]`);
    if (!pin || !position) return;
    visibleIds.add(assignment[0]);
    pin.hidden = false;
    pin.style.display = "";
    pin.style.left = `${position.x}%`;
    pin.style.top = `${position.y}%`;
    pin.dataset.name = facility[`name_${currentLang}`] || facility.name_en || facility.id;
    pin.dataset.desc = facility[`description_${currentLang}`] || facility.description_en || "";
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
  if (activeCountryCode !== "MY") {
    if (regionFacilities.length) applyRegionalMapFacilities(regionFacilities);
    if (regionEvents.length) renderRegionalVolunteerCards();
  }
});

function renderRegionalVolunteerCards() {
  if (activeCountryCode === "MY" || !regionEvents.length) return;
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
    const snapshot = await locationCollection("announcements").get();
    announcementData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Legacy untagged announcements belong to the original Malaysia site.
      .filter(item => item.countryCode
        ? String(item.countryCode).toUpperCase() === activeCountryCode
        : activeCountryCode === "MY")
      // Keep old records in Firestore while allowing admins to hide stale notices.
      .filter(item => item.isPublished !== false)
      .sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));
    renderAnnouncementList("all");
  } catch (err) {
    console.error("åŠ è½½å…¬å‘Šå¤±è´¥:", err);
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
    const snapshot = await locationCollection("events").get();
      events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        // Legacy untagged events belong to the original Malaysia site.
        .filter(item => item.countryCode
          ? String(item.countryCode).toUpperCase() === activeCountryCode
          : activeCountryCode === "MY");
      buildCalendar();
    } catch (err) {
      console.error("åŠ è½½æ—¥åŽ†äº‹ä»¶å¤±è´¥:", err);
    }
  }

  
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
        const star = document.createElement("button");
        star.type = "button";
        star.className = "calendar-star";
        star.setAttribute("aria-label", "Show event for day " + day);
        star.textContent = "\u2605";
        
        star.addEventListener("click", () => {
  const ev = dayEvents[0];
  markEventAsRead(ev.id);
  
  td.querySelector(".unread-dot")?.remove();
  
  
  const eventTitle = ev[`title_${currentLang}`] || ev.title_en || ev.title;
  const eventDesc = ev[`description_${currentLang}`] || ev.description_en || ev.description;

  calendarInfoHint.style.display = "none";
  calendarInfoTitle.textContent = eventTitle;
  calendarInfoTitle.style.display = "block";
  calendarInfoDesc.textContent = eventDesc;
  calendarInfoDesc.style.display = "block";
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
    calendarInfoTitle.style.display = "none";
    calendarInfoDesc.style.display = "none";
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

  mapPins.forEach((pin) => {
    pin.addEventListener("click", () => {
      mapPins.forEach((p) => {
        p.classList.remove("active");
        p.setAttribute("aria-pressed", "false");
      });
      pin.classList.add("active");
      pin.setAttribute("aria-pressed", "true");
      mapInfoTitle.textContent = pin.dataset.name;
      mapInfoDesc.textContent = pin.dataset.desc;
      mapInfoBox.classList.remove("is-visible");
      requestAnimationFrame(() => mapInfoBox.classList.add("is-visible"));
      scrollPageToElement(mapInfoBox, { behavior: "smooth", block: "nearest" });
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
  ],
  ms: [
    { name: "Ahmad Razali", role: "Tukang Paip", phone: "+60 12-345 6789", email: "ahmad.plumb@email.com", desc: "Pakar dalam pemasangan paip, pembaikan kebocoran, pemasangan bilik mandi dan penyelenggaraan pemanas air untuk hartanah kediaman." },
    { name: "Siti Aminah", role: "Tukang Elektrik", phone: "+60 13-456 7890", email: "siti.elec@email.com", desc: "Pendawaian elektrik bertauliah, pembaikan pemutus litar, pemasangan lampu dan perkhidmatan pemeriksaan keselamatan." },
    { name: "Raj Kumar", role: "Teknisi Penyaman Udara", phone: "+60 14-567 8901", email: "raj.ac@email.com", desc: "Penyelenggaraan penyaman udara, tambah gas, pembaikan pemampat dan kontrak penyelenggaraan tahunan." },
    { name: "Lee Wei Ming", role: "Tukang Kayu", phone: "+60 15-678 9012", email: "lee.carpentry@email.com", desc: "Perabot tersuai, kabinet dapur, almari pakaian dan kraftangan kayu pengubahsuaian rumah." },
    { name: "Nurul Izzati", role: "Pembersih", phone: "+60 16-789 0123", email: "nurul.clean@email.com", desc: "Pembersihan mendalam, pembersihan masuk/keluar, pembersihan pejabat dan perkhidmatan pengemasan tetap." },
    { name: "Tan Boon Heng", role: "Tukang Cat", phone: "+60 17-890 1234", email: "tan.paint@email.com", desc: "Cat dalaman/luaran, salutan kalis air, pembaikan tekstur dinding dan perundingan warna." },
    { name: "Dr. Priya", role: "Doktor Rumah", phone: "+60 18-901 2345", email: "dr.priya@email.com", desc: "Lawatan rumah doktor am, saringan kesihatan, vaksinasi dan perkhidmatan penjagaan warga emas." },
    { name: "Zainab Yusof", role: "Pereka Landskap", phone: "+60 19-012 3456", email: "zainab.green@email.com", desc: "Reka bentuk taman, penyelenggaraan rumput, pemangkasan pokok, sistem pengairan dan perundingan landskap." }
  ],
  ta: [
    { name: "அஹ்மத் ரசாலி", role: "குழாய் தொழிலாளி", phone: "+60 12-345 6789", email: "ahmad.plumb@email.com", desc: "குடியிருப்பு சொத்துக்களுக்கான குழாய் நிறுவுதல், கசிவு பழுதுபார்த்தல், குளியலறை பொருத்தம் மற்றும் நீர் சூடாக்கி பராமரிப்பு நிபுணர்." },
    { name: "சித்தி அமீனா", role: "மின் தொழிலாளி", phone: "+60 13-456 7890", email: "siti.elec@email.com", desc: "சான்றிதழ் பெற்ற மின் கம்பி நிறுவுதல், சர்க்யூட் பிரேக்கர் பழுதுபார்த்தல், விளக்கு நிறுவுதல் மற்றும் பாதுகாப்பு ஆய்வு சேவைகள்." },
    { name: "ராஜ் குமார்", role: "காலரி டெக்னீஷியன்", phone: "+60 14-567 8901", email: "raj.ac@email.com", desc: "காலரி சர்வீஸ், வாயு நிரப்புதல், அமுக்கி பழுதுபார்த்தல் மற்றும் ஆண்டு பராமரிப்பு ஒப்பந்தங்கள்." },
    { name: "லீ வெய் மிங்", role: "மரப்பணி தொழிலாளி", phone: "+60 15-678 9012", email: "lee.carpentry@email.com", desc: "தனிப்பயன் தளபதிகள், சமையலறை அமைச்சரவை, அலமாரி மற்றும் வீட்டு புதுப்பிப்பு மரப்பணி கைவினை." },
    { name: "நுருல் இஸ்ஸதி", role: "தூய்மைப் பணியாளர்", phone: "+60 16-789 0123", email: "nurul.clean@email.com", desc: "ஆழமான தூய்மை, குடியேற்றம்/வெளியேறும் தூய்மை, அலுவலக தூய்மை மற்றும் வழக்கமான வீட்டு பராமரிப்பு சேவைகள்." },
    { name: "தான் பூன் ஹெங்", role: "வண்ண தொழிலாளி", phone: "+60 17-890 1234", email: "tan.paint@email.com", desc: "உள்/வெளி வண்ணம், நீர்த்திரவு பூச்சு, சுவர் அமைப்பு பழுதுபார்த்தல் மற்றும் நிற ஆலோசனை." },
    { name: "டாக்டர் பிரியா", role: "வீட்டு மருத்துவர்", phone: "+60 18-901 2345", email: "dr.priya@email.com", desc: "பொது மருத்துவர் வீடு வருகை, ஆரோக்கிய பரிசோதனை, தடுப்பூசி மற்றும் மூத்தோர் பராமரிப்பு சேவைகள்." },
    { name: "ஜய்னப் யூசோப்", role: "தோட்ட வேலையாள்", phone: "+60 19-012 3456", email: "zainab.green@email.com", desc: "தோட்ட வடிவமைப்பு, புல் பராமரிப்பு, மரம் திருத்தம், நீர்ப்பாசன அமைப்பு மற்றும் தோட்ட ஆலோசனை." }
  ]
};  

  let serviceCarouselIndex = 0;
  let serviceWheelRemainder = 0;
  let serviceWheelArmed = false;

  function renderServiceCards() {
      const track = document.getElementById("serviceTrack");
      if (!track) return;

      const data = activeCountryCode === "MY"
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
      const cardWidth = card.offsetWidth;
      const gap = 24; 
      const offset = serviceCarouselIndex * (cardWidth + gap);
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
      const cardWidth = card.offsetWidth;
      const gap = 24;
      
      const visibleCards = Math.floor((wrapperWidth - cardWidth) / (cardWidth + gap)) + 1;
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
      const cardWidth = card.offsetWidth;
      const gap = 24;
      
      const visibleCards = Math.floor((wrapperWidth - cardWidth) / (cardWidth + gap)) + 1;
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

  if (servicePrevBtn) {
      servicePrevBtn.addEventListener("click", () => slideServiceCards(-1));
  }
  if (serviceNextBtn) {
      serviceNextBtn.addEventListener("click", () => slideServiceCards(1));
  }

  if (serviceSection) {
    document.addEventListener("wheel", (event) => {
      if (!document.body.classList.contains("show-service")
        || (!serviceWheelArmed && !serviceSection.contains(event.target))) return;
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
    document.addEventListener("pointermove", (event) => {
      if (!document.body.classList.contains("show-service")) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!serviceSection.contains(target) && !openServiceDirectoryBtn?.contains(target)) {
        serviceWheelArmed = false;
      }
    }, { passive: true });

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
    {
      q: "How do I become a member of Smart Community?",
      a: "Membership is open to all residents and community stakeholders. Simply visit the Volunteer Registration section or contact our community office. New members receive a welcome package, community guide, and access to all digital platforms."
    },
    {
      q: "What facilities are available in the community?",
      a: "Our community features a Community Hall (capacity 200), Health Clinic, Children's Playground, Library with 10,000+ books, Sports Center with gym and pool, and a 2-acre Central Park with walking trails and meditation gardens. All facilities are accessible to all residents."
    },
    {
      q: "How can I report a maintenance issue or safety concern?",
      a: "You can report issues through the Community Assistant chatbot, email myceliumresidence07@gmail.com, or call our 24/7 hotline at +60 10-557 0900. Emergency situations should be reported immediately via the hotline. All non-emergency reports are addressed within 48 hours."
    },
    {
      q: "Are there age-specific programs and activities?",
      a: "Yes! We offer programs for all ages: toddler storytime at the library, youth sports leagues and tutoring, teen mentorship programs, adult fitness classes, and senior wellness walks and social clubs. Check the Event Calendar for the full schedule of age-specific activities."
    },
    {
      q: "How does the community newsletter work?",
      a: "Our weekly newsletter is delivered every Monday morning via email. It includes community news, upcoming events, maintenance schedules, spotlights on local businesses, and resident stories. Subscribe at the bottom of this page or at the community office."
    },
    {
      q: "What are the community rules and guidelines?",
      a: "Key guidelines include: quiet hours from 10 PM to 7 AM, proper waste sorting and recycling, pet leash requirements in common areas, noise restrictions for events, and parking regulations. Full community handbook is available at the community office and online."
    }
  ],
  'zh-CN': [
    {
      q: "如何成为社区会员？",
      a: "所有居民和社区相关人士均可申请会员。只需访问志愿者报名板块或联系社区办公室即可。新会员将获得迎新礼包、社区指南，并可使用所有数字平台。"
    },
    {
      q: "社区有哪些设施？",
      a: "社区设有可容纳200人的社区礼堂、健康诊所、儿童游乐场、藏书超万册的图书馆、带健身房和泳池的运动中心，以及占地2英亩、设有步道和冥想花园的中央公园。所有设施对居民开放。"
    },
    {
      q: "如何报修或反馈安全问题？",
      a: "您可以通过社区助手聊天机器人、发送邮件至 myceliumresidence07@gmail.com，或拨打24小时热线 +60 10-557 0900 反馈。紧急情况请立即拨打热线。非紧急报修将在48小时内处理。"
    },
    {
      q: "有分年龄段的活动吗？",
      a: "有的！我们覆盖全年龄段：图书馆幼儿故事会、青少年运动联赛与辅导、青年导师计划、成人健身课、长者健康步行与社交俱乐部。完整活动安排请查看活动日历。"
    },
    {
      q: "社区通讯如何订阅？",
      a: "我们每周一上午通过邮件发送社区周报，内容包括社区新闻、活动预告、维修安排、本地商家介绍和居民故事。可在页面底部或社区办公室订阅。"
    },
    {
      q: "社区有哪些规章制度？",
      a: "核心规定包括：晚10点至早7点为静音时段、垃圾分类回收要求、公共区域宠物需牵绳、活动噪音限制及停车管理规定。完整社区手册可在办公室或官网查看。"
    }
  ],
  ms: [
    {
      q: "Bagaimanakah saya boleh menjadi ahli komuniti pintar?",
      a: "Keahlian terbuka kepada semua penduduk dan pihak berkepentingan komuniti. Hanya lawati bahagian Pendaftaran Sukarelawan atau hubungi pejabat komuniti kami. Ahli baharu menerima paket selamat datang, panduan komuniti, dan akses kepada semua platform digital."
    },
    {
      q: "Apakah kemudahan yang ada di komuniti?",
      a: "Komuniti kami mempunyai Dewan Komuniti (kapasiti 200), Klinik Kesihatan, Taman Permainan Kanak-kanak, Perpustakaan dengan 10,000+ buku, Pusat Sukan dengan gim dan kolam renang, serta Taman Tengah 2 ekar dengan laluan jalan kaki dan taman meditasi. Semua kemudahan boleh diakses oleh semua penduduk."
    },
    {
      q: "Bagaimana cara melaporkan masalah penyelenggaraan atau kebimbangan keselamatan?",
      a: "Anda boleh melaporkan melalui chatbot Pembantu Komuniti, e-mel myceliumresidence07@gmail.com, atau hubungi talian panas 24 jam kami di +60 10-557 0900. Kecemasan hendaklah dilaporkan segera melalui talian panas. Semua laporan bukan kecemasan akan ditangani dalam masa 48 jam."
    },
    {
      q: "Adakah terdapat program dan aktiviti mengikut umur?",
      a: "Ya! Kami menawarkan program untuk semua peringkat umur: waktu cerita kanak-kanak di perpustakaan, liga sukan dan bimbingan remaja, program mentor belia, kelas kecergasan dewasa, serta jalan kaki kesihatan dan kelab sosial warga emas. Lihat Kalendar Acara untuk jadual penuh."
    },
    {
      q: "Bagaimana surat berita komuniti berfungsi?",
      a: "Surat berita mingguan kami dihantar setiap Isnin pagi melalui e-mel. Ia mengandungi berita komuniti, acara akan datang, jadual penyelenggaraan, sorotan perniagaan tempatan, dan cerita penduduk. Langgan di bahagian bawah halaman ini atau di pejabat komuniti."
    },
    {
      q: "Apakah peraturan dan garis panduan komuniti?",
      a: "Garis panduan utama termasuk: waktu senyap dari 10 PM hingga 7 AM, pengasingan sisa dan kitar semula yang betul, keperluan tali rantai haiwan peliharaan di kawasan awam, had bunyi untuk acara, dan peraturan letak kereta. Buku panduan penuh boleh didapati di pejabat komuniti dan dalam talian."
    }
  ],
  ta: [
    {
      q: "நான் எப்படி ஸ்மார்ட் சமூகத்தின் உறுப்பினராகலாம்?",
      a: "அனைத்து குடியிருப்பாளர்களுக்கும் உறுப்பினர் உரிமை கிடைக்கும். தொண்டு பதிவு பிரிவைச் செலவு செய்து அல்லது சமூக அலுவலகத்தைத் தொடர்பு கொள்ளுங்கள். புதிய உறுப்பினர்களுக்கு வரவேற்பு தொகுப்பு, சமூக வழிகாட்டி மற்றும் அனைத்து டிஜிட்டல் தளங்களுக்கான அணுகல் கிடைக்கும்."
    },
    {
      q: "சமூகத்தில் என்ன வசதிகள் உள்ளன?",
      a: "200 பேர் இருக்கும் சமூக மண்டபம், உடல்நிலை மருத்துவமனை, குழந்தைகள் விளையாட்டு மைதானம், 10,000+ புத்தகங்கள் கொண்ட நூலகம், ஜிம் மற்றும் குளம் கொண்ட விளையாட்டு மையம், நடை பாதைகள் மற்றும் தியான தோட்டங்கள் கொண்ட 2 ஏக்கர் மத்திய பூங்கா உள்ளது. அனைத்து வசதிகளும் அனைத்து குடியிருப்பாளர்களுக்கும் கிடைக்கும்."
    },
    {
      q: "பராமரிப்பு சிக்கல் அல்லது பாதுகாப்பு கவலையை எப்படி புகாரளிப்பது?",
      a: "சமூக உதவியாளர் சாட்பாட் மூலமாகவும், myceliumresidence07@gmail.com க்கு மின்னஞ்சல் அனுப்பவும், அல்லது எங்கள் 24 மணி ஹாட்லைன் +60 10-557 0900 ஐ அழைக்கவும். அவசர நிலைகள் உடனடியாக ஹாட்லைன் மூலம் புகாரளிக்க வேண்டும். அவசரமற்ற அனைத்து புகார்களும் 48 மணி नेरத்தில் तीर्क्कप्पடुம्."
    },
    {
      q: "வயதிற்கு ஏற்ற நிரல்கள் மற்றும் நடவடிக்கைகள் உள்ளதா?",
      a: "ஆம்! அனைத்து வயது மக்களுக்கும் நிரல்கள் உள்ளன: நூலகத்தில் குழந்தை கதை நேரம், இளைஞர் விளையாட்டு லீக் மற்றும் ஆசிர்வாதம், பதின்பருவ நிலை வழிகாட்டி நிரல், பெரியவர்கள் உடற்பயிற்சி வகுப்புகள், மூத்தோர் ஆரோக்கிய நடை மற்றும் சமூக கிளப்புகள். முழு அட்டவணைக்கு நிகழ்வு நாட்காட்டியைப் பார்க்கவும்."
    },
    {
      q: "சமூக செய்தித்தாள் எப்படி இயங்குகிறது?",
      a: "எங்கள் வாராந்திர செய்தித்தாள் ஒவ்வொரு திங்கட்கிழமை காலை மின்னஞ்சல் மூலம் அனுப்பப்படுகிறது. இதில் சமூக செய்திகள், வரவிருக்கும் நிகழ்வுகள், பராமரிப்பு அட்டவணை, உள்ளூர் வணிகங்கள் மற்றும் குடியிருப்பாளர் கதைகள் உள்ளன. இந்த பக்கத்தின் கீழே அல்லது சமூக அலுவலகத்தில் குழுசேரலாம்."
    },
    {
      q: "சமூக விதிகள் மற்றும் வழிகாட்டுதல்கள் என்ன?",
      a: "முக்கிய வழிகாட்டுதல்கள்: இரவு 10 மணி முதல் காலை 7 மணி வரை அமைதி நேரம், சரியான கழிவு பிரிப்பு மற்றும் மறுசுழற்சி, பொது பகுதிகளில் செல்லப்பிராணிகளுக்கு கயிறு கட்ட வேண்டும், நிகழ்வுகளுக்கு இரைச்சல் கட்டுப்பாடு மற்றும் பார்க்கிங் விதிகள். முழு சமூக கையேடு அலுவலகத்தில் மற்றும் ஆன்லைனில் கிடைக்கும்."
    }
  ]
};

function renderFAQItems() {
  const body = document.getElementById("faqBody");
  if (!body) return;
  const data = activeCountryCode === "MY"
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
    const showAfter = getNavPageTop() + (communityNav ? communityNav.offsetHeight : 400);
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

  if (isOpen && volunteerOverlay) {
    
    scrollPageToElement(volunteerOverlay, { behavior: "smooth", block: "start" });
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

if (volunteerFormEl) {
  volunteerFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    
    const fullName = document.getElementById("volFullName").value.trim();
    const phone = document.getElementById("volPhone").value.trim();
    const address = document.getElementById("volAddress").value.trim();
    const notes = document.getElementById("volNotes").value.trim();
    const activity = volunteerFormEl.dataset.activity;

    
    if (!fullName || !phone || !activity) {
      alert(t("volunteer.requiredTip"));
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
        createdAt: window.MYCELIUM_LOCAL_PREVIEW ? new Date().toISOString() : firebase.firestore.FieldValue.serverTimestamp()
      };
      if (window.MYCELIUM_LOCAL_PREVIEW && window.MYCELIUM_PREVIEW_STORE) {
        window.MYCELIUM_PREVIEW_STORE.save(activeCountryCode, "volunteers", volunteerRecord);
      } else {
        await locationCollection("volunteers").add(volunteerRecord);
      }

      
      alert(fullName + ", " + t("volunteer.successTip"));
      closeVolunteerForm();

    } catch (err) {
      
      console.error("Registration submission failed:", err);
      alert(t("volunteer.errorTip"));
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
          if (i === index) {
              item.classList.add("active");
          } else {
              item.classList.remove("active");
          }
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
  
  choosenProduct = products[targetIdx];
  
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


const keywordMap = [
  {
    keywords: ["announcement", "announcements", "news", "notice", "update", "emergency", "maintenance", "rain", "water supply"],
    action: "announcement",
    slideIndex: 0
  },
  {
    keywords: ["facility", "facilities", "map", "gym", "pool", "swimming", "playground", "park", "tennis", "basketball", "clubhouse", "parking", "pond", "recycling", "site plan"],
    action: "map",
    slideIndex: 1
  },
  {
    keywords: ["service", "services", "directory", "plumber", "electrician", "cleaner", "carpenter", "painter", "landscaper", "doctor", "air cond", "air conditioner", "repair", "contact"],
    action: "service",
    slideIndex: 2
  },
  {
    keywords: ["event", "events", "calendar", "activity", "activities", "tree planting", "cleanup", "fun run", "celebration", "august", "july"],
    action: "calendar",
    slideIndex: 3
  },
  {
    keywords: ["volunteer", "volunteers", "register", "registration", "marshal", "join", "help", "sign up"],
    action: "volunteer",
    slideIndex: 4
  },
  {
    keywords: ["faq", "question", "answer", "how to", "rule", "rules", "membership", "report", "issue", "safety", "quiet hours", "pet", "parking regulation", "newsletter"],
    action: "faq",
    slideIndex: 5
  }
];


const pinNameMap = {
  "pool": "Main pool",
  "swimming": "Main pool",
  "gym": "Gym",
  "tennis": "Tennis court",
  "basketball": "Basketball court",
  "playground": "Playground",
  "clubhouse": "Clubhouse",
  "park": "Community park",
  "parking": "Guest parking",
  "pond": "Pond",
  "recycling": "Recycling point",
  "waste": "Recycling point"
};

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
    const mapPins = i18n[currentLang]?.mapPins || {};
    for (const pinId in mapPins) {
      const pin = mapPins[pinId];
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
      case "announcement":
        setAnnouncementOpen(true);
        break;
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
            const mapInfoTitle = document.getElementById("mapInfoTitle");
            const mapInfoDesc = document.getElementById("mapInfoDesc");
            const mapInfoBox = document.getElementById("mapInfoBox");
            const pinData = i18n[currentLang].mapPins[matchedPinId];
            if (mapInfoTitle && mapInfoDesc && mapInfoBox && pinData) {
              mapInfoTitle.textContent = pinData.name;
              mapInfoDesc.textContent = pinData.desc;
              mapInfoBox.classList.add("is-visible");
            }
          }
        }
        break;
      case "service":
        setServiceOpen(true);
        break;
      case "calendar":
        setCalendarOpen(true);
        break;
      case "volunteer":
        setVolunteerOpen(true);
        break;
      case "faq":
        setFAQOpen(true);
        break;
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
        tooltip.classList.add("show");
      }, 1000);
    });

    card.addEventListener("mouseleave", () => {
      const tooltip = card.querySelector(".feature-tooltip");
      clearTimeout(tooltipTimer);
      tooltip.classList.remove("show");
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
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
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
    
    if (window.MYCELIUM_COUNTRY === "US" && docKey === "rules") {
      const rules = window.MYCELIUM_REGION_RULES;
      const items = rules?.[`items_${currentLang}`] || rules?.items_en;
      if (Array.isArray(items) && items.length) {
        const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
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


if (legalModalClose) {
  legalModalClose.addEventListener('click', closeLegalDoc);
}
if (legalModal) {
  legalModal.addEventListener('click', (e) => {
    if (e.target === legalModal) closeLegalDoc();
  });
}


const legalDocLinks = document.querySelectorAll('[data-doc]');
legalDocLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openLegalDoc(link.dataset.doc);
  });
});


const footerQuickLinks = document.querySelectorAll(".footer-links [data-slide]");
footerQuickLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetIndex = Number(link.dataset.slide);
    if (menuItems[targetIndex]) {
      menuItems[targetIndex].click();
    }
  });
});


const newsletterForm = document.getElementById('newsletterForm');
const newsletterEmail = document.getElementById('newsletterEmail');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = newsletterEmail.value.trim();
    
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      alert(t('newsletter.invalidEmail'));
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
        subscribedAt: window.MYCELIUM_LOCAL_PREVIEW ? new Date().toISOString() : firebase.firestore.FieldValue.serverTimestamp(),
        language: currentLang, 
        source: 'website_footer'
      };
      const savedNewsletter = window.MYCELIUM_LOCAL_PREVIEW && window.MYCELIUM_PREVIEW_STORE
        ? window.MYCELIUM_PREVIEW_STORE.save(activeCountryCode, "newsletter_subscribers", newsletterRecord)
        : await locationCollection('newsletter_subscribers').add(newsletterRecord);

      console.info('Newsletter subscription saved to Firestore.', {
        countryCode: activeCountryCode,
        collectionPath: activeCountryCode === "MY" ? "newsletter_subscribers" : `locations/${activeCountryCode}/newsletter_subscribers`,
        documentId: savedNewsletter.id,
      });

      alert(t('newsletter.success'));
      newsletterForm.reset();

    } catch (err) {
      console.error('Subscription failed:', err);
      alert(t('newsletter.failure'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// Regional directory and map data are loaded only from the selected location namespace.
if (activeCountryCode !== "MY") loadRegionalDirectoryContent();

}
