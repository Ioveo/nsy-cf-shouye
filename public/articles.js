// 白卷 WHITE FOLIO · 天才猫文章杂志排版引擎 (articles.js)
// 纯 ESM 原生实现 · 动态配置驱动 · D1 文章全量适配 · 沉浸式阅读器

import { renderContent, enhanceArticleContent, bindArticleAudio, bindCodeBlocks, escapeHtml, escapeAttr } from "/js/article-parser.js";

const $ = id => document.getElementById(id);

// 默认视频字典
const VURL = {
  'aurora': 'https://muse.ai/files/1331075203424773/4652450651659595/n7ovqqi2larx76i5lpywaogj/aurora.mp4',
  'volcano': 'https://muse.ai/files/1331075203424773/1496429802541049/32ptj5b41589vx3gqksl88my/volcano.mp4',
  'storm': 'https://muse.ai/files/1331075203424773/1088652230742754/h6ly755g5wexjub0femjdphe/storm.mp4',
  'deepsea': 'https://muse.ai/files/1331075203424773/1846872469843698/ka99z5x3vs32micm76g3cg1y/deepsea.mp4',
  'mist': 'https://muse.ai/files/1331075203424773/1612634110411938/v879j4nzo4vdwyl14x76qato/mist.mp4',
  'sakura': 'https://muse.ai/files/1331075203424773/991808380633304/cu2y3j7cp38qgtmftmvj1l0p/sakura.mp4',
  'desert': 'https://muse.ai/files/1331075203424773/2138727663703231/k6g39iora7p6a5w8qzlzaj0k/desert.mp4',
  'alpine': 'https://muse.ai/files/1331075203424773/1419755236313998/5a2i0htxgurkatrscrjhmkwx/alpine.mp4',
  'falls': 'https://muse.ai/files/1331075203424773/955234357656073/e0qdyvew5atqd9r1kgeqndjc/falls.mp4',
  'cloudsea': 'https://muse.ai/files/1331075203424773/4033096033492611/kxyw991u5ma9zpmr4mryf34f/cloudsea.mp4',
  'dragon': 'https://muse.ai/files/1331075203424773/2009118896428863/tke42k321webkvmq91h16h5z/dragon.mp4',
  'void': 'https://muse.ai/files/1331075203424773/1432839098826596/g7flky81f7shf2cuktqqwaej/void.mp4',
  'luxe': 'https://muse.ai/files/1331075203424773/2089745241650351/sjfiq5m18bl0p0nrwf0wcfm4/luxe.mp4',
  'nebula': 'https://muse.ai/files/1331075203424773/1111954698096282/l0gspntqz6w0a5cvml3sxe7e/nebula.mp4',
  'noir': 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4'
};

// 预设杂志特稿演示数据
const DEMO_ARTICLES = [
  { v: "noir", cn: "霓虹雨夜", en: "Neon Noir", tag: "城市", time: "阅读约 12 分钟", sum: "雨把城市洗成一块巨大的霓虹底片。我们在凌晨三点的便利店门口，读懂了不夜城的语法。",
    body: ["雨是在晚上十一点开始下的。起初只是试探，到了午夜，整座城市已经被洗成一块巨大的霓虹底片——红的、蓝的、粉的招牌在湿漉漉的路面上碎成千万片，像一场永不落幕的烟花，倒映在每一个行人的瞳孔里。","便利店的灯是这座城市最后的体温。店员把关东煮的盖子掀开，蒸汽升起来，混着雨的气味。窗外，一个穿透明雨衣的女孩跑过，雨衣上印满了便利店的灯，像裹着一条银河。","城市规划师说，霓虹是二十世纪留给夜晚的遗产。而我们说，霓虹是城市在深夜写给自己的情书——只有雨能把它寄出去。","凌晨三点，雨停了。清洁车开过，卷走一夜的碎光。天边泛起鱼肚白，霓虹一盏一盏熄灭，像退潮。城市翻了个身，准备迎接白天的另一副面孔。"],
    quote: ["雨停之后，城市把一整夜的霓虹收叠好，藏进抽屉，等下一个雨夜再穿。","—— 本期撰稿人"] },
  { v: "nebula", cn: "星云深处", en: "Deep Nebula", tag: "宇宙", time: "阅读约 9 分钟", sum: "一百光年外，一团气体正在缓慢地呼吸。那是恒星诞生前，最漫长的一次深呼吸。",
    body: ["猎户座大星云距离我们一千三百光年。光从那里出发时，宋朝人正在仰望同一片星空——虽然他们看到的，和我们今天看到的几乎没有差别。宇宙的时间尺度，让人类的历史薄得像一张纸。","星云是恒星的产房。氢气与尘埃在引力下缓慢坍缩，温度升高，颜色从暗红变成炽白。每一次坍缩，都是一次漫长的深呼吸，短则十万年，长则千万年。","天文学家把望远镜对准这些彩色的云，读出的却是一部恒星的家谱：哪一团云正在怀孕，哪一团刚刚分娩，哪一团已经步入暮年，准备把自己炸成下一团星云。"],
    quote: ["我们都是星尘。只不过有些星尘，学会了仰望。","—— 卡尔·萨根"] },
  { v: "aurora", cn: "极光之下", en: "Beneath the Aurora", tag: "旅行", time: "阅读约 8 分钟", sum: "北纬 69 度，零下二十度。当第一缕绿光划破天际，所有的等待都有了形状。",
    body: ["特罗姆瑟的夜晚来得漫长而彻底。下午三点，天就黑了，像有人把一块巨大的黑布罩了下来。当地人说，冬天在这里不是季节，是职业——你要学会与黑暗共处。","晚上九点四十分，第一缕绿光出现在东北方的天际。它很淡，像呼吸一样若有若无。向导关掉了所有的灯，二十个人站在雪地里，屏住呼吸，看着那缕绿光慢慢舒展、变亮、分叉，像天上展开了一匹巨大的绸缎。","极光是太阳风与地球磁场的私语。带电粒子沿着磁力线滑进大气层，撞上氧原子和氮原子，激发出绿、紫、红的光。说到底，我们看到的，是九千三百万英里外一场风暴的余烬。"],
    quote: ["在极光下许的愿，会被太阳风带到很远的地方。","—— 特罗姆瑟向导"] },
  { v: "volcano", cn: "火山口", en: "The Crater", tag: "自然", time: "阅读约 10 分钟", sum: "站在火山口边缘往下看，看到的是大地的心脏——一颗跳动了四十亿年的心脏。",
    body: ["硫磺的气味先于景色抵达。还没爬上垭口，风里已经有了那种熟悉的、介于臭鸡蛋与温泉之间的气息——那是地球内部在呼吸的味道。","火山口湖呈现出一种不真实的青绿色，像一块巨大的、被打翻的调色盘。湖面平静得反常，偶尔冒出一两个气泡，破裂时发出轻微的'啵'声，仿佛大地在说梦话。","地质学家说，每一座火山都是一封写给天空的信，岩浆是墨水，喷发是落款。而我们站在信封的边缘，读着四十亿年写就的句子。"],
    quote: ["大地的心跳很慢，一分钟只跳一次，一次跳一万年。","—— 火山地质学家"] },
  { v: "storm", cn: "风暴海", en: "Storm Sea", tag: "海洋", time: "阅读约 11 分钟", sum: "浪高九米，风速每秒四十米。在风暴眼里，大海第一次露出了它真正的表情。",
    body: ["气象图上的那个 spirals 正在靠近。船长把海图拍在桌上，指着那个红色的圈说：'我们要穿过去。'甲板上没有人说话，只有风在缆绳上拉出的哨音越来越尖。","第一波大浪是从左舷来的。九米高的水墙立起来的时候，时间仿佛被按了暂停——你能看清浪尖上每一滴飞溅的水珠，看清它们在甲板灯下闪着冷光，然后，整船人一起被抛向天空。","三天后，风暴过去。海面平滑得像什么都没发生过，只有桅杆上缠着的一缕海藻，证明那九米高的水墙真的来过。大海从不解释，它只是翻篇。"],
    quote: ["敬畏，是大海教给人类的第一课，也是最后一课。","—— 远洋船长"] },
  { v: "deepsea", cn: "深海一万米", en: "Ten Thousand Meters Down", tag: "科学", time: "阅读约 14 分钟", sum: "阳光到不了的地方，生命找到了另一种算法。在一万米的深渊，寂静是有重量的。",
    body: ["马里亚纳海沟，深一万零九百米。把珠穆朗玛峰放进去，峰顶距离海面还有两千米。那里是地球上最接近地狱、也最接近子宫的地方。","阳光在两百米处就耗尽了。再往下，是永恒的夜。压力达到一千个大气压——相当于指甲盖上站着一头大象。但生命没有缺席：狮子鱼、端足类、发光水母，它们用生物荧光在黑暗里写诗。","深渊的寂静是有重量的。潜水器的声呐关掉之后，你能听见自己的心跳，听见血液流动的声音——那一刻你会明白，寂静不是没有声音，而是所有的声音都回到了源头。"],
    quote: ["我们对深海的了解，不如对月球表面的了解。","—— 海洋学家"] },
  { v: "mist", cn: "雾林", en: "Mist Forest", tag: "旅行", time: "阅读约 7 分钟", sum: "清晨五点，整座山被云雾收藏。走进雾林的人，都成了雾的一部分。",
    body: ["清晨五点，天还没亮透，山已经醒了——以一种不打扰任何人的方式。雾从谷底升起来，先漫过竹林的梢头，再漫过石阶，最后漫到你的腰际。你站在雾里，像站在一条缓慢流动的河中央。","雾林里的光是借来的。阳光穿过三层雾，落到苔藓上时，已经柔软得像一声叹息。每一片叶子都挂着水珠，风一过，水珠就落下来，在寂静里敲出细碎的声响。","护林员老陈说，雾是有记忆的。它记得每一个走进林子的人，记得他们的脚步声，记得他们说话的语气。所以进雾林要轻，要慢，要像雾一样安静——不然，雾会把你忘掉。","走到半山腰，雾忽然散开一条缝。对面的山脊露出来，云海在脚下翻涌，金色的阳光正从云的边缘渗出来。那一刻你明白，所有的等待，都是为了这三秒钟的豁然开朗。","下山的时候雾又合拢了。来时的路消失在乳白色的虚空里，只有自己的脚步声陪着自己。雾林把你借去半天，又把你还回来，还的时候，你身上多了一层潮气，心里少了一些焦虑。","有人说，旅行是为了看风景。在雾林，风景不给你看——它只让你成为风景的一部分。这或许是山能教给人的，最温柔的一课。"],
    quote: ["雾是有记忆的。它记得每一个走进林子的人。","—— 护林员老陈"] },
  { v: "sakura", cn: "樱落时分", en: "When Petals Fall", tag: "文化", time: "阅读约 6 分钟", sum: "花开七日，樱落一瞬。日本人用一千年的时间，学会了与短暂和解。",
    body: ["京都的樱花是在一个周二的清晨开的。没有预告，没有仪式，前一天还是花苞的枝头，一夜之间就变成了云。日本人把这种开法叫做'樱吹雪的前夜'——最盛大的演出，总是在最安静的时刻开场。","花见的人坐在樱树下，铺着蓝色的塑料布，吃着便利店的饭团，喝着罐装啤酒。没有人高声说话，大家都抬着头，看风把花瓣一瓣一瓣地摘下来。那种安静里有一种郑重，仿佛在参加一场盛大的告别。","'物哀'这个词，日本人用了上千年去打磨。它说的不是悲伤，而是一种对短暂之美的深情凝视——因为知道会落，所以每一瓣都看得格外认真。"],
    quote: ["樱花七日，从盛放到凋零，恰好是一场人生的预演。","—— 京都老茶人"] },
  { v: "desert", cn: "沙漠金辉", en: "Golden Desert", tag: "旅行", time: "阅读约 9 分钟", sum: "撒哈拉的黄昏，沙丘被镀上一层流动的金。时间在这里，第一次有了形状。",
    body: ["下午六点，太阳开始西斜，撒哈拉的沙丘从米黄色慢慢变成蜜糖色，再变成燃烧般的金红。风在沙脊上刻出的波纹，此刻都成了金色的年轮——时间在这里，第一次有了看得见的形状。","驼队在远处走成一条缓慢的虚线。驼铃的声音隔着热浪传过来，断断续续，像从另一个世纪寄来的明信片。向导说，沙漠里的时间不是用钟表的，是用驼铃的——一串驼铃，就是一下午。","夜晚降临得猝不及防。最后一抹金红沉到地平线以下，星星像被谁撒了一把盐，密密麻麻地浮上来。躺在沙丘顶上，你会听见沙子在身下发出细微的流动声——那是沙漠在梦里翻身。"],
    quote: ["沙漠把时间磨成了沙，又把沙堆成了时间的形状。","—— 撒哈拉向导"] },
  { v: "alpine", cn: "雪山之巅", en: "Alpine Silence", tag: "探险", time: "阅读约 10 分钟", sum: "海拔五千米，白色寂静。在雪线之上，连自己的心跳都显得过于喧哗。",
    body: ["雪线是一道无形的门。跨过去，世界就只剩下两种颜色：雪的白，和天的蓝。向导在前面踩出脚印，你踩着他的脚印走，像踩着前人写好的句子，一步一步往上读。","海拔五千米，空气稀薄得像被抽走了一半。每走十步，就要停下来喘一口气。奇怪的是，身体越疲惫，头脑越清醒——那些在山下纠缠不清的烦恼，在这里显得轻飘飘的，不值一提。","登顶的那一刻没有欢呼。风太大，说话会被吹散。大家只是静静地站着，看云海在脚下，看远处的雪峰一座连着一座，像大地的呼吸。在白色寂静里，连自己的心跳都显得过于喧哗。"],
    quote: ["山不说话，但它回答一切。","—— 登山家"] },
  { v: "falls", cn: "瀑布", en: "Falling Water", tag: "自然", time: "阅读约 8 分钟", sum: "三百米落差，一秒钟的坠落用了整整一个纪元。水，是最有耐心的诗人。",
    body: ["还没看到瀑布，先听到了它的声音。那是一种低沉的、持续的轰鸣，像大地在深呼吸。循着声音走过一片雨林，转过一道弯——它就那样出现了，毫无预兆，像一句脱口而出的诗。","三百米的落差，水从悬崖上倾泻而下，在半空中碎成亿万颗水珠。阳光斜切进来，瀑布前升起一道完整的彩虹，另一道淡淡的副虹在旁边若隐若现。","地质学家说，这道瀑布已经这样坠落了上万年。每一秒，都有数万吨的水完成这场纵身一跃。水是最有耐心的诗人，用一万年的时间，只写'坠落'这一个动作。"],
    quote: ["瀑布教会我们：坠落，也可以是一种抵达。","—— 自然撰稿人"] },
  { v: "cloudsea", cn: "云海日出", en: "Sunrise Above Clouds", tag: "旅行", time: "阅读约 7 分钟", sum: "凌晨四点登顶，在云海之上等一场日出。当第一缕金光刺破云层，值得所有的夜行。",
    body: ["凌晨四点，头灯的光柱里全是自己的呼吸。山路在黑暗里无限延长，每一步都踩在未知上。同行的人都不说话，只听得见彼此的喘息，和远处偶尔传来的夜鸟的叫声。","五点四十分登顶。东方已经泛起鱼肚白，脚下是翻涌的云海，像一片凝固的、乳白色的海洋。风把云吹出波浪的形状，一波一波，涌向天际。","六点零三分，太阳出来了。先是一点金，然后是一线，最后是万丈。金光刺破云层的那一瞬间，整片云海被点燃，变成了流动的金。所有人都不由自主地屏住了呼吸——值得，所有的夜行都值得。"],
    quote: ["在云海之上等日出的人，都会原谅黑夜。","—— 山顶看日出的人"] },
  { v: "dragon", cn: "龙", en: "Dragon", tag: "文化", time: "阅读约 13 分钟", sum: "从红山文化的玉猪龙，到紫禁城的九龙壁。中华巨龙，飞了八千年。",
    body: ["红山文化的一块玉，被雕成了猪首蛇身的形状——那是目前发现最早的'龙'，距今约五千五百年。它蜷曲着，像在沉睡，又像在等待。谁也说不清，先民雕刻它时，心里想的是敬畏，还是亲近。","龙的形象是在漫长的岁月里拼起来的：鹿的角、牛的头、蟒的身、鱼的鳞、鹰的爪——每一种拼上去的动物，都是一次文化的融合。龙不是一种生物，是一部拼贴而成的文明史。","从帝王的龙袍，到百姓的龙舟；从九龙壁的琉璃，到剪纸上的纹样。龙从天上飞到人间，飞了八千年，鳞片上沾满了人间的烟火气，却依然腾云驾雾，不肯落地。"],
    quote: ["龙飞了八千年，鳞片上沾满烟火，心里还住着云。","—— 民俗学者"] },
  { v: "void", cn: "虚空", en: "The Void", tag: "哲学", time: "阅读约 15 分钟", sum: "'无'不是空无一物，而是万物尚未命名时的样子。一场关于虚空的沉思。",
    body: ["老子说：'天下万物生于有，有生于无。'两千五百年前，这位骑着青牛的老人，就把'无'放在了万物的源头。不是空无一物，而是万物尚未命名、尚未分别时的样子。","物理学家说，真空不空。量子涨落让虚空中不断冒出虚粒子对，又瞬间湮灭。最'空'的地方，恰恰是最热闹的地方——无，是有的一种极其忙碌的形态。","禅师让弟子参'无'字公案。参了三年，弟子说：'我懂了，无就是没有。'禅师摇头：'你看到的无，还是你心里那个'有'的反面。真正的无，连'无'这个字也没有。'","我们害怕虚空，所以用工作填满时间，用信息填满注意力，用物品填满房间。但偶尔，在深夜关掉所有的灯之后，你会瞥见它——那个广阔、安静、不加评判的'无'。它一直在那里，等你。"],
    quote: ["真正的无，连'无'这个字也没有。","—— 禅师"] },
  { v: "luxe", cn: "奢华", en: "Luxe", tag: "时尚", time: "阅读约 6 分钟", sum: "奢华不是价格标签，而是一种仪式感——把平凡的日子，过成值得纪念的样子。",
    body: ["秀场后台，化妆师用三十分钟画一道眼线。模特坐在镜子前一动不动，像一尊等待被点睛的雕塑。奢华的第一课是：慢。把一件小事做到极致，时间就会为你让路。","有人说奢华是价格标签，有人说奢华是 logo。但真正的奢侈品从业者会告诉你：奢华是一种仪式感——是每天早晨用同一只杯子喝咖啡，是给每一封信都贴上邮票，是把平凡的日子过成值得纪念的样子。","香奈儿女士说：'奢华必须舒适，否则就不是奢华。'这句话的另一面是：舒适必须讲究，否则就只是随便。奢华和随便之间，隔着一千个认真的细节。"],
    quote: ["把平凡的日子过成值得纪念的样子，就是奢华。","—— 时尚编辑"] }
];

const META = {
  'noir': { author: '陈默', role: '特稿记者', date: '2026-10-18', reads: '12.8万', c1: '#3b5bff', c2: '#8a7cff' },
  'nebula': { author: '林晚', role: '自然撰稿', date: '2026-10-17', reads: '9.4万', c1: '#6d5cff', c2: '#b388ff' },
  'aurora': { author: '沈括', role: '科学编辑', date: '2026-10-16', reads: '8.1万', c1: '#0ea877', c2: '#7ef0c0' },
  'volcano': { author: '顾晓', role: '文化评论', date: '2026-10-15', reads: '15.2万', c1: '#ff5c38', c2: '#ff9a5c' },
  'storm': { author: '江离', role: '旅行作家', date: '2026-10-14', reads: '11.6万', c1: '#3f8cff', c2: '#9ecfff' },
  'deepsea': { author: '陆深', role: '专栏作者', date: '2026-10-13', reads: '7.3万', c1: '#2743c7', c2: '#5b8cff' },
  'mist': { author: '陈默', role: '特稿记者', date: '2026-10-12', reads: '6.8万', c1: '#5da87a', c2: '#c9e8cf' },
  'sakura': { author: '林晚', role: '自然撰稿', date: '2026-10-11', reads: '18.9万', c1: '#e86a9a', c2: '#ffd3e0' },
  'desert': { author: '沈括', role: '科学编辑', date: '2026-10-10', reads: '5.4万', c1: '#d98f2b', c2: '#f7d08a' },
  'alpine': { author: '顾晓', role: '文化评论', date: '2026-10-09', reads: '4.9万', c1: '#4aa8dd', c2: '#d3eefb' },
  'falls': { author: '江离', role: '旅行作家', date: '2026-10-08', reads: '13.7万', c1: '#0ea89a', c2: '#9ef0e2' },
  'cloudsea': { author: '陆深', role: '专栏作者', date: '2026-10-07', reads: '3.8万', c1: '#e8a83d', c2: '#ffe3a3' },
  'dragon': { author: '陈默', role: '特稿记者', date: '2026-10-06', reads: '10.2万', c1: '#1fae62', c2: '#a9f0c9' },
  'void': { author: '林晚', role: '自然撰稿', date: '2026-10-05', reads: '2.9万', c1: '#7a4ff0', c2: '#c4b0ff' },
  'luxe': { author: '沈括', role: '科学编辑', date: '2026-10-04', reads: '6.1万', c1: '#b08a3e', c2: '#ecd9a8' }
};

let ARTICLES = [...DEMO_ARTICLES];
let CATS = ["全部", "旅行", "自然", "文化", "科学", "城市", "海洋", "哲学", "时尚", "宇宙", "探险"];
let curCat = "全部", query = "", showBmk = false;
let bmk = new Set(JSON.parse(localStorage.getItem('wf_bmk') || '[]'));
let portalConfig = null;
let gridViewMode = localStorage.getItem('folio_grid_mode') || 'cards';

function avColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 55%, 48%)`;
}

function toast(t) {
  const e = $('toast');
  if (!e) return;
  e.textContent = t;
  e.classList.add('show');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove('show'), 2200);
}

function updateBmkN() {
  if ($('bmkN')) $('bmkN').textContent = bmk.size;
}

function toggleBmk(key, ev) {
  if (ev) ev.stopPropagation();
  if (bmk.has(key)) {
    bmk.delete(key);
    toast('已取消收藏');
  } else {
    bmk.add(key);
    toast('已加入书签');
  }
  localStorage.setItem('wf_bmk', JSON.stringify([...bmk]));
  updateBmkN();
  renderGrid();
}

// 主初始化逻辑
init();

async function init() {
  updateBmkN();
  await loadData();
  bindGlobalEvents();
  initCinemaReel();
  initKnowledgeGraph();
  observeRv();
}

async function loadData() {
  try {
    const [cfgRes, catRes] = await Promise.allSettled([
      fetch('/api/config/articles-portal?_t=' + Date.now()),
      fetch('/api/catalog?_t=' + Date.now())
    ]);

    if (cfgRes.status === 'fulfilled' && cfgRes.value.ok) {
      portalConfig = await cfgRes.value.json();
      if (portalConfig && portalConfig.pageTitle) {
        document.title = portalConfig.pageTitle;
      }
    }

    if (catRes.status === 'fulfilled' && catRes.value.ok) {
      const catData = await catRes.value.json();
      const dbArticles = (catData.articles || []).filter(a => a.status === 'published');
      if (dbArticles.length) {
        // 将 D1 数据库文章映射为杂志特稿卡片，前置排布
        const mappedDb = dbArticles.map((a, i) => {
          const vKey = a.slug || `art_${a.id || i}`;
          META[vKey] = {
            author: a.author || '官方编辑',
            role: '专栏撰稿',
            date: a.published_at ? a.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            reads: (a.reads || a.views_count || Math.floor(Math.random() * 8000 + 1200)) + '',
            c1: a.theme_color || '#3b5bff',
            c2: '#8a7cff',
            isDbArticle: true,
            id: a.id,
            slug: a.slug,
            content: a.content,
            cover_image: a.cover_image
          };
          return {
            v: vKey,
            cn: a.title,
            en: a.slug ? a.slug.toUpperCase() : 'SPECIAL REPORT',
            tag: a.category || '专栏',
            time: `阅读约 ${a.read_time || 8} 分钟`,
            sum: a.summary || (a.content ? a.content.replace(/<[^>]+>/g, '').slice(0, 80) + '...' : '暂无摘要'),
            body: a.content ? [a.content] : (a.summary ? [a.summary] : ['暂无内容']),
            isDbArticle: true,
            rawArticle: a
          };
        });

        // 合并 D1 与预设，提取全部可用分类
        ARTICLES = [...mappedDb, ...DEMO_ARTICLES];
        const tagsSet = new Set(['全部']);
        ARTICLES.forEach(a => { if (a.tag) tagsSet.add(a.tag); });
        CATS = [...tagsSet];
      }
    }
  } catch (err) {
    console.warn('加载文章配置或列表异常，使用内置杂志库:', err);
  }

  // 渲染视图各区块
  applyConfig();
  renderTabs();
  renderBento();
  renderCinema();
  renderGrid();
  renderWire();
  renderTrending();
  renderAuthors();
  renderFooter();
}

// 绑定配置项
function applyConfig() {
  if (!portalConfig) return;
  const cfg = portalConfig;

  // 1. 品牌
  if (cfg.brand?.logo && $('brandLogo')) {
    $('brandLogo').innerHTML = `${cfg.brand.logo}<i>${cfg.brand.issue || 'VOL.1'}</i>`;
  }
  if (cfg.brand?.logo && $('footLogo')) {
    $('footLogo').innerHTML = `${cfg.brand.logo}<i>${cfg.brand.issue || 'VOL.1'}</i>`;
  }

  // 2. Hero
  if (cfg.hero) {
    const h = cfg.hero;
    if ($('heroEyebrow')) $('heroEyebrow').innerHTML = `<span class="dot"></span>${h.eyebrow || '本期特稿 · FEATURED'}`;
    if ($('heroH1')) {
      const titleLines = (h.title || '用眼睛\n读').split('\n').join('<br>');
      $('heroH1').innerHTML = `${titleLines}<span class="hl" id="heroHl">${h.highlight || '世界'}</span>`;
    }
    if ($('heroLede')) $('heroLede').textContent = h.lede || '';
    if ($('heroRead') && h.ctaPrimaryText) $('heroRead').textContent = h.ctaPrimaryText;
    if ($('heroBtnSecondary') && h.ctaSecondaryText) {
      $('heroBtnSecondary').textContent = h.ctaSecondaryText;
      $('heroBtnSecondary').onclick = () => {
        const target = h.ctaSecondaryHref ? document.querySelector(h.ctaSecondaryHref) : $('sec-grid');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      };
    }
    if ($('heroStats') && Array.isArray(h.stats)) {
      $('heroStats').innerHTML = h.stats.map(s => `<div><b>${s.value || ''}</b><span>${s.label || ''}</span></div>`).join('');
    }

    // Media
    const mediaWrap = $('heroMediaContainer');
    if (mediaWrap && h.mediaUrl) {
      if (h.mediaType === 'image') {
        mediaWrap.innerHTML = `<img src="${h.mediaUrl}" alt="Hero Cover" style="width:100%;height:100%;object-fit:cover;" />`;
      } else {
        mediaWrap.innerHTML = `<video src="${h.mediaUrl}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
      }
    }

    // Floating Glass Card
    if (h.floatCard) {
      if ($('heroFloatTag')) $('heroFloatTag').textContent = h.floatCard.tag || '城市';
      if ($('heroFloatTitle')) $('heroFloatTitle').textContent = h.floatCard.title || '霓虹雨夜';
      if ($('heroFloatSub')) $('heroFloatSub').textContent = h.floatCard.subtitle || '';
      if ($('heroFloatReads')) $('heroFloatReads').textContent = h.floatCard.reads || '';
    }
    if ($('heroBadge') && h.badgeText) {
      $('heroBadge').innerHTML = h.badgeText.replace(/\n/g, '<br>');
    }
  }

  // 3. Section Titles
  if (cfg.bento?.title && $('bentoSecTitle')) {
    $('bentoSecTitle').innerHTML = `${cfg.bento.title}<small id="bentoSecSub">${cfg.bento.subtitle || "EDITORS' PICKS"}</small>`;
  }
  if (cfg.cinema?.title && $('cinemaSecTitle')) {
    $('cinemaSecTitle').innerHTML = `${cfg.cinema.title}<small id="cinemaSecSub">${cfg.cinema.subtitle || 'FILM STORIES'}</small>`;
  }
  if (cfg.theWire?.title && $('wireSecTitle')) {
    $('wireSecTitle').innerHTML = `${cfg.theWire.title}<small id="wireSecSub">${cfg.theWire.subtitle || 'THE WIRE'}</small>`;
  }
  if (cfg.trending?.title && $('trendSecTitle')) {
    $('trendSecTitle').innerHTML = `${cfg.trending.title}<small id="trendSecSub">${cfg.trending.subtitle || 'TRENDING'}</small>`;
  }
  if (cfg.authors?.title && $('authorSecTitle')) {
    $('authorSecTitle').innerHTML = `${cfg.authors.title}<small id="authorSecSub">${cfg.authors.subtitle || 'AUTHORS'}</small>`;
  }
  if (cfg.knowledgeGraph && $('graphSecTitle')) {
    $('graphSecTitle').innerHTML = `${cfg.knowledgeGraph.title || '知识网络'}<small id="graphSecSub">${cfg.knowledgeGraph.subtitle || 'KNOWLEDGE GRAPH'}</small>`;
    if ($('graphEyebrow')) $('graphEyebrow').textContent = cfg.knowledgeGraph.eyebrow || '知识网络 / KNOWLEDGE GRAPH';
    if ($('graphHeadline')) $('graphHeadline').innerHTML = (cfg.knowledgeGraph.headline || '').replace(/\n/g, '<br>');
    if ($('graphDesc')) $('graphDesc').textContent = cfg.knowledgeGraph.desc || '';
  }
  if (cfg.newsletter) {
    if ($('nlTitle')) $('nlTitle').innerHTML = (cfg.newsletter.title || '').replace(/\n/g, '<br>');
    if ($('nlSubtitle')) $('nlSubtitle').textContent = cfg.newsletter.subtitle || '';
    if ($('nlMail') && cfg.newsletter.placeholder) $('nlMail').placeholder = cfg.newsletter.placeholder;
    if ($('nlBtn') && cfg.newsletter.buttonText) $('nlBtn').textContent = cfg.newsletter.buttonText;
  }
}

// 渲染分类 Tab 栏
function renderTabs() {
  const box = $('tabs'), nc = $('navCats');
  if (!box) return;
  box.innerHTML = '';
  if (nc) nc.innerHTML = '';

  CATS.forEach(c => {
    const n = ARTICLES.filter(a => c === '全部' || a.tag === c).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab' + (c === curCat ? ' on' : '');
    b.innerHTML = `${c}<small>${n}</small><span class="bar"></span>`;
    b.onclick = () => setCat(c);
    box.appendChild(b);

    if (nc && c !== '全部' && ['旅行', '自然', '文化', '科学'].includes(c)) {
      const a = document.createElement('a');
      a.textContent = c;
      a.onclick = () => {
        setCat(c);
        $('sec-grid')?.scrollIntoView({ behavior: 'smooth' });
      };
      nc.appendChild(a);
    }
  });
}

function setCat(c) {
  curCat = c;
  showBmk = false;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('on', t.textContent.indexOf(c) === 0);
  });
  renderGrid();
}

// 渲染编辑精选 BENTO
function renderBento() {
  const box = $('bento');
  if (!box) return;

  const picks = portalConfig?.bento?.picks || [
    { tag: '城市', title: '霓虹雨夜', author: '陈默', reads: '12.8万', mediaType: 'video', mediaUrl: VURL.noir, articleIndex: 0 },
    { tag: '自然', title: '火山口', author: '顾晓', reads: '15.2万', color1: '#ff5c38', color2: '#ff9a5c', articleIndex: 3 },
    { tag: '文化', title: '樱落时分', author: '林晚', reads: '18.9万', color1: '#e86a9a', color2: '#ffd3e0', articleIndex: 7 },
    { tag: '文化', title: '龙', author: '陈默', reads: '10.2万', color1: '#1fae62', color2: '#a9f0c9', articleIndex: 12 }
  ];

  let html = '';
  // Big card
  const p0 = picks[0] || {};
  const mediaHtml0 = p0.mediaType === 'image' || p0.mediaUrl?.endsWith('.png') || p0.mediaUrl?.endsWith('.jpg')
    ? `<img src="${p0.mediaUrl || ''}" alt="" />`
    : `<video src="${p0.mediaUrl || VURL.noir}" autoplay muted loop playsinline></video>`;

  html += `
    <div class="pick big rv" data-idx="${p0.articleIndex ?? 0}">
      <div class="cov">${mediaHtml0}</div>
      <div class="shade"></div>
      <div class="info">
        <span class="tag">${p0.tag || '特稿'}</span>
        <h3>${p0.title || ''}</h3>
        <div class="meta"><b>${p0.author || ''}</b> · ${p0.reads || ''} 阅读</div>
      </div>
    </div>
  `;

  // 3 smaller cards
  for (let k = 1; k < Math.min(4, picks.length); k++) {
    const p = picks[k];
    const c1 = p.color1 || '#ff5c38';
    const c2 = p.color2 || '#ff9a5c';
    html += `
      <div class="pick rv" data-idx="${p.articleIndex ?? k}">
        <div class="cov"><div class="g" style="background:linear-gradient(135deg, ${c1}, ${c2})"></div></div>
        <div class="shade"></div>
        <div class="info">
          <span class="tag">${p.tag || '精选'}</span>
          <h3>${p.title || ''}</h3>
          <div class="meta"><b>${p.author || ''}</b> · ${p.reads || ''} 阅读</div>
        </div>
      </div>
    `;
  }

  box.innerHTML = html;
  box.querySelectorAll('.pick').forEach(el => {
    el.onclick = () => openReader(+el.dataset.idx);
  });
}

