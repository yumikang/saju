// 한자 데이터베이스 - 훈음별 한자 리스트
export interface HanjaChar {
  char: string;
  meaning: string;
  reading: string;
  strokes: number;
  element?: string; // 오행
}

export const hanjaDatabase: Record<string, HanjaChar[]> = {
  // 김(金) 성씨
  "김": [
    { char: "金", meaning: "쇠, 금", reading: "김", strokes: 8, element: "금" }
  ],
  
  // 이(李) 성씨
  "이": [
    { char: "李", meaning: "오얏나무", reading: "이", strokes: 7, element: "목" },
    { char: "伊", meaning: "그, 이", reading: "이", strokes: 6, element: "토" }
  ],
  
  // 박(朴) 성씨
  "박": [
    { char: "朴", meaning: "박달나무", reading: "박", strokes: 6, element: "목" }
  ],
  
  // 최(崔) 성씨
  "최": [
    { char: "崔", meaning: "높을", reading: "최", strokes: 11, element: "토" }
  ],
  
  // 정(鄭) 성씨
  "정": [
    { char: "鄭", meaning: "나라이름", reading: "정", strokes: 14, element: "화" },
    { char: "正", meaning: "바를", reading: "정", strokes: 5, element: "화" },
    { char: "靜", meaning: "고요할", reading: "정", strokes: 16, element: "금" },
    { char: "情", meaning: "정", reading: "정", strokes: 11, element: "금" }
  ],
  
  // 강(姜) 성씨
  "강": [
    { char: "姜", meaning: "생강", reading: "강", strokes: 9, element: "목" },
    { char: "康", meaning: "편안할", reading: "강", strokes: 11, element: "목" },
    { char: "江", meaning: "강", reading: "강", strokes: 6, element: "수" }
  ],
  
  // 조(趙) 성씨
  "조": [
    { char: "趙", meaning: "나라이름", reading: "조", strokes: 14, element: "화" },
    { char: "曺", meaning: "무리", reading: "조", strokes: 11, element: "금" }
  ],
  
  
  // 장(張) 성씨
  "장": [
    { char: "張", meaning: "활", reading: "장", strokes: 11, element: "화" },
    { char: "章", meaning: "글", reading: "장", strokes: 11, element: "화" }
  ],
  
  // 임(林) 성씨
  "임": [
    { char: "林", meaning: "수풀", reading: "임", strokes: 8, element: "목" },
    { char: "任", meaning: "맡을", reading: "임", strokes: 6, element: "금" }
  ],
  
  // 한(韓) 성씨
  "한": [
    { char: "韓", meaning: "나라이름", reading: "한", strokes: 17, element: "수" },
    { char: "漢", meaning: "한수", reading: "한", strokes: 13, element: "수" }
  ],
  
  // 오(吳) 성씨
  "오": [
    { char: "吳", meaning: "나라이름", reading: "오", strokes: 7, element: "목" },
    { char: "五", meaning: "다섯", reading: "오", strokes: 4, element: "토" }
  ],
  
  // 신(申) 성씨
  "신": [
    { char: "申", meaning: "신", reading: "신", strokes: 5, element: "금" },
    { char: "愼", meaning: "삼갈", reading: "신", strokes: 13, element: "금" }
  ],
  
  // 유(劉) 성씨
  "유": [
    { char: "劉", meaning: "성", reading: "유", strokes: 15, element: "금" },
    { char: "柳", meaning: "버들", reading: "유", strokes: 9, element: "목" }
  ],
  
  // 안(安) 성씨
  "안": [
    { char: "安", meaning: "편안할", reading: "안", strokes: 6, element: "토" }
  ],
  
  // 송(宋) 성씨
  "송": [
    { char: "宋", meaning: "나라이름", reading: "송", strokes: 7, element: "금" },
    { char: "松", meaning: "소나무", reading: "송", strokes: 8, element: "목" }
  ],
  
  // 전(田) 성씨
  "전": [
    { char: "田", meaning: "밭", reading: "전", strokes: 5, element: "화" },
    { char: "全", meaning: "온전할", reading: "전", strokes: 6, element: "금" }
  ],
  
  // 홍(洪) 성씨
  "홍": [
    { char: "洪", meaning: "큰물", reading: "홍", strokes: 9, element: "수" }
  ],
  
  // 고(高) 성씨
  "고": [
    { char: "高", meaning: "높을", reading: "고", strokes: 10, element: "목" },
    { char: "古", meaning: "옛", reading: "고", strokes: 5, element: "목" }
  ],
  
  // 문(文) 성씨
  "문": [
    { char: "文", meaning: "글월", reading: "문", strokes: 4, element: "수" },
    { char: "門", meaning: "문", reading: "문", strokes: 8, element: "수" }
  ],
  
  // 양(楊) 성씨
  "양": [
    { char: "楊", meaning: "버들", reading: "양", strokes: 13, element: "목" },
    { char: "梁", meaning: "대들보", reading: "양", strokes: 11, element: "목" }
  ],
  
  // 손(孫) 성씨
  "손": [
    { char: "孫", meaning: "손자", reading: "손", strokes: 10, element: "금" }
  ],
  
  // 배(裵) 성씨
  "배": [
    { char: "裵", meaning: "성", reading: "배", strokes: 14, element: "수" },
    { char: "白", meaning: "흰", reading: "배", strokes: 5, element: "금" }
  ],
  
  
  // 이름용 한자들
  "민": [
    { char: "民", meaning: "백성", reading: "민", strokes: 5, element: "수" },
    { char: "敏", meaning: "민첩할", reading: "민", strokes: 11, element: "수" },
    { char: "旻", meaning: "하늘", reading: "민", strokes: 8, element: "화" },
    { char: "玟", meaning: "옥돌", reading: "민", strokes: 8, element: "수" }
  ],
  
  "준": [
    { char: "俊", meaning: "준수할", reading: "준", strokes: 9, element: "화" },
    { char: "峻", meaning: "높을", reading: "준", strokes: 10, element: "토" },
    { char: "駿", meaning: "준마", reading: "준", strokes: 17, element: "금" },
    { char: "遵", meaning: "좇을", reading: "준", strokes: 15, element: "금" }
  ],
  
  "서": [
    { char: "瑞", meaning: "상서로울", reading: "서", strokes: 13, element: "금" },
    { char: "徐", meaning: "천천히", reading: "서", strokes: 10, element: "금" },
    { char: "西", meaning: "서녘", reading: "서", strokes: 6, element: "금" },
    { char: "書", meaning: "글", reading: "서", strokes: 10, element: "금" }
  ],
  
  "현": [
    { char: "賢", meaning: "어질", reading: "현", strokes: 16, element: "목" },
    { char: "炫", meaning: "빛날", reading: "현", strokes: 9, element: "화" },
    { char: "弦", meaning: "활시위", reading: "현", strokes: 8, element: "수" },
    { char: "玄", meaning: "검을", reading: "현", strokes: 5, element: "수" }
  ],
  
  "우": [
    { char: "宇", meaning: "집", reading: "우", strokes: 6, element: "토" },
    { char: "雨", meaning: "비", reading: "우", strokes: 8, element: "수" },
    { char: "友", meaning: "벗", reading: "우", strokes: 4, element: "토" },
    { char: "佑", meaning: "도울", reading: "우", strokes: 7, element: "토" }
  ],
  
  "진": [
    { char: "振", meaning: "떨칠", reading: "진", strokes: 10, element: "화" },
    { char: "眞", meaning: "참", reading: "진", strokes: 10, element: "금" },
    { char: "珍", meaning: "보배", reading: "진", strokes: 9, element: "화" },
    { char: "晋", meaning: "나아갈", reading: "진", strokes: 10, element: "화" }
  ],
  
  "호": [
    { char: "浩", meaning: "넓을", reading: "호", strokes: 10, element: "수" },
    { char: "皓", meaning: "밝을", reading: "호", strokes: 12, element: "목" },
    { char: "好", meaning: "좋을", reading: "호", strokes: 6, element: "수" },
    { char: "豪", meaning: "호걸", reading: "호", strokes: 14, element: "수" }
  ],
  
  "지": [
    { char: "智", meaning: "지혜", reading: "지", strokes: 12, element: "화" },
    { char: "志", meaning: "뜻", reading: "지", strokes: 7, element: "화" },
    { char: "知", meaning: "알", reading: "지", strokes: 8, element: "화" },
    { char: "池", meaning: "못", reading: "지", strokes: 6, element: "수" }
  ],
  
  "영": [
    { char: "英", meaning: "꽃", reading: "영", strokes: 8, element: "목" },
    { char: "榮", meaning: "영화", reading: "영", strokes: 14, element: "목" },
    { char: "永", meaning: "길", reading: "영", strokes: 5, element: "수" },
    { char: "映", meaning: "비칠", reading: "영", strokes: 9, element: "화" }
  ],
  
  "수": [
    { char: "水", meaning: "물", reading: "수", strokes: 4, element: "수" },
    { char: "秀", meaning: "빼어날", reading: "수", strokes: 7, element: "금" },
    { char: "壽", meaning: "목숨", reading: "수", strokes: 14, element: "금" },
    { char: "洙", meaning: "물이름", reading: "수", strokes: 9, element: "수" }
  ],
  
  "윤": [
    { char: "尹", meaning: "다스릴", reading: "윤", strokes: 4, element: "토" },
    { char: "允", meaning: "허락할", reading: "윤", strokes: 4, element: "토" },
    { char: "潤", meaning: "윤택할", reading: "윤", strokes: 15, element: "수" },
    { char: "玧", meaning: "옥", reading: "윤", strokes: 7, element: "금" },
    { char: "胤", meaning: "후사", reading: "윤", strokes: 9, element: "목" }
  ],
  
  "태": [
    { char: "泰", meaning: "클", reading: "태", strokes: 9, element: "수" },
    { char: "太", meaning: "클", reading: "태", strokes: 4, element: "화" },
    { char: "兌", meaning: "기쁠", reading: "태", strokes: 7, element: "금" }
  ],
  
  "희": [
    { char: "希", meaning: "바랄", reading: "희", strokes: 7, element: "수" },
    { char: "喜", meaning: "기쁠", reading: "희", strokes: 12, element: "화" },
    { char: "姬", meaning: "여자", reading: "희", strokes: 10, element: "목" },
    { char: "熙", meaning: "빛날", reading: "희", strokes: 13, element: "수" }
  ],
  
  "은": [
    { char: "銀", meaning: "은", reading: "은", strokes: 14, element: "금" },
    { char: "恩", meaning: "은혜", reading: "은", strokes: 10, element: "토" },
    { char: "隱", meaning: "숨을", reading: "은", strokes: 17, element: "토" }
  ],
  
  "아": [
    { char: "我", meaning: "나", reading: "아", strokes: 7, element: "목" },
    { char: "雅", meaning: "아름다울", reading: "아", strokes: 12, element: "목" },
    { char: "兒", meaning: "아이", reading: "아", strokes: 8, element: "금" }
  ],
  
  "연": [
    { char: "蓮", meaning: "연꽃", reading: "연", strokes: 13, element: "목" },
    { char: "燕", meaning: "제비", reading: "연", strokes: 16, element: "토" },
    { char: "延", meaning: "늘일", reading: "연", strokes: 7, element: "토" },
    { char: "演", meaning: "연기할", reading: "연", strokes: 14, element: "수" }
  ],
  
  "주": [
    { char: "珠", meaning: "구슬", reading: "주", strokes: 10, element: "화" },
    { char: "州", meaning: "고을", reading: "주", strokes: 6, element: "금" },
    { char: "柱", meaning: "기둥", reading: "주", strokes: 9, element: "목" },
    { char: "宙", meaning: "집", reading: "주", strokes: 8, element: "화" }
  ],
  
  "혜": [
    { char: "惠", meaning: "은혜", reading: "혜", strokes: 12, element: "수" },
    { char: "慧", meaning: "지혜", reading: "혜", strokes: 15, element: "수" },
    { char: "蕙", meaning: "혜초", reading: "혜", strokes: 15, element: "목" }
  ],
  
  "성": [
    { char: "成", meaning: "이룰", reading: "성", strokes: 6, element: "금" },
    { char: "聖", meaning: "성인", reading: "성", strokes: 13, element: "토" },
    { char: "星", meaning: "별", reading: "성", strokes: 9, element: "화" },
    { char: "誠", meaning: "정성", reading: "성", strokes: 13, element: "금" }
  ],
  
  "경": [
    { char: "景", meaning: "경치", reading: "경", strokes: 12, element: "목" },
    { char: "敬", meaning: "공경할", reading: "경", strokes: 12, element: "목" },
    { char: "京", meaning: "서울", reading: "경", strokes: 8, element: "목" },
    { char: "慶", meaning: "경사", reading: "경", strokes: 15, element: "목" }
  ],
  
  "도": [
    { char: "道", meaning: "길", reading: "도", strokes: 12, element: "화" },
    { char: "都", meaning: "도읍", reading: "도", strokes: 11, element: "토" },
    { char: "島", meaning: "섬", reading: "도", strokes: 10, element: "화" },
    { char: "桃", meaning: "복숭아", reading: "도", strokes: 10, element: "목" }
  ],
  
  
  "석": [
    { char: "石", meaning: "돌", reading: "석", strokes: 5, element: "금" },
    { char: "碩", meaning: "클", reading: "석", strokes: 14, element: "토" },
    { char: "昔", meaning: "옛날", reading: "석", strokes: 8, element: "화" }
  ],
  
  "철": [
    { char: "鐵", meaning: "쇠", reading: "철", strokes: 21, element: "금" },
    { char: "哲", meaning: "철학", reading: "철", strokes: 10, element: "화" },
    { char: "澈", meaning: "맑을", reading: "철", strokes: 15, element: "수" }
  ],
  
  "훈": [
    { char: "勳", meaning: "공", reading: "훈", strokes: 16, element: "토" },
    { char: "薰", meaning: "향기", reading: "훈", strokes: 16, element: "목" },
    { char: "燻", meaning: "그을릴", reading: "훈", strokes: 17, element: "화" }
  ],
  
  "용": [
    { char: "龍", meaning: "용", reading: "용", strokes: 16, element: "토" },
    { char: "容", meaning: "용모", reading: "용", strokes: 10, element: "토" },
    { char: "勇", meaning: "용감할", reading: "용", strokes: 9, element: "토" }
  ],
  
  "혁": [
    { char: "革", meaning: "가죽", reading: "혁", strokes: 9, element: "목" },
    { char: "赫", meaning: "빛날", reading: "혁", strokes: 14, element: "목" }
  ],
  
  "건": [
    { char: "健", meaning: "건강할", reading: "건", strokes: 11, element: "목" },
    { char: "建", meaning: "세울", reading: "건", strokes: 9, element: "목" },
    { char: "乾", meaning: "하늘", reading: "건", strokes: 11, element: "금" }
  ],
  
  "원": [
    { char: "元", meaning: "으뜸", reading: "원", strokes: 4, element: "목" },
    { char: "源", meaning: "근원", reading: "원", strokes: 13, element: "수" },
    { char: "園", meaning: "동산", reading: "원", strokes: 13, element: "토" },
    { char: "遠", meaning: "멀", reading: "원", strokes: 13, element: "토" }
  ],
  
  "환": [
    { char: "歡", meaning: "기쁠", reading: "환", strokes: 22, element: "수" },
    { char: "煥", meaning: "빛날", reading: "환", strokes: 13, element: "화" },
    { char: "桓", meaning: "굳셀", reading: "환", strokes: 10, element: "목" }
  ],
  
  "완": [
    { char: "完", meaning: "완전할", reading: "완", strokes: 7, element: "토" },
    { char: "琓", meaning: "옥", reading: "완", strokes: 12, element: "토" },
    { char: "椀", meaning: "그릇", reading: "완", strokes: 12, element: "목" }
  ],
  
  "규": [
    { char: "圭", meaning: "홀", reading: "규", strokes: 6, element: "토" },
    { char: "奎", meaning: "별", reading: "규", strokes: 9, element: "토" },
    { char: "葵", meaning: "해바라기", reading: "규", strokes: 12, element: "목" }
  ],
  
  "범": [
    { char: "範", meaning: "법", reading: "범", strokes: 15, element: "수" },
    { char: "凡", meaning: "무릇", reading: "범", strokes: 3, element: "수" },
    { char: "梵", meaning: "깨끗할", reading: "범", strokes: 11, element: "목" }
  ],
  
  "승": [
    { char: "承", meaning: "받들", reading: "승", strokes: 8, element: "금" },
    { char: "昇", meaning: "오를", reading: "승", strokes: 8, element: "화" },
    { char: "勝", meaning: "이길", reading: "승", strokes: 12, element: "금" }
  ],
  
  "찬": [
    { char: "燦", meaning: "빛날", reading: "찬", strokes: 17, element: "화" },
    { char: "讚", meaning: "칭찬할", reading: "찬", strokes: 19, element: "금" },
    { char: "粲", meaning: "빛날", reading: "찬", strokes: 13, element: "화" }
  ],
  
  "림": [
    { char: "林", meaning: "수풀", reading: "림", strokes: 8, element: "목" },
    { char: "臨", meaning: "임할", reading: "림", strokes: 17, element: "화" }
  ],
  
  "슬": [
    { char: "瑟", meaning: "거문고", reading: "슬", strokes: 13, element: "금" },
    { char: "瑬", meaning: "옥", reading: "슬", strokes: 14, element: "금" }
  ],
  
  "나": [
    { char: "那", meaning: "어찌", reading: "나", strokes: 7, element: "화" },
    { char: "娜", meaning: "아름다울", reading: "나", strokes: 9, element: "화" },
    { char: "羅", meaning: "벌일", reading: "나", strokes: 19, element: "화" }
  ],
  
  "율": [
    { char: "律", meaning: "법", reading: "율", strokes: 9, element: "화" },
    { char: "栗", meaning: "밤", reading: "율", strokes: 10, element: "목" }
  ],
  
  "빈": [
    { char: "彬", meaning: "빛날", reading: "빈", strokes: 11, element: "목" },
    { char: "濱", meaning: "물가", reading: "빈", strokes: 17, element: "수" },
    { char: "賓", meaning: "손님", reading: "빈", strokes: 14, element: "수" }
  ],
  
  "솔": [
    { char: "率", meaning: "거느릴", reading: "솔", strokes: 11, element: "금" }
  ],
  
  "별": [
    { char: "星", meaning: "별", reading: "별", strokes: 9, element: "화" },
    { char: "別", meaning: "다를", reading: "별", strokes: 7, element: "수" }
  ],
  
  "결": [
    { char: "結", meaning: "맺을", reading: "결", strokes: 12, element: "목" },
    { char: "潔", meaning: "깨끗할", reading: "결", strokes: 15, element: "수" }
  ],
  
  "담": [
    { char: "潭", meaning: "못", reading: "담", strokes: 15, element: "수" },
    { char: "淡", meaning: "담담할", reading: "담", strokes: 11, element: "수" },
    { char: "膽", meaning: "쓸개", reading: "담", strokes: 17, element: "수" }
  ],
  
  "샘": [
    { char: "泉", meaning: "샘", reading: "샘", strokes: 9, element: "수" }
  ],
  
  "들": [
    { char: "野", meaning: "들", reading: "들", strokes: 11, element: "목" }
  ],
  
  "봄": [
    { char: "春", meaning: "봄", reading: "봄", strokes: 9, element: "목" }
  ],
  
  "여름": [
    { char: "夏", meaning: "여름", reading: "여름", strokes: 10, element: "화" }
  ],
  
  "가을": [
    { char: "秋", meaning: "가을", reading: "가을", strokes: 9, element: "금" }
  ],
  
  "겨울": [
    { char: "冬", meaning: "겨울", reading: "겨울", strokes: 5, element: "수" }
  ]
};

// 훈음으로 한자 검색
export function getHanjaByReading(reading: string): HanjaChar[] {
  return hanjaDatabase[reading] || [];
}

// 모든 한자 데이터 가져오기
export function getAllHanja(): HanjaChar[] {
  return Object.values(hanjaDatabase).flat();
}

// 성씨 한자 가져오기
export function getSurnameHanja(): Record<string, HanjaChar[]> {
  const surnames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "신", "유", "안", "송", "전", "홍", "고", "문", "양", "손", "배"];
  const result: Record<string, HanjaChar[]> = {};
  
  surnames.forEach(surname => {
    if (hanjaDatabase[surname]) {
      result[surname] = hanjaDatabase[surname];
    }
  });
  
  return result;
}

// 이름용 한자 가져오기
export function getNameHanja(): Record<string, HanjaChar[]> {
  const surnames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "신", "유", "안", "송", "전", "홍", "고", "문", "양", "손", "배"];
  const result: Record<string, HanjaChar[]> = {};
  
  Object.keys(hanjaDatabase).forEach(reading => {
    if (!surnames.includes(reading)) {
      result[reading] = hanjaDatabase[reading];
    }
  });
  
  return result;
}