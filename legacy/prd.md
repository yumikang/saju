# 사주 계산 로직 & 한자 DB 상세 구현 가이드

## 🔮 사주 계산 로직 구현

### 1. 천간지지 기본 구조

```리액트 리믹스 기반
# constants.py - 기본 상수 정의

# 천간 (10개)
CHEONGAN = ['갑(甲)', '을(乙)', '병(丙)', '정(丁)', '무(戊)', 
            '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)']

# 지지 (12개)
JIJI = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)',
        '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)']

# 천간의 오행
CHEONGAN_ELEMENT = {
    '갑': '목', '을': '목',  # 나무
    '병': '화', '정': '화',  # 불
    '무': '토', '기': '토',  # 흙
    '경': '금', '신': '금',  # 금속
    '임': '수', '계': '수'   # 물
}

# 지지의 오행
JIJI_ELEMENT = {
    '자': '수', '해': '수',           # 물
    '인': '목', '묘': '목',           # 나무
    '사': '화', '오': '화',           # 불
    '신': '금', '유': '금',           # 금속
    '축': '토', '진': '토', '미': '토', '술': '토'  # 흙
}

# 음양 구분
CHEONGAN_YINYANG = {
    '갑': '양', '병': '양', '무': '양', '경': '양', '임': '양',
    '을': '음', '정': '음', '기': '음', '신': '음', '계': '음'
}
```

### 2. 사주 계산 핵심 함수

```리액트 리믹스 기반
# saju_calculator.py

from datetime import datetime
import lunar_calendar  # pip install korean-lunar-calendar

class SajuCalculator:
    def __init__(self):
        self.gan = CHEONGAN
        self.ji = JIJI
        
    def calculate_saju(self, birth_datetime, gender):
        """
        생년월일시로 사주팔자 계산
        
        Args:
            birth_datetime: datetime 객체
            gender: 'M' or 'F'
            
        Returns:
            dict: 사주 정보
        """
        # 양력 → 음력 변환
        lunar_date = self._to_lunar(birth_datetime)
        
        # 년주 계산
        year_gan, year_ji = self._calculate_year_pillar(lunar_date.year)
        
        # 월주 계산
        month_gan, month_ji = self._calculate_month_pillar(
            lunar_date.year, lunar_date.month, year_gan
        )
        
        # 일주 계산 (만세력 필요)
        day_gan, day_ji = self._calculate_day_pillar(birth_datetime)
        
        # 시주 계산
        hour_gan, hour_ji = self._calculate_hour_pillar(
            birth_datetime.hour, day_gan
        )
        
        # 오행 분석
        elements_count = self._analyze_elements(
            [year_gan, month_gan, day_gan, hour_gan],
            [year_ji, month_ji, day_ji, hour_ji]
        )
        
        # 용신 추출 (부족한 오행)
        yongsin = self._find_yongsin(elements_count, day_gan)
        
        return {
            'year': {'gan': year_gan, 'ji': year_ji},
            'month': {'gan': month_gan, 'ji': month_ji},
            'day': {'gan': day_gan, 'ji': day_ji},
            'hour': {'gan': hour_gan, 'ji': hour_ji},
            'elements': elements_count,
            'yongsin': yongsin,
            'day_master': day_gan  # 일간 (자신을 나타냄)
        }
    
    def _calculate_year_pillar(self, year):
        """년주 계산"""
        # 갑자년(1984)을 기준으로 계산
        base_year = 1984
        diff = year - base_year
        
        gan_idx = diff % 10
        ji_idx = diff % 12
        
        return self.gan[gan_idx], self.ji[ji_idx]
    
    def _analyze_elements(self, gans, jis):
        """오행 개수 분석"""
        elements = {'목': 0, '화': 0, '토': 0, '금': 0, '수': 0}
        
        # 천간 오행 계산
        for gan in gans:
            element = CHEONGAN_ELEMENT[gan[0]]  # 첫 글자만
            elements[element] += 1
            
        # 지지 오행 계산
        for ji in jis:
            element = JIJI_ELEMENT[ji[0]]  # 첫 글자만
            elements[element] += 1
            
        # 백분율로 변환
        total = sum(elements.values())
        for key in elements:
            elements[key] = round((elements[key] / total) * 100)
            
        return elements
    
    def _find_yongsin(self, elements, day_master):
        """용신(부족한 오행) 찾기"""
        # 일간의 오행
        day_element = CHEONGAN_ELEMENT[day_master[0]]
        
        # 가장 부족한 오행 2개 추출
        sorted_elements = sorted(elements.items(), key=lambda x: x[1])
        yongsin = [elem[0] for elem in sorted_elements[:2]]
        
        # 상생 관계 고려
        # 목→화→토→금→수→목 (상생)
        sangseang = {
            '목': '화', '화': '토', '토': '금', 
            '금': '수', '수': '목'
        }
        
        return {
            'primary': yongsin[0],      # 가장 부족한 오행
            'secondary': yongsin[1],    # 두번째 부족한 오행
            'helpful': sangseang.get(day_element)  # 일간을 도와주는 오행
        }
```

