/* =========================================================
   棲白 QIBAI Studio — data.js
   所有案例資料集中在這裡。Hero 輪播、專案圖庫、專案詳情都讀這份資料，
   新增案例只要在陣列裡加一筆，不需要改 HTML。
   ========================================================= */

const CASES = [
  {
    id: 'bamboo',
    name: '竹影居',
    category: 'residential',          // residential = 住宅、commercial = 商業空間
    categoryLabel: '住宅',
    city: '台中',
    location: '台中市西屯區',
    size: 32,                          // 坪
    year: 2025,
    style: '減法新中式',
    room: '主臥',
    img: 'images/case-bamboo.jpg',
    alt: '竹影居主臥：木格柵床頭與窗外灑進的樹影',
    origin: [470, 430],                // Hero 水墨暈染時，墨滴落下的位置（畫布 800 × 1000）
    need: '一家三口的三房住宅。屋主希望主臥能真正安靜下來，收納要夠，但不想看到整排櫃門。',
    concept: '床頭做成低矮的木格柵牆，午後陽光穿過窗外的樹，影子落在白牆上，就是臥室唯一的裝飾。收納全部藏進牆面的細縫分割裡，關上時只剩幾條線。',
    materials: ['白橡木', '木格柵', '礦物塗料', '手織地毯'],
    // 詳情頁的細節視角：用同一張照片放大不同位置（x%、y%、放大倍率）
    details: [
      { label: '全景', x: 50, y: 50, zoom: 1 },
      { label: '格柵床頭', x: 70, y: 58, zoom: 2.2 },
      { label: '窗邊樹影', x: 75, y: 30, zoom: 2 }
    ]
  },
  {
    id: 'teahouse',
    name: '一盞茶室',
    category: 'commercial',
    categoryLabel: '商業空間',
    city: '台南',
    location: '台南市中西區',
    size: 20,
    year: 2024,
    style: '暗調東方',
    room: '茶席',
    img: 'images/case-teahouse.jpg',
    alt: '一盞茶室：深色木地板、朱紅牆板與枯枝花藝',
    origin: [520, 520],
    need: '老街裡的小茶室，20 坪要放進 6 個茶席，同時保留讓客人慢下來的安靜感。',
    concept: '地板與家具全部退到深色，只留一面朱漆牆板當視覺焦點。長窗用橫向細格柵過濾街景，坐下來只看得到光，看不到行人。',
    materials: ['炭化木地板', '朱漆牆板', '黑鐵層架', '手工土牆'],
    details: [
      { label: '全景', x: 50, y: 50, zoom: 1 },
      { label: '朱漆牆板', x: 62, y: 42, zoom: 2.2 },
      { label: '橫格柵長窗', x: 28, y: 42, zoom: 2 }
    ]
  },
  {
    id: 'minsu',
    name: '聽雨民宿',
    category: 'commercial',
    categoryLabel: '商業空間',
    city: '花蓮',
    location: '花蓮縣壽豐鄉',
    size: 60,
    year: 2025,
    style: '書院茶寮',
    room: '客房茶間',
    img: 'images/case-minsu.jpg',
    alt: '聽雨民宿茶間：竹簾、書法掛軸與窗外借景',
    origin: [330, 470],
    need: '六間客房的民宿，業主希望每一間都有一處能看見窗外景色的茶間，讓旅客願意待在房間裡。',
    concept: '大面落地窗把庭院的花樹借進室內，竹簾讓光線可以一段一段調整。牆上只掛一幅書法，木樑保留原本的粗糙紋理。',
    materials: ['竹簾', '老木樑', '榻榻米', '宣紙吊燈'],
    details: [
      { label: '全景', x: 50, y: 50, zoom: 1 },
      { label: '竹簾與借景', x: 15, y: 50, zoom: 2 },
      { label: '書法與紙燈', x: 62, y: 38, zoom: 2 }
    ]
  },
  {
    id: 'hillside',
    name: '半山宅',
    category: 'residential',
    categoryLabel: '住宅',
    city: '台北',
    location: '台北市士林區',
    size: 45,
    year: 2024,
    style: '石與光',
    room: '客用衛浴',
    img: 'images/case-hillside.jpg',
    alt: '半山宅客用衛浴：石材牆面與間接照明',
    origin: [420, 600],
    need: '山邊的四房住宅。客用衛浴在走廊盡頭，屋主希望夜裡經過時，它像一個安靜的小展間。',
    concept: '牆面用粗面石材包覆，檯面懸空，上下各藏一道光帶。不開主燈時，只靠間接光就能看清石材的質地與一枝枯枝花器。',
    materials: ['粗面石材', '洞石檯面', '間接光帶', '黑色衛浴設備'],
    details: [
      { label: '全景', x: 50, y: 50, zoom: 1 },
      { label: '懸浮檯面', x: 45, y: 58, zoom: 2 },
      { label: '石材與光帶', x: 50, y: 22, zoom: 2.2 }
    ]
  }
];

/* ---------- 空間導覽：以「竹影居」為例，依進門後的動線排列 ---------- */
const TOUR = {
  caseId: 'bamboo',
  rooms: [
    {
      id: 'entry',
      name: '玄關',
      size: 3,
      img: 'images/tour-entry.jpg',
      alt: '竹影居玄關：長虹玻璃屏風、胡桃木玄關櫃與紙燈',
      text: '一進門先遇到一道長虹玻璃屏風，擋住直視餐廳的視線，光線卻能透過來。玄關櫃上只放一件石雕，回家第一眼看到的是自己喜歡的東西。',
      materials: ['長虹玻璃', '胡桃木皮', '手工紙燈'],
      hotspot: [14.2, 82.3]             // 熱點在平面圖上的位置（左 %、上 %）
    },
    {
      id: 'dining',
      name: '餐廚',
      size: 7,
      img: 'images/tour-dining.jpg',
      alt: '竹影居餐廚：洞石中島連接白橡木長桌，後方是茶壺展示櫃',
      text: '洞石中島和長桌連成一線，做菜和吃飯的人可以面對面說話。牆上的格櫃收著屋主收藏的鐵壺，也成了餐廳的主牆。',
      materials: ['洞石', '白橡木長桌', '大理石吊燈'],
      hotspot: [43.3, 78.1]
    },
    {
      id: 'tea',
      name: '茶室',
      size: 4,
      img: 'images/tour-tea.jpg',
      alt: '竹影居茶室：架高木平台、書法掛軸、竹子與竹簾',
      text: '客廳旁架高 40 公分的茶室，平台下方是書櫃。竹簾調整午後的光，坐下來時，視線剛好落在一盆竹子上。',
      materials: ['架高木平台', '竹簾', '編織地墊'],
      hotspot: [14.2, 36.5]
    },
    {
      id: 'master',
      name: '主臥',
      size: 6,
      img: 'images/case-bamboo.jpg',
      alt: '竹影居主臥：木格柵床頭與窗外灑進的樹影',
      text: '床頭是一道低矮的木格柵牆，窗外的樹影落在白牆上，就是房間唯一的裝飾。衣櫃藏在牆面的細縫分割裡。',
      materials: ['白橡木', '木格柵', '礦物塗料'],
      hotspot: [70, 28.1]
    }
  ]
};
