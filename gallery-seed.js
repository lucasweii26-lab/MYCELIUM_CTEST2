// gallery-seed.js
// 根目录相对图片路径
const IMG = "/img/gallery/";

export const GALLERY_SEED = [
  {
    slug: "sunrise-meditation-2026",
    date: "2026-09-06",
    // 1. 封面图：卡片封面与 Article 顶部巨幅海报
    cover: IMG + "meditation.png",
    // 2. 正文插图：进入 Article 后正文中间的双栏图（可填 1~2 张特写）
    photos: [
      IMG + "meditation.png"
    ],
    tag_en: "Wellness",
    tag_zh_CN: "身心健康",
    short_en: "Sunrise Meditation",
    short_zh_CN: "水畔晨间冥想",
    title_en: "Sunrise meditation on the lawn by the water",
    title_zh_CN: "晨曦破晓，湖畔草坪上的静心冥想课",
    lede_en: "Residents rolled out mats at first light for a quiet, guided session beside the lake.",
    lede_zh_CN: "清晨第一缕阳光洒向湖面，居民们在薄雾与微风中铺开瑜伽垫，开启舒缓的一天。",
    body_en: [
      "The class began as the mist was still lifting from the water, with mats laid out in loose rows on the dew-fresh grass.",
      "Afterwards, neighbours stayed to enjoy herbal tea and quiet conversation, with many requesting this to become a fortnightly weekend tradition."
    ],
    body_zh_CN: [
      "晨光初现，薄雾尚未完全散去，数十位居民在沾着朝露的草坪上整齐展开瑜伽垫。在导师柔和的颂钵与呼吸指引下，大家在一呼一吸间感受自然的宁静节奏。",
      "晨练结束后，邻里们围坐在一起品尝温热的草本茶。不少居民表示，这种远离喧嚣的清晨静心体验，让整个身心都得到了彻底的舒缓与充电。"
    ],
    caption_en: "Morning sunlight reflects off the pond as the meditation session concludes.",
    caption_zh_CN: "晨光倒映在湖面上，静心冥想课程在柔和光线中圆满结束。",
    quote_en: "Starting the day with the sound of water and neighbours breathing in unison is pure serenity.",
    quote_zh_CN: "在水流声与邻里同步的平缓呼吸中开启清晨，是一种久违的平静与治愈。",
    quoteBy_en: "Elena Vance, Resident",
    quoteBy_zh_CN: "社区居民 · Elena Vance",
    place_en: "Lakeside lawn",
    place_zh_CN: "湖畔开放草坪",
    host_en: "Wellness Committee",
    host_zh_CN: "身心健康委员会",
    people: "38 residents"
  },
  {
    slug: "botanical-crafts-2026",
    date: "2026-07-12",
    cover: IMG + "botanic.png",
    photos: [
      IMG + "botanic.png"
    ],
    tag_en: "Family",
    tag_zh_CN: "亲子工坊",
    short_en: "Botanical Crafts",
    short_zh_CN: "植物标本工坊",
    title_en: "Families press leaves and flowers under the garden pergola",
    title_zh_CN: "花架凉亭下，定格四季植物标本的亲子手作午后",
    lede_en: "Children and parents spent a warm afternoon turning fallen leaves and flora into pressed-botanical art.",
    lede_zh_CN: "午后微风吹拂，家长与孩子们在紫藤花架下采集落叶花瓣，将大自然的痕迹封存于画框之中。",
    body_en: [
      "Long wooden tables under the pergola were laid with freshly gathered leaves, recycled paper, natural dyes, and wooden presses.",
      "The finished botanical artworks were curated into a community exhibition currently displayed on the clubhouse noticeboard."
    ],
    body_zh_CN: [
      "绿意盎然的凉亭下摆满了长木桌，桌上整齐放置着修剪整齐的叶片、花瓣、吸水纸和木质压花器。孩子们细心挑选不同纹理的植物，发挥创意构图。",
      "大家完成的精美植物标本画作已被整理装裱，目前陈列在社区会所一层的艺术走廊中，供往来居民驻足欣赏。"
    ],
    caption_en: "Natural specimens assembled and pressed on handmade parchment.",
    caption_zh_CN: "采集自园区原生植物的手工植物标本手作作品。",
    quote_en: "A wonderful way for children to understand local plants while making something beautiful.",
    quote_zh_CN: "让孩子们在大自然中辨识本土植物，同时亲手创造美好事物，这是最好的自然教育。",
    quoteBy_en: "Marcus Lee, Nature Facilitator",
    quoteBy_zh_CN: "自然科普导师 · Marcus Lee",
    place_en: "Garden pergola",
    place_zh_CN: "中心花园紫藤花架",
    host_en: "Residents' Committee",
    host_zh_CN: "居民联谊委员会",
    people: "45 participants"
  },
  {
    slug: "farmers-market-2026",
    date: "2026-05-17",
    cover: IMG + "market.png",
    photos: [
      IMG + "market.png"
    ],
    tag_en: "Community",
    tag_zh_CN: "邻里集市",
    short_en: "Courtyard Market",
    short_zh_CN: "庭院有机集市",
    title_en: "A courtyard market of produce, plants and handmade goods",
    title_zh_CN: "新鲜蔬果与手作醇香：周末邻里庭院市集",
    lede_en: "Stalls lined the courtyard path, bringing fresh organic harvest, balcony seedlings, and artisan baked goods.",
    lede_zh_CN: "石径两旁帐篷相连，本地新鲜有机农产、阳台盆栽幼苗与手工烘焙香气弥漫整个社区中庭。",
    body_en: [
      "Residents browsed under shaded canvas awnings and acoustic melodies, connecting directly with ethical regional growers and home crafters.",
      "Beyond fresh produce, the event served as a lively social hub where old friends caught up and new families were warmly welcomed."
    ],
    body_zh_CN: [
      "在遮阳天幕与舒缓吉他乐声的烘托下，居民们穿梭于各个摊位之间，选购刚刚采摘的新鲜蔬果、手工酵母面包以及阳台盆栽香草。",
      "集市不仅让大家品尝到了纯天然的绿色食材，更成为了一个温馨的社交枢纽，邻里间在此交流种植心得与生活日常。"
    ],
    caption_en: "Colourful stalls showcasing regional produce along the paved courtyard trail.",
    caption_zh_CN: "色彩丰富的农产与手作摊位错落排布在庭院主道上。",
    quote_en: "Knowing exactly who grew the tomatoes on your dinner table creates a rare, real sense of trust.",
    quote_zh_CN: "知道餐桌上的番茄是哪位邻居在后院亲手培育采摘的，这种踏实感弥足珍贵。",
    quoteBy_en: "Chloe Martin, Resident",
    quoteBy_zh_CN: "社区居民 · Chloe Martin",
    place_en: "Central courtyard",
    place_zh_CN: "中央活力中庭",
    host_en: "Events Committee",
    host_zh_CN: "活动策划组",
    people: "120+ visitors"
  },
  {
    slug: "tree-planting-2026",
    date: "2026-03-22",
    cover: IMG + "planting.png",
    photos: [
      IMG + "planting.png"
    ],
    tag_en: "Green Living",
    tag_zh_CN: "绿色共建",
    short_en: "Tree Planting",
    short_zh_CN: "社区植树日",
    title_en: "Neighbours plant young trees along the community walking trail",
    title_zh_CN: "为社区添一抹新绿：邻里携手种植本土树苗",
    lede_en: "On a bright crisp morning, volunteers dug, staked, and watered native saplings to extend the shaded perimeter.",
    lede_zh_CN: "微风晴朗的清晨，几十组家庭自发带上工具，在环形慢跑步道两旁栽种下一棵棵本土树苗。",
    body_en: [
      "Teams of neighbours collaborated across small zones, with young children eagerly carrying watering cans while parents staked the taller saplings.",
      "Each tree was tagged with the planting family's name, creating living green milestones that will provide shade for decades to come."
    ],
    body_zh_CN: [
      "邻居们分成三人小组协作配合，有人负责挥锹培土，小朋友们开心地端水浇灌，大家为每株幼苗牢固立起抗风支架。",
      "每棵新树苗都系上了参与家庭亲手书写的木质祝福牌，成为社区共同成长、岁岁长青的绿意见证。"
    ],
    caption_en: "Residents carefully packing nutrient soil around a newly positioned sapling.",
    caption_zh_CN: "居民志愿者正在细心为新栽植的树苗培土与浇灌定根水。",
    quote_en: "Planting a tree is the most genuine promise we can make to the community's future.",
    quote_zh_CN: "亲手种下一棵树，是我们为社区未来的绿色家园许下最真诚的承诺。",
    quoteBy_en: "Arun Nair, Landscape Lead",
    quoteBy_zh_CN: "园艺负责人 · Arun Nair",
    place_en: "Main walking trail",
    place_zh_CN: "绿荫慢跑环道",
    host_en: "Green Living Team",
    host_zh_CN: "绿色生活组",
    people: "52 volunteers"
  },
  {
    slug: "garden-morning-2026",
    date: "2026-01-18",
    cover: IMG + "garden.png",
    photos: [
      IMG + "garden.png"
    ],
    tag_en: "Garden",
    tag_zh_CN: "种植养护",
    short_en: "Garden Morning",
    short_zh_CN: "晨间育苗交换",
    title_en: "A golden morning of propagation and composting in the shared plot",
    title_zh_CN: "泥土与芬芳：共享菜园晨间育苗与堆肥日",
    lede_en: "Green thumbs and curious beginners met at the potting benches to pot new seedlings and share compost secrets.",
    lede_zh_CN: "种植达人与新手邻居相约在共建菜园，翻整沃土、分苗定植，分享家庭有机堆肥的小妙招。",
    body_en: [
      "Wooden potting benches were stocked with compost, organic seedlings, and labeled jars of heirloom seeds freely shared among participants.",
      "Experienced gardeners showed newcomer families how to calibrate drip lines and nourish soil naturally without synthetic inputs."
    ],
    body_zh_CN: [
      "清晨的阳光斜照在操作台上，大家带来了自家培育的香草幼苗和传家种子罐，互相交换挑选、移栽上盆。",
      "经验丰富的园丁耐心地向新搬来的住户演示如何观察土壤湿度、配置自制堆肥，体验收获绿色健康的乐趣。"
    ],
    caption_en: "Tending to the freshly sprouted leafy greens in the communal raised beds.",
    caption_zh_CN: "居民正在细心打理共享高位种植箱中刚刚萌发出的翠绿菜苗。",
    quote_en: "There's nothing quite like sharing freshly harvested basil with the family next door.",
    quote_zh_CN: "随手摘一把带着露水的新鲜罗勒送给对门的邻居，这就是理想社区的生活方式。",
    quoteBy_en: "Mei Ling, Garden Club",
    quoteBy_zh_CN: "园艺社团 · 陈美玲",
    place_en: "Community garden plots",
    place_zh_CN: "社区生态种植园",
    host_en: "Green Living Team",
    host_zh_CN: "绿色生活组",
    people: "29 participants"
  },
  {
    slug: "lantern-garden-feast-2025",
    // 仅在马来西亚城市（Pulau Tikus & Johor Bahru）显示
    only: "MY",
    date: "2025-09-06",
    cover: IMG + "garden-feast.webp",
    // 构图焦点：水平居中，垂直偏下约 20%（50%+20%=70%）
    focus: "50% 60%",
    photos: [
      IMG + "garden-feast.webp"
    ],
    tag_en: "Festival",
    tag_zh_CN: "传统节庆",
    short_en: "Lantern Feast",
    short_zh_CN: "星光长桌晚宴",
    title_en: "A warm lantern-lit garden feast under the tropical sky",
    title_zh_CN: "暖光摇曳，灯笼与星光下的邻里长桌晚宴",
    lede_en: "String lights and woven lanterns illuminated a long communal banquet welcoming neighbours of all backgrounds.",
    lede_zh_CN: "草坪花香四溢，成排暖黄色灯笼亮起，百余名多元背景的邻居欢聚于露天长桌旁，共享佳肴美酒。",
    body_en: [
      "Dishes were laid out on banana leaves and hand-carved platters, celebrating local heritage recipes cooked with care by resident families.",
      "Lively laughter and acoustic guitar melodies echoed well into the cool evening as friends toasted to neighbourly solidarity."
    ],
    body_zh_CN: [
      "长桌上铺满翠绿芭蕉叶，盛放着各家精心烹制的传统家常私房菜。热气腾腾的娘惹糕点与香料烤肉香气引人垂涎。",
      "孩子们提着彩纸灯笼在草坪间穿梭追逐，长辈们围坐畅叙家常，欢声笑语伴着吉他声回荡在热带舒适的晚风中。"
    ],
    caption_en: "Warm lantern glow reflecting along the communal dinner table at twilight.",
    caption_zh_CN: "暮色低垂，长桌两旁的暖色纸灯笼相继点亮，烘托出浓厚温馨的邻里温情。",
    quote_en: "Sitting together over a meal is how neighbours become a true, united community.",
    quote_zh_CN: "围坐在一张长桌前共享晚餐，邻居才能真正凝聚成为相扶相亲的一家人。",
    quoteBy_en: "Uncle Rahim, Community Elder",
    quoteBy_zh_CN: "社区长者 · Rahim 大叔",
    place_en: "Clubhouse lawn",
    place_zh_CN: "会所中心大草坪",
    host_en: "Events Committee",
    host_zh_CN: "活动策划委员会",
    people: "85 neighbours"
  },
  {
    slug: "autumn-harvest-feast-2025",
    // 仅在美国（波特兰 Portland）显示
    only: "US",
    date: "2025-11-27",
    cover: IMG + "harvest-feast.webp",
    photos: [
      IMG + "harvest-feast.webp"
    ],
    tag_en: "Festival",
    tag_zh_CN: "丰收节庆",
    short_en: "Harvest Feast",
    short_zh_CN: "秋日丰收晚宴",
    title_en: "An outdoor autumn harvest celebration under festoon lighting",
    title_zh_CN: "秋叶流金：星光串灯下的波特兰秋日丰收晚宴",
    lede_en: "Residents gathered outdoors on a cool November evening to share seasonal pies, roasted squash, and cider.",
    lede_zh_CN: "微寒的十一月傍晚，复古灯串点亮露天庭院，邻居们围坐在木桌旁分享刚出炉的南瓜派与热苹果肉桂饮。",
    body_en: [
      "Long rustic wooden tables were decorated with pumpkins, dried wildflowers, and warm wool blankets as the twilight turned deep blue.",
      "The evening concluded with storytelling by the outdoor fire pits, celebrating another fruitful year of connected living."
    ],
    body_zh_CN: [
      "质朴的原木长桌上装点着金黄南瓜、干花与棉麻暖毯，居民们各自带来了精心烘烤的感恩节风味暖胃菜肴。",
      "晚风渐凉，大家聚集在庭院露天火塘边取暖畅聊，共同举杯感恩一年来温馨互助的邻里温情。"
    ],
    caption_en: "Festoon lamps glow brightly above festive tables decorated with fall produce.",
    caption_zh_CN: "复古星光串灯投下暖色柔光，映衬着充满秋收气氛的长木桌席。",
    quote_en: "There's no better feeling than being surrounded by warmth, good food, and good neighbours.",
    quote_zh_CN: "在微寒的秋夜被温暖的火光、可口的食物和友善的邻居包围，是最幸福的体验。",
    quoteBy_en: "Hannah Collins, Resident",
    quoteBy_zh_CN: "波特兰居民 · Hannah Collins",
    place_en: "Courtyard patio",
    place_zh_CN: "户外庭院篝火台",
    host_en: "Events Committee",
    host_zh_CN: "活动策划委员会",
    people: "65 residents"
  }
];

/**
 * 获取指定地区的画廊数据（支持前缀匹配，如 MY 匹配 MY_PP、MY_JB；US 匹配 US_PL）
 */
export function getGallerySeed(countryCode = "MY_PP") {
  const cc = String(countryCode || "MY_PP").toUpperCase();
  return GALLERY_SEED
    .filter((event) => {
      if (!event.only) return true;
      // 支持国家与二级城市代码的前缀双向匹配
      return event.only === cc || cc.startsWith(event.only) || event.only.startsWith(cc);
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}