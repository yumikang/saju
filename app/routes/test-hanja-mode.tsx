import { useState } from "react"
import { HanjaSelector, type HanjaSelectorMode } from "~/components/ui/hanja-selector"
import type { HanjaChar } from "~/lib/hanja-data"

export default function TestHanjaMode() {
  const [mode, setMode] = useState<HanjaSelectorMode>('surname')
  const [reading, setReading] = useState('김')
  const [selectedHanja, setSelectedHanja] = useState<HanjaChar | undefined>()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">HanjaSelector Mode 테스트</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mode 선택</label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="surname"
                  checked={mode === 'surname'}
                  onChange={(e) => setMode(e.target.value as HanjaSelectorMode)}
                  className="mr-2"
                />
                <span>성씨 모드 (popularity/20)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="general"
                  checked={mode === 'general'}
                  onChange={(e) => setMode(e.target.value as HanjaSelectorMode)}
                  className="mr-2"
                />
                <span>일반 모드 (strokes/50)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">한글 입력</label>
            <input
              type="text"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="한글 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">한자 선택</label>
            <HanjaSelector
              reading={reading}
              selectedHanja={selectedHanja}
              onSelect={setSelectedHanja}
              mode={mode}
            />
          </div>

          {selectedHanja && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-medium mb-2">선택된 한자:</h3>
              <p>문자: {selectedHanja.char}</p>
              <p>의미: {selectedHanja.meaning}</p>
              <p>획수: {selectedHanja.strokes || '정보 없음'}</p>
              <p>오행: {selectedHanja.element || '정보 없음'}</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-medium mb-2">현재 설정:</h3>
            <p>Mode: {mode}</p>
            <p>Expected params:</p>
            <ul className="list-disc list-inside ml-4">
              {mode === 'surname' ? (
                <>
                  <li>surname=true</li>
                  <li>sort=popularity</li>
                  <li>limit=20</li>
                </>
              ) : (
                <>
                  <li>surname=false</li>
                  <li>sort=strokes</li>
                  <li>limit=50</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}