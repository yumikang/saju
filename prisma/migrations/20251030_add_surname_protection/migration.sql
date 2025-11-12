-- CreateIndex for surname filtering optimization
-- Add isSurname column to protect Korean surnames from first name generation

-- Step 1: Add isSurname column with default false
ALTER TABLE "hanja_dict" ADD COLUMN "is_surname" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create indexes for efficient filtering
CREATE INDEX "hanja_dict_is_surname_idx" ON "hanja_dict"("is_surname");
CREATE INDEX "hanja_dict_element_surname_idx" ON "hanja_dict"("element", "is_surname");

-- Step 3: Mark all 132 Korean surname hanja (Top 100 surnames, 95% population coverage)
UPDATE "hanja_dict"
SET "is_surname" = true
WHERE "character" IN (
  '丁', '丘', '于', '京', '任', '伍', '元', '全', '兪', '公',
  '具', '劉', '千', '卓', '南', '卜', '卞', '印', '原', '史',
  '吉', '吳', '呂', '周', '咸', '嚴', '國', '夏', '天', '奇',
  '姜', '孔', '孟', '孫', '安', '宋', '宣', '宮', '尹', '崔',
  '康', '廉', '延', '張', '强', '徐', '慕', '慶', '成', '房',
  '扈', '文', '方', '施', '明', '星', '晉', '智', '曺', '朱',
  '朴', '李', '杜', '林', '柳', '梁', '楊', '權', '殷', '毛',
  '池', '沈', '河', '洪', '潘', '燕', '片', '牟', '玄', '玉',
  '王', '琴', '田', '申', '白', '皮', '盛', '盧', '睦', '石',
  '禁', '禹', '秋', '秦', '箕', '紀', '羅', '莊', '蔡', '蔣',
  '薛', '蘇', '表', '裴', '裵', '許', '諸', '賈', '趙', '車',
  '辛', '邢', '邵', '郭', '都', '鄭', '金', '閔', '陳', '陶',
  '陸', '韋', '韓', '顧', '馬', '高', '魏', '魚', '魯', '鮮',
  '黃', '龍'
);