### 3. 실제 사용 예시

```
# 사용 예시
calculator = SajuCalculator()

# 1990년 5월 15일 오후 3시생 남자
birth = datetime(1990, 5, 15, 15, 0)
result = calculator.calculate_saju(birth, 'M')

print(f"일간: {result['day']['gan']}")
print(f"오행 분포: {result['elements']}")
print(f"보완 필요 오행: {result['yongsin']['primary']}, {result['yongsin']['secondary']}")

# 출력 예시:
# 일간: 갑(甲)
# 오행 분포: {'목': 25, '화': 25, '토': 12, '금': 13, '수': 25}
# 보완 필요 오행: 토, 금
```

## 📚 한자 DB 구조 설계

### 1. 데이터베이스 스키마

```리액트 리믹스 기반
-- 1. 한자 마스터 테이블
CREATE TABLE chinese_characters (
    id SERIAL PRIMARY KEY,
    
    -- 기본 정보
    character CHAR(1) UNIQUE NOT NULL,      -- 한자
    unicode VARCHAR(10) NOT NULL,           -- 유니코드
    stroke_count INT NOT NULL,              -- 획수
    radical VARCHAR(10),                    -- 부수
    
    -- 발음 정보
    korean_sound VARCHAR(20) NOT NULL,      -- 한국 음
    korean_meaning VARCHAR(100) NOT NULL,   -- 한국 뜻
    
    -- 오행 정보
    primary_element VARCHAR(10) NOT NULL,   -- 주 오행 (목/화/토/금/수)
    element_strength INT DEFAULT 50,        -- 오행 강도 (1-100)
    element_reason TEXT,                    -- 오행 분류 이유
    
    -- 작명 정보
    name_suitability INT DEFAULT 50,        -- 작명 적합도 (1-100)
    gender_preference VARCHAR(10) DEFAULT '중성', -- 성별 선호도
    position_preference VARCHAR(20),        -- 선호 위치 (첫자/중간/끝)
    
    -- 의미 분류
    meaning_category VARCHAR(50),           -- 의미 카테고리
    positive_meaning TEXT,                  -- 긍정적 의미
    usage_caution TEXT,                     -- 사용 주의사항
    
    -- 수리학 정보
    numerology_luck VARCHAR(20),            -- 획수 길흉
    numerology_desc TEXT,                   -- 수리학적 설명
    
    -- 통계 정보
    usage_frequency INT DEFAULT 0,          -- 사용 빈도
    popularity_score INT DEFAULT 50,        -- 인기도 점수
    
    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 인덱스 생성
CREATE INDEX idx_element ON chinese_characters(primary_element);
CREATE INDEX idx_stroke ON chinese_characters(stroke_count);
CREATE INDEX idx_name_suit ON chinese_characters(name_suitability);
CREATE INDEX idx_korean_sound ON chinese_characters(korean_sound);
```

### 2. 한자 조합 테이블

```
-- 2. 이름 조합 평가 테이블
CREATE TABLE name_combinations (
    id SERIAL PRIMARY KEY,
    
    -- 조합 정보
    surname CHAR(1) NOT NULL,               -- 성
    char1 CHAR(1) NOT NULL,                 -- 첫 번째 글자
    char2 CHAR(1),                          -- 두 번째 글자 (NULL 가능)
    
    -- 평가 점수
    total_score INT NOT NULL,               -- 종합 점수
    element_harmony INT,                    -- 오행 조화도
    sound_harmony INT,                      -- 음향 조화도
    meaning_harmony INT,                    -- 의미 조화도
    numerology_score INT,                   -- 수리학 점수
    
    -- 분석 정보
    analysis_detail JSONB,                  -- 상세 분석 (JSON)
    
    -- 사용 통계
    selection_count INT DEFAULT 0,          -- 선택 횟수
    satisfaction_avg DECIMAL(3,2),          -- 평균 만족도
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(surname, char1, char2)
);
```

### 3. 오행 분류 규칙 테이블

```sql
-- 3. 오행 분류 규칙
CREATE TABLE element_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL,         -- 규칙 유형
    rule_value VARCHAR(100) NOT NULL,       -- 규칙 값
    element VARCHAR(10) NOT NULL,           -- 해당 오행
    priority INT DEFAULT 50,                -- 우선순위
    description TEXT                        -- 설명
);

-- 예시 데이터
INSERT INTO element_rules (rule_type, rule_value, element, description) VALUES
-- 부수로 분류
('radical', '木', '목', '나무 부수를 가진 한자'),
('radical', '火', '화', '불 부수를 가진 한자'),
('radical', '水', '수', '물 부수를 가진 한자'),
('radical', '金', '금', '금속 부수를 가진 한자'),
('radical', '土', '토', '흙 부수를 가진 한자'),

-- 의미로 분류
('meaning', '산|언덕|땅', '토', '지형 관련 한자'),
('meaning', '나무|숲|꽃', '목', '식물 관련 한자'),
('meaning', '강|바다|비', '수', '물 관련 한자'),
('meaning', '빛|태양|열', '화', '빛과 열 관련 한자'),
('meaning', '철|동|금', '금', '금속 관련 한자'),

-- 음으로 분류 (음오행)
('sound', 'ㄱㅋ', '목', '아음(牙音)'),
('sound', 'ㄴㄷㄹㅌ', '화', '설음(舌音)'),
('sound', 'ㅇㅎ', '토', '후음(喉音)'),
('sound', 'ㅅㅈㅊ', '금', '치음(齒音)'),
('sound', 'ㅁㅂㅍ', '수', '순음(脣音)');
```

### 4. 한자 데이터 입력 예시

```sql
-- 실제 한자 데이터 입력 예시
INSERT INTO chinese_characters (
    character, unicode, stroke_count, radical,
    korean_sound, korean_meaning,
    primary_element, element_strength, element_reason,
    name_suitability, gender_preference,
    meaning_category, positive_meaning,
    numerology_luck
) VALUES 
-- 수(水) 오행 한자들
('潤', 'U+6F64', 15, '水', '윤', '윤택하다',
 '수', 90, '물 부수 + 윤택한 의미',
 85, '중성',
 '재물/풍요', '재물이 풍성하고 윤택함',
 '길'),

('澈', 'U+6F88', 15, '水', '철', '맑다',
 '수', 85, '물 부수 + 맑은 의미',
 80, '중성',
 '순수/청렴', '맑고 깨끗한 품성',
 '길'),

-- 목(木) 오행 한자들  
('榮', 'U+69AE', 14, '木', '영', '영화롭다',
 '목', 85, '나무 부수 + 번영 의미',
 90, '중성',
 '성공/명예', '번영하고 영화로움',
 '대길'),

('桓', 'U+6853', 10, '木', '환', '큰 나무',
 '목', 80, '나무 부수 + 큰 의미',
 75, '남성',
 '성장/발전', '크게 성장하는 기운',
 '길'),

-- 화(火) 오행 한자들
('煥', 'U+7165', 13, '火', '환', '빛나다',
 '화', 85, '불 부수 + 빛나는 의미',
 80, '남성',
 '명예/광명', '밝게 빛나는 명예',
 '길'),

-- 토(土) 오행 한자들
('垣', 'U+57A3', 9, '土', '원', '담/울타리',
 '토', 75, '흙 부수 + 보호 의미',
 70, '중성',
 '안정/보호', '든든한 울타리 같은 존재',
 '중길'),

-- 금(金) 오행 한자들
('鉉', 'U+9249', 13, '金', '현', '솥 들개',
 '금', 80, '금속 부수 + 도구 의미',
 75, '남성',
 '도구/능력', '중요한 역할을 하는 인재',
 '길');
```

### 5. 한자 검색 및 추천 쿼리

```sql
-- 용신에 맞는 한자 추천 쿼리
CREATE OR REPLACE FUNCTION recommend_characters(
    p_element VARCHAR,      -- 필요한 오행
    p_gender VARCHAR,       -- 성별
    p_position INT,         -- 위치 (1: 첫자, 2: 둘째)
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    character CHAR(1),
    korean_sound VARCHAR,
    korean_meaning VARCHAR,
    score INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.character,
        c.korean_sound,
        c.korean_meaning,
        (
            c.name_suitability * 0.4 +          -- 작명 적합도 40%
            c.element_strength * 0.3 +          -- 오행 강도 30%
            c.popularity_score * 0.2 +          -- 인기도 20%
            CASE 
                WHEN c.gender_preference = p_gender THEN 10
                WHEN c.gender_preference = '중성' THEN 5
                ELSE 0
            END                                 -- 성별 적합도 10%
        )::INT as score
    FROM chinese_characters c
    WHERE 
        c.primary_element = p_element
        AND c.is_active = TRUE
        AND c.name_suitability >= 70
        AND (
            p_position = 1 AND c.position_preference IN ('첫자', '모두')
            OR p_position = 2 AND c.position_preference IN ('둘째', '모두')
            OR c.position_preference IS NULL
        )
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시
SELECT * FROM recommend_characters('수', '남성', 1, 10);
```

### 6. 조합 평가 함수

```python
# name_evaluator.py

class NameEvaluator:
    def evaluate_combination(self, surname, name_chars, saju_info):
        """
        이름 조합 평가
        
        Args:
            surname: 성씨
            name_chars: 이름 글자 리스트
            saju_info: 사주 정보
            
        Returns:
            dict: 평가 결과
        """
        scores = {
            'element_harmony': self._calc_element_harmony(
                surname, name_chars, saju_info['yongsin']
            ),
            'sound_harmony': self._calc_sound_harmony(
                surname, name_chars
            ),
            'numerology': self._calc_numerology(
                surname, name_chars
            ),
            'meaning_harmony': self._calc_meaning_harmony(
                name_chars
            )
        }
        
        # 종합 점수 계산 (가중치 적용)
        total_score = (
            scores['element_harmony'] * 0.4 +    # 오행 40%
            scores['sound_harmony'] * 0.2 +      # 음향 20%
            scores['numerology'] * 0.2 +         # 수리 20%
            scores['meaning_harmony'] * 0.2      # 의미 20%
        )
        
        return {
            'total_score': round(total_score),
            'scores': scores,
            'analysis': self._generate_analysis(surname, name_chars, scores)
        }
    
    def _calc_element_harmony(self, surname, name_chars, yongsin):
        """오행 조화도 계산"""
        # 성씨의 오행 + 이름 글자들의 오행이
        # 용신(부족한 오행)을 얼마나 보완하는지 평가
        
        score = 100
        
        # 용신 보완 여부 체크
        for char in name_chars:
            char_element = self._get_char_element(char)
            if char_element == yongsin['primary']:
                score += 20  # 주 용신 보완
            elif char_element == yongsin['secondary']:
                score += 10  # 부 용신 보완
                
        # 상생 관계 체크
        if self._is_sangseang(surname, name_chars[0]):
            score += 10
            
        return min(score, 100)  # 최대 100점
    
    def _calc_numerology(self, surname, name_chars):
        """수리학 점수 계산"""
        # 총획수, 원격(인격), 지격 등 계산
        
        total_strokes = (
            self._get_strokes(surname) +
            sum(self._get_strokes(char) for char in name_chars)
        )
        
        # 81수리 길흉 판단
        luck_numbers = {
            1: 100, 3: 90, 5: 95, 6: 90, 7: 85,
            8: 90, 11: 95, 13: 90, 15: 95, 16: 100,
            17: 90, 18: 85, 21: 95, 23: 100, 24: 95,
            25: 90, 29: 85, 31: 95, 32: 100, 33: 95,
            35: 90, 37: 85, 39: 80, 41: 95, 45: 90,
            47: 95, 48: 90, 52: 85, 57: 80, 61: 85,
            63: 90, 65: 95, 67: 90, 68: 85, 81: 100
        }
        
        # 나머지로 81수리 적용
        number = total_strokes % 81 or 81
        return luck_numbers.get(number, 70)
```

### 7. 실제 구현 시 고려사항

```python
# implementation_notes.py

"""
1. 한자 데이터 수집 방법:
   - 국립국어원 표준국어대사전 API 활용
   - 한자 사전 크롤링 (네이버 한자사전 등)
   - 전문가 검수 필요 (특히 오행 분류)

2. 오행 분류 우선순위:
   1) 부수 (가장 명확)
   2) 의미 (두 번째 우선)
   3) 음 (보조적 참고)

3. 성능 최적화:
   - 자주 사용되는 조합은 캐싱
   - 인덱스 최적화 필수
   - 벌크 연산 활용

4. 정확도 향상:
   - 실제 작명 전문가의 피드백 반영
   - A/B 테스트로 알고리즘 개선
   - 사용자 만족도 추적

5. 확장성:
   - 지역별 선호 한자 반영
   - 시대별 트렌드 반영
   - AI 학습 데이터로 활용
"""
```


# 핵심 구현 포인트
🔮 사주 계산

천간지지 계산: 생년월일시 → 8글자 변환
오행 분석: 목/화/토/금/수 비율 계산
용신 추출: 부족한 오행 2개 찾기

📚 한자 DB

마스터 테이블: 10,000자 한자 정보
오행 분류: 부수 > 의미 > 음 순서
평가 시스템: 작명 적합도 점수화

💡 즉시 시작 가능한 작업
1. Python 환경 설정
bashpip install korean-lunar-calendar
pip install psycopg2-binary
pip install pandas
2. 기초 한자 데이터 수집
python# 네이버 한자사전에서 상용한자 1,000개부터 시작
# 엑셀로 정리 후 DB 입력
3. 테스트 케이스 작성
python# 유명인 사주로 검증