// 渲染电影滑轨 CINEMA
let filmInterval = null;
function renderCinema() {
  const wrap = $('filmSlidesWrap');
  if (!wrap) return;

  const slides = portalConfig?.cinema?.slides || [
    { videoUrl: VURL.noir, watermark: 'NEON', tag: '城市 · 特稿', title: '霓虹雨夜', desc: '雨把城市洗成一块巨大的霓虹底片。我们在凌晨三点的便利店门口，读懂了不夜城的语法。', articleIndex: 0 },
    { videoUrl: VURL.volcano, watermark: 'CRATER', tag: '自然 · 特稿', title: '火山口', desc: '站在火山口边缘往下看，看到的是大地的心脏——一颗跳动了四十亿年的心脏。', articleIndex: 3 },
    { videoUrl: VURL.cloudsea, watermark: 'SUNRISE', tag: '旅行 · 特稿', title: '云海日出', desc: '凌晨四点登顶，在云海之上等一场日出。当第一缕金光刺破云层，值得所有的夜行。', articleIndex: 11 }
  ];

  wrap.innerHTML = slides.map((s, i) => `
    <div class="film-slide ${i === 0 ? 'active' : ''}" data-i="${s.articleIndex ?? i}">
      <video src="${s.videoUrl || ''}" autoplay muted loop playsinline></video>
      <div class="film-shade"></div>
      <div class="film-word">${s.watermark || ''}</div>
      <div class="film-info">
        <span class="tag">${s.tag || ''}</span>
        <h3>${s.title || ''}</h3>
        <p>${s.desc || ''}</p>
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('.film-slide').forEach(s => {
    s.onclick = () => openReader(+s.dataset.i);
  });

  initCinemaReel();
}

function initCinemaReel() {
  let idx = 0;
  const slides = document.querySelectorAll('.film-slide');
  const prog = $('filmProg');
  if (!slides.length) return;

  function show(d) {
    idx = (idx + d + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    if (prog) prog.style.width = `${((idx + 1) / slides.length) * 100}%`;
  }

  document.querySelectorAll('[data-film]').forEach(b => {
    b.onclick = (e) => {
      e.stopPropagation();
      show(+b.dataset.film);
    };
  });

  show(0);
  if (filmInterval) clearInterval(filmInterval);
  filmInterval = setInterval(() => {
    if (!document.hidden) show(1);
  }, 7000);
}

// 渲染全部文章列表 (杂志四列高定卡片 / 双列精美列表)
function renderGrid() {
  const box = $('grid');
  if (!box) return;

  const list = ARTICLES.map((a, i) => ({ a, i })).filter(o => {
    const meta = META[o.a.v] || {};
    if (showBmk && !bmk.has(o.a.v)) return false;
    if (curCat !== '全部' && o.a.tag !== curCat) return false;
    if (query) {
      const q = query.toLowerCase();
      const combined = `${o.a.cn} ${o.a.en || ''} ${o.a.sum || ''} ${o.a.tag || ''} ${meta.author || ''}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  if ($('gridCount')) $('gridCount').textContent = `${list.length} 篇`;
  if ($('clearFilter')) $('clearFilter').style.display = (curCat !== '全部' || query || showBmk) ? '' : 'none';

  if (!list.length) {
    box.className = '';
    box.innerHTML = '<div class="empty">没有找到相关文章，换个关键词或分类试试</div>';
    return;
  }

  if (gridViewMode === 'cards') {
    box.className = 'grid-cards';
    box.innerHTML = list.map(o => {
      const a = o.a;
      const m = META[a.v] || { author: '编辑部', role: '特稿', date: '2026-10-18', reads: '1.2万', c1: '#3b5bff', c2: '#8a7cff' };
      const isOn = bmk.has(a.v);
      const covMedia = m.cover_image ? `<img src="${m.cover_image}" alt="" />` : '';
      const idxStr = (o.i < 9 ? '0' : '') + (o.i + 1);

      return `
        <article class="folio-card rv" data-i="${o.i}" style="--c1:${m.c1}; --c2:${m.c2};">
          <div class="fc-cov">
            ${covMedia}
            <div class="fc-mesh"></div>
            <span class="fc-tag">${a.tag}</span>
            <button type="button" class="fc-bmk ${isOn ? 'on' : ''}" data-v="${a.v}" aria-label="收藏">
              ${isOn ? '★' : '☆'}
            </button>
            <span class="fc-idx">${idxStr}</span>
          </div>
          <div class="fc-body">
            <div class="fc-meta-top">
              <span>${(a.time || '').replace('阅读约 ', '')}</span>
              <span>${m.date}</span>
            </div>
            <h3 class="fc-title">${a.cn}</h3>
            <p class="fc-sum">${a.sum}</p>
            <div class="fc-foot">
              <div class="fc-author">
                <span class="avatar" style="background:${avColor(m.author)}; width:24px; height:24px; font-size:11px; flex:0 0 24px;">
                  ${(m.author || '白')[0]}
                </span>
                <span class="author-name">${m.author}</span>
                <span class="author-role">${m.role}</span>
              </div>
              <div class="fc-reads">
                <span>${m.reads} 阅读</span>
                <span class="fc-arrow">→</span>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    box.querySelectorAll('.folio-card').forEach(card => {
      card.onclick = () => openReader(+card.dataset.i);
    });
    box.querySelectorAll('.fc-bmk').forEach(b => {
      b.onclick = (e) => toggleBmk(b.dataset.v, e);
    });
  } else {
    box.className = 'grid-list';
    box.innerHTML = list.map(o => {
      const a = o.a;
      const m = META[a.v] || { author: '编辑部', role: '特稿', date: '2026-10-18', reads: '1.2万', c1: '#3b5bff', c2: '#8a7cff' };
      const isOn = bmk.has(a.v);
      const thumbImg = m.cover_image ? `<img src="${m.cover_image}" alt="" />` : '';

      return `
        <div class="arow rv" data-i="${o.i}" style="--c1:${m.c1}; --c2:${m.c2};">
          <div class="idx">${o.i < 9 ? '0' : ''}${o.i + 1}</div>
          <div class="thumb">
            ${thumbImg}
            <span class="tag">${a.tag}</span>
          </div>
          <div class="mid">
            <h3>${a.cn}</h3>
            <div class="sum">${a.sum}</div>
            <div class="meta-line">
              <div class="who">
                <span class="avatar" style="background:${avColor(m.author)}; width:22px; height:22px; font-size:11px; flex-basis:22px">
                  ${(m.author || '白')[0]}
                </span>
                <span>${m.author} · ${m.role}</span>
              </div>
              <div class="tm">${(a.time || '').replace('阅读约 ', '')} · ${m.reads} 阅读</div>
            </div>
          </div>
          <div class="meta">
            <button type="button" class="bmk ${isOn ? 'on' : ''}" data-v="${a.v}" aria-label="收藏">
              ${isOn ? '★' : '☆'}
            </button>
            <span class="go">→</span>
          </div>
        </div>
      `;
    }).join('');

    box.querySelectorAll('.arow').forEach(row => {
      row.onclick = () => openReader(+row.dataset.i);
    });
    box.querySelectorAll('.bmk').forEach(b => {
      b.onclick = (e) => toggleBmk(b.dataset.v, e);
    });
  }

  observeRv(box);
}

// 渲染快讯 THE WIRE
function renderWire() {
  const f = $('flash');
  if (!f) return;

  const items = portalConfig?.theWire?.items || [
    { title: '霓虹雨夜入选本月最佳特稿', tag: '城市', time: '2 小时前', articleIndex: 0 },
    { title: '樱落时分》印刷版加印第三次', tag: '文化', time: '5 小时前', articleIndex: 7 },
    { title: '云海日出摄影展周末开展', tag: '旅行', time: '8 小时前', articleIndex: 11 },
    { title: '火山口科考队发回最新影像', tag: '自然', time: '12 小时前', articleIndex: 3 },
    { title: '虚空》获年度哲学图书提名', tag: '哲学', time: '1 天前', articleIndex: 13 }
  ];

  f.innerHTML = items.map(it => `
    <div class="frow" data-i="${it.articleIndex ?? 0}">
      <span class="tm">${it.time}</span>
      <span class="tt">${it.title}<small>${it.tag || '快讯'}</small></span>
      <span class="arr">→</span>
    </div>
  `).join('');

  f.querySelectorAll('.frow').forEach(r => {
    r.onclick = () => openReader(+r.dataset.i);
  });
}

// 渲染热榜 TRENDING 5
function renderTrending() {
  const t5 = $('trend5');
  if (!t5) return;

  const items = portalConfig?.trending?.items || [
    { rank: '01', title: '樱落时分', tag: '文化', reads: '18.9万', color1: '#e86a9a', articleIndex: 7 },
    { rank: '02', title: '火山口', tag: '自然', reads: '15.2万', color1: '#ff5c38', articleIndex: 3 },
    { rank: '03', title: '霓虹雨夜', tag: '城市', reads: '12.8万', color1: '#3b5bff', articleIndex: 0 },
    { rank: '04', title: '云海日出', tag: '旅行', reads: '3.8万', color1: '#e8a83d', articleIndex: 11 },
    { rank: '05', title: '龙', tag: '文化', reads: '10.2万', color1: '#1fae62', articleIndex: 12 }
  ];

  t5.innerHTML = items.map(it => `
    <div class="tr5 rv" data-i="${it.articleIndex ?? 0}" style="--c1:${it.color1 || '#3b5bff'}">
      <div class="n">${it.rank}</div>
      <h4>${it.title}</h4>
      <div class="m">${it.reads} 阅读 · ${it.tag}</div>
    </div>
  `).join('');

  t5.querySelectorAll('.tr5').forEach(r => {
    r.onclick = () => openReader(+r.dataset.i);
  });
}

// 渲染驻站作者 AUTHORS (暗夜典藏艺廊 · 宽幅艺术卡片)
function renderAuthors() {
  const pic = $('teamPortrait'), chr = $('teamChar'), img = $('teamImg'), roleBadge = $('tpAuthorRole'), info = $('teamInfo'), box = $('teamAvatars');
  if (!pic || !box || !info) return;

  const authors = portalConfig?.authors?.items || [
    { name: '陈默', role: '特稿记者', color: '#d97857', bio: '把远方折成可以翻阅的形状，常年行走在城市与荒野之间。', count: '3 篇特稿' },
    { name: '林晚', role: '自然撰稿', color: '#5da87a', bio: '相信每一片叶子都有名字，山野是她永远的编辑部。', count: '2 篇特稿' },
    { name: '沈括', role: '科学编辑', color: '#527fd4', bio: '把论文翻译成人话，让宇宙变得可以触摸。', count: '3 篇特稿' },
    { name: '顾晓', role: '文化评论', color: '#a263a7', bio: '在传统与潮流之间摆渡，打捞时间的碎片。', count: '3 篇特稿' },
    { name: '江离', role: '旅行作家', color: '#e8a33d', bio: '一年有两百天在路上，剩下的一百天在写路上的事。', count: '2 篇特稿' },
    { name: '陆深', role: '专栏作者', color: '#7a4ff0', bio: '关心"无"与"有"之间的一切，哲学是他的望远镜。', count: '2 篇特稿' }
  ];

  function showAuthor(i) {
    const m = authors[i];
    box.querySelectorAll('.team-avatar').forEach((b, j) => b.classList.toggle('active', i === j));
    pic.classList.remove('switching');
    void pic.offsetWidth;
    pic.style.setProperty('--member', m.color || '#d97857');

    const photoUrl = m.photo || m.avatar_image || m.image;
    if (photoUrl) {
      if (img) {
        img.src = photoUrl;
        img.style.display = 'block';
      }
      if (chr) chr.style.display = 'none';
    } else {
      if (img) img.style.display = 'none';
      if (chr) {
        chr.style.display = 'block';
        chr.textContent = (m.name || '白')[0];
      }
    }

    if (roleBadge) roleBadge.textContent = m.role || '特稿记者';
    pic.classList.add('switching');

    info.style.opacity = '0.15';
    info.style.transform = 'translateY(10px)';
    setTimeout(() => {
      info.innerHTML = `
        <div class="role">${m.role || '特稿专栏'}</div>
        <h3>${m.name}</h3>
        <p>${m.bio}</p>
        <div class="cnt">${m.count || '白卷驻站'} · 驻站专栏</div>
        <button type="button" class="btn-author-more" id="teamMore">浏览TA的专栏文章 →</button>
      `;
      info.style.transition = '0.35s';
      info.style.opacity = '1';
      info.style.transform = 'none';

      const moreBtn = $('teamMore');
      if (moreBtn) {
        moreBtn.onclick = () => {
          query = m.name;
          if ($('q')) $('q').value = m.name;
          curCat = '全部';
          showBmk = false;
          renderGrid();
          $('sec-grid')?.scrollIntoView({ behavior: 'smooth' });
        };
      }
    }, 140);
  }

  box.innerHTML = authors.map((m, i) => `
    <button type="button" class="team-avatar ${i === 0 ? 'active' : ''}" style="--member:${m.color || '#ffd166'}" data-m="${i}" aria-label="${m.name}">
      ${m.avatar_thumb ? `<img src="${m.avatar_thumb}" alt="${m.name}" />` : (m.name || '白')[0]}
    </button>
  `).join('');

  box.querySelectorAll('.team-avatar').forEach(b => {
    b.addEventListener('click', () => showAuthor(+b.dataset.m));
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') showAuthor(+b.dataset.m);
    });
  });

  showAuthor(0);
}

// 知识网络 GRAPH 交互
function initKnowledgeGraph() {
  const nodes = document.querySelectorAll('.cyber-node');
  const pulse = $('cyberPulse');
  if (!nodes.length || !pulse) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let idx = 0, start = performance.now();
  nodes.forEach(nd => {
    nd.onclick = () => {
      setCat(nd.dataset.topic);
      $('sec-grid')?.scrollIntoView({ behavior: 'smooth' });
    };
  });

  function tick(t) {
    const p = ((t - start) % 3600) / 3600;
    const step = Math.min(nodes.length - 1, Math.floor(p * nodes.length));
    if (step !== idx) {
      idx = step;
      nodes.forEach((n, i) => n.classList.toggle('active', i === idx));
    }
    pulse.style.offsetDistance = `${p * 100}%`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const gt = $('graphTags');
  if (gt) {
    gt.innerHTML = CATS.slice(1).map(c => `<span data-t="${c}">${c}</span>`).join('');
    gt.querySelectorAll('span').forEach(s => {
      s.onclick = () => {
        setCat(s.dataset.t);
        $('sec-grid')?.scrollIntoView({ behavior: 'smooth' });
      };
    });
  }
}

// 渲染页脚
function renderFooter() {
  if (!portalConfig?.footer) return;
  const f = portalConfig.footer;
  if ($('footBrandDesc') && f.brandDesc) $('footBrandDesc').textContent = f.brandDesc;
  if ($('footCopy') && f.copyright) $('footCopy').textContent = f.copyright;
}

// 沉浸式阅读器 DRAWER (1440px 宽屏杂志级排版)
function openReader(i) {
  const safeIdx = Math.max(0, Math.min(ARTICLES.length - 1, i));
  const a = ARTICLES[safeIdx];
  if (!a) return;

  const m = META[a.v] || { author: '编辑部', role: '特稿', date: '2026-10-18', reads: '1.2万', c1: '#3b5bff' };
  const reader = $('reader');
  const body = $('readerBody');
  if (!reader || !body) return;

  const slugOrId = a.rawArticle?.slug || a.rawArticle?.id || a.v;
  const fullPageUrl = `/article.html?slug=${encodeURIComponent(slugOrId)}`;

  if ($('rBarTitle')) $('rBarTitle').textContent = a.cn;
  if ($('rFullPageBtn')) {
    $('rFullPageBtn').href = fullPageUrl;
  }

  // 媒体封面：优先视频，其次图片
  let mediaHtml = '';
  if (VURL[a.v]) {
    mediaHtml = `<div class="rvideo"><video src="${VURL[a.v]}" autoplay muted loop playsinline></video></div>`;
  } else if (m.cover_image) {
    mediaHtml = `<div class="rvideo"><img src="${escapeAttr(m.cover_image)}" alt="" style="width:100%;object-fit:cover;" /></div>`;
  }

  // 正文渲染：全面支持 Markdown 解析、图片语法、标题提取
  let headings = [];
  let contentHtml = '';
  if (a.isDbArticle && a.rawArticle?.content) {
    const rendered = enhanceArticleContent(renderContent(a.rawArticle.content));
    contentHtml = `<div class="article-viewer">${rendered.html}</div>`;
    headings = rendered.headings || [];
  } else {
    let rawParagraphs = '';
    (a.body || []).forEach((p, k) => {
      rawParagraphs += `<p class="${k === 0 ? 'lead' : ''}">${p}</p>`;
      if (k === 1 && a.quote) {
        rawParagraphs += `<div class="pull"><blockquote>${a.quote[0]}</blockquote><cite>${a.quote[1]}</cite></div>`;
      }
    });
    contentHtml = `<div class="article-viewer">${rawParagraphs}</div>`;
  }

  // 相关推荐列表
  const relIndices = ARTICLES.map((x, j) => j).filter(j => j !== safeIdx && ARTICLES[j].tag === a.tag);
  while (relIndices.length < 3) {
    const r = Math.floor(Math.random() * ARTICLES.length);
    if (r !== safeIdx && !relIndices.includes(r)) relIndices.push(r);
  }

  const relatedHtml = relIndices.slice(0, 3).map(j => {
    const ra = ARTICLES[j];
    const rm = META[ra.v] || { author: '编辑部', time: '8分钟' };
    return `
      <div class="rel" data-i="${j}">
        <b>${escapeHtml(ra.cn)}</b>
        <span>${escapeHtml(rm.author || '编辑部')} · ${escapeHtml(ra.time || '8分钟')}</span>
      </div>
    `;
  }).join('');

  // 目录导航 HTML
  const tocHtml = headings.length ? `
    <div class="reader-toc">
      <div class="reader-toc__head">
        <h3>文章目录</h3>
        <span style="font-size:12px;color:var(--muted);">${headings.length} 节</span>
      </div>
      <nav class="reader-toc__list" id="readerTocList">
        ${headings.map(h => `
          <a class="reader-toc__item reader-toc__item--${escapeAttr(h.level)}" href="#${escapeAttr(h.id)}" data-target="${escapeAttr(h.id)}">
            ${escapeHtml(h.text)}
          </a>
        `).join('')}
      </nav>
    </div>
  ` : '';

  // 1440px 黄金双栏网格渲染
  body.innerHTML = `
    <div class="reader-layout">
      <main class="reader-main">
        <span class="tag">${escapeHtml(a.tag || '专栏特稿')}</span>
        <h1>${escapeHtml(a.cn || a.title)}</h1>
        <div class="enline">${escapeHtml(a.en || '')}</div>
        <div class="rmeta">
          <span class="avatar" style="background:${avColor(m.author)}">${escapeHtml((m.author || '白')[0])}</span>
          <span class="who"><b>${escapeHtml(m.author)}</b><span>${escapeHtml(m.role || '专栏作者')}</span></span>
          <span class="when">${escapeHtml(m.date || '')} · ${escapeHtml(a.time || '阅读约 8 分钟')} · ${escapeHtml(String(m.reads || ''))} 阅读</span>
        </div>
        ${mediaHtml}
        ${contentHtml}
        <div class="author-card">
          <span class="avatar" style="background:${avColor(m.author)}">${escapeHtml((m.author || '白')[0])}</span>
          <div>
            <b>${escapeHtml(m.author)} · ${escapeHtml(m.role || '专栏作者')}</b>
            <p>白卷驻站作者，长期关注${escapeHtml(a.tag || '技术')}领域的现场报道与深度实践。</p>
          </div>
        </div>
        <div class="rtags">
          <span>#${escapeHtml(a.tag || '专栏')}</span>
          <span>#深度特稿</span>
          <span>#白卷VOL.1</span>
        </div>
      </main>
      <aside class="reader-sidebar">
        <div class="reader-sidebar__sticky">
          ${tocHtml}
          <div class="reader-aside-block">
            <h3>相关精选</h3>
            <div class="reader-aside-rels">${relatedHtml}</div>
          </div>
          <div class="reader-aside-block">
            <h3>阅读与分享</h3>
            <div class="reader-aside-tools">
              <button type="button" class="rtool-btn" id="readerCopyLink">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                <span>复制文章直达链接</span>
              </button>
              <a href="${escapeAttr(fullPageUrl)}" target="_blank" class="rtool-btn">
                <span>↗ 独立全屏大页阅读</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;

  // 1. 嵌入音频卡片交互绑定
  bindArticleAudio(body);

  // 2. 代码块复制与 macOS 控制条绑定
  bindCodeBlocks(body, msg => toast(msg));

  // 3. 正文图片放大灯箱绑定
  body.querySelectorAll('.article-viewer img').forEach(img => {
    img.tabIndex = 0;
    img.role = 'button';
    img.title = '点击放大预览';
    img.onclick = () => openLightbox(img.src, img.alt);
  });

  // 4. 复制文章直达链接
  const copyBtn = $('readerCopyLink');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        const fullUrl = new URL(fullPageUrl, location.origin).href;
        await navigator.clipboard.writeText(fullUrl);
        toast('已复制文章直达链接');
      } catch {
        toast('复制失败');
      }
    };
  }

  // 5. 标题锚点点击复制直达链接并平滑滚动
  body.querySelectorAll('.heading-anchor').forEach(anchor => {
    anchor.onclick = async (e) => {
      e.preventDefault();
      const href = anchor.getAttribute('href') || '';
      const targetId = href.replace(/^#/, '');
      const targetElem = document.getElementById(targetId);
      if (targetElem && reader) {
        const targetTop = targetElem.offsetTop - 84;
        reader.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        try {
          const fullUrl = new URL(fullPageUrl + href, location.origin).href;
          await navigator.clipboard.writeText(fullUrl);
          toast('已复制小节直达链接');
        } catch {}
      }
    };
  });

  // 6. 目录滚动联动与点击精准定位
  const tocLinks = Array.from(body.querySelectorAll('.reader-toc__item'));
  if (tocLinks.length) {
    tocLinks.forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const targetElem = document.getElementById(targetId);
        if (targetElem && reader) {
          const targetTop = targetElem.offsetTop - 84;
          reader.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      };
    });

    const headingElems = Array.from(body.querySelectorAll('.article-viewer h2, .article-viewer h3'));
    if (headingElems.length) {
      let scrollTicking = false;
      const updateTocSpy = () => {
        const currentScroll = reader.scrollTop + 120;
        let activeId = '';
        for (let k = 0; k < headingElems.length; k++) {
          if (headingElems[k].offsetTop <= currentScroll) {
            activeId = headingElems[k].id;
          } else {
            break;
          }
        }
        tocLinks.forEach(l => {
          if (l.getAttribute('data-target') === activeId) {
            l.classList.add('is-active');
          } else {
            l.classList.remove('is-active');
          }
        });
        scrollTicking = false;
      };

      reader.addEventListener('scroll', () => {
        if (!scrollTicking) {
          window.requestAnimationFrame(updateTocSpy);
          scrollTicking = true;
        }
      }, { passive: true });
    }
  }

  // 7. 推荐点击切换文章
  body.querySelectorAll('.rel').forEach(r => {
    r.onclick = (e) => {
      e.stopPropagation();
      openReader(+r.dataset.i);
      reader.scrollTop = 0;
    };
  });

  reader.classList.add('open');
  document.body.style.overflow = 'hidden';
  reader.scrollTop = 0;
}

function openLightbox(src, caption = '') {
  const lb = $('imageLightbox');
  const img = $('imageLightboxImg');
  const cap = $('imageLightboxCaption');
  if (!lb || !img) return;
  img.src = src;
  if (cap) {
    cap.textContent = caption || '';
    cap.style.display = caption ? 'block' : 'none';
  }
  lb.hidden = false;
}

function closeLightbox() {
  const lb = $('imageLightbox');
  const img = $('imageLightboxImg');
  if (!lb || !img) return;
  lb.hidden = true;
  img.removeAttribute('src');
}

// 全局交互事件
function bindGlobalEvents() {
  // 图片灯箱关闭
  $('closeImageLightbox')?.addEventListener('click', closeLightbox);
  $('imageLightbox')?.addEventListener('click', e => {
    if (e.target.id === 'imageLightbox' || e.target.id === 'closeImageLightbox') closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeLightbox();
      if ($('reader')?.classList.contains('open')) {
        $('reader').classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  });

  // 阅读器返回
  if ($('rBack')) {
    $('rBack').onclick = () => {
      $('reader')?.classList.remove('open');
      document.body.style.overflow = '';
    };
  }

  // 进度条
  const reader = $('reader');
  if (reader) {
    reader.addEventListener('scroll', () => {
      const p = reader.scrollTop / (reader.scrollHeight - reader.clientHeight);
      if ($('rProg')) $('rProg').style.width = `${p * 100}%`;
    }, { passive: true });
  }

  // 首屏阅读按钮
  if ($('heroRead')) {
    $('heroRead').onclick = () => openReader(0);
  }

  // 搜索框
  if ($('q')) {
    $('q').addEventListener('input', (e) => {
      query = e.target.value.trim();
      renderGrid();
    });
  }

  // 清空筛选
  if ($('clearFilter')) {
    $('clearFilter').onclick = () => {
      curCat = '全部';
      query = '';
      showBmk = false;
      if ($('q')) $('q').value = '';
      setCat('全部');
    };
  }

  // 书签切换
  if ($('bmkNav')) {
    $('bmkNav').onclick = () => {
      showBmk = !showBmk;
      curCat = '全部';
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
      renderGrid();
      $('sec-grid')?.scrollIntoView({ behavior: 'smooth' });
      toast(showBmk ? '只看我的书签' : '已显示全部');
    };
  }

  // 视图切换 (四列网格 / 双列紧凑)
  const btnGrid = $('btnViewGrid');
  const btnList = $('btnViewList');
  if (btnGrid && btnList) {
    btnGrid.classList.toggle('on', gridViewMode === 'cards');
    btnList.classList.toggle('on', gridViewMode === 'list');

    btnGrid.onclick = () => {
      if (gridViewMode === 'cards') return;
      gridViewMode = 'cards';
      localStorage.setItem('folio_grid_mode', 'cards');
      btnGrid.classList.add('on');
      btnList.classList.remove('on');
      renderGrid();
    };
    btnList.onclick = () => {
      if (gridViewMode === 'list') return;
      gridViewMode = 'list';
      localStorage.setItem('folio_grid_mode', 'list');
      btnList.classList.add('on');
      btnGrid.classList.remove('on');
      renderGrid();
    };
  }

  // 锚点跳转
  document.querySelectorAll('[data-goto]').forEach(a => {
    a.onclick = () => {
      const target = document.getElementById(a.dataset.goto);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    };
  });

  // Newsletter
  if ($('nlBtn')) {
    $('nlBtn').onclick = () => {
      const v = ($('nlMail')?.value || '').trim();
      if (!v || !v.includes('@')) {
        toast('请填写正确的邮箱地址');
        return;
      }
      if ($('nlMail')) $('nlMail').value = '';
      toast('订阅成功，每周五见！');
    };
  }
}

// 动态淡入视口监听
let _io = null;
function observeRv(scope) {
  _io = _io || new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        _io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  (scope || document).querySelectorAll('.rv:not(.in)').forEach(el => {
    _io.observe(el);
  });
}
