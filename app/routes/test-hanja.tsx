import { useState } from "react";
import { HanjaSelector } from "~/components/ui/hanja-selector";
import type { HanjaChar } from "~/lib/hanja-data";

export default function TestHanja() {
  const [selectedHanja, setSelectedHanja] = useState<HanjaChar | undefined>();
  const [testReading, setTestReading] = useState("천");
  const [isComposing, setIsComposing] = useState(false);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">한자 선택기 테스트</h1>
      
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            테스트할 읽기 입력 {isComposing && <span className="text-orange-500">(조합 중)</span>}
          </label>
          <input
            type="text"
            value={testReading}
            onChange={(e) => setTestReading(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="예: 천, 이, 김"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            한자 선택
          </label>
          <HanjaSelector
            reading={testReading}
            selectedHanja={selectedHanja}
            onSelect={setSelectedHanja}
            placeholder="한자를 선택하세요"
          />
        </div>
        
        {selectedHanja && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-bold mb-2">선택된 한자:</h3>
            <div className="space-y-1">
              <p>한자: {selectedHanja.char}</p>
              <p>의미: {selectedHanja.meaning}</p>
              <p>획수: {selectedHanja.strokes}</p>
              <p>오행: {selectedHanja.element}</p>
              <p>읽기: {selectedHanja.koreanReading}</p>
              {selectedHanja.alternativeReadings && selectedHanja.alternativeReadings.length > 0 && (
                <p>대체 읽기: {selectedHanja.alternativeReadings.join(", ")}</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 className="font-bold mb-2">테스트 시나리오:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>천 → 千(천) 한자가 표시되어야 함</li>
          <li>이 → 李(이/리) 한자가 표시되어야 함</li>
          <li>김 → 金(김/금) 한자가 표시되어야 함</li>
          <li>네트워크 탭에서 API 호출 확인 가능해야 함</li>
        </ul>
      </div>
    </div>
  );
}