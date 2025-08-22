import { useState, useEffect, useRef } from "react"
import { useFetcher } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { ChevronDown, Check, Loader2 } from "lucide-react"
import { cn } from "~/lib/utils"
import type { HanjaChar } from "~/lib/hanja-data"
import { useDebounce } from "~/hooks/useDebounce"

// Mode 타입 정의
export type HanjaSelectorMode = 'surname' | 'general'

// Mode별 기본 설정
const MODE_DEFAULTS = {
  surname: {
    isSurname: true,
    sort: 'popularity' as const,
    limit: 20,
    placeholderSuffix: '성씨'
  },
  general: {
    isSurname: false,
    sort: 'strokes' as const,
    limit: 50,
    placeholderSuffix: '한자'
  }
} as const

// 두음법칙 매핑 (주요 케이스만)
const DUEUM_MAP: Record<string, string[]> = {
  '이': ['리'],
  '리': ['이'],
  '유': ['류'],
  '류': ['유'],
  '임': ['림'],
  '림': ['임'],
  '노': ['로'],
  '로': ['노'],
  '라': ['나'],
  '나': ['라']
}

// 두음법칙 힌트 생성
function getDueumHints(reading: string): string[] {
  return DUEUM_MAP[reading] || []
}

interface HanjaSelectorProps {
  reading: string
  selectedHanja?: HanjaChar
  onSelect: (hanja: HanjaChar) => void
  placeholder?: string
  required?: boolean
  debounceDelay?: number  // 디바운스 지연 시간 커스터마이징 가능
  mode?: HanjaSelectorMode  // 모드 설정 (기본값: 'surname')
}

export function HanjaSelector({ 
  reading, 
  selectedHanja, 
  onSelect, 
  placeholder,
  required = false,
  debounceDelay = 300,  // 기본값 300ms
  mode = 'surname'  // 기본값: surname 모드
}: HanjaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)  // 하이라이트된 항목 인덱스
  const [announcement, setAnnouncement] = useState('')  // 스크린리더 알림 메시지
  const fetcher = useFetcher()
  const apiCallCountRef = useRef(0)  // API 호출 횟수 추적 (테스트용)
  const listboxRef = useRef<HTMLDivElement>(null)  // listbox 스크롤 관리용
  const comboboxId = useRef(`hanja-combobox-${Math.random().toString(36).substr(2, 9)}`).current
  const listboxId = useRef(`hanja-listbox-${Math.random().toString(36).substr(2, 9)}`).current
  
  // Mode별 설정 가져오기
  const modeConfig = MODE_DEFAULTS[mode]
  const effectivePlaceholder = placeholder || `${modeConfig.placeholderSuffix}를 선택하세요`
  
  // 디바운스된 reading 값
  const debouncedReading = useDebounce(reading, debounceDelay)
  
  // 한글 완성 여부 체크 (자음/모음만 있는 경우 제외)
  const isValidKorean = (text: string) => {
    const koreanRegex = /^[가-힣]+$/
    return koreanRegex.test(text)
  }
  
  // API 호출 - 디바운스된 값과 조합 상태 체크
  useEffect(() => {
    // 조합 중이거나 빈 값이면 API 호출하지 않음
    if (!debouncedReading || isComposing) {
      return
    }
    
    // 한글 완성 체크 (자음/모음만 있는 경우 API 호출 안함)
    if (!isValidKorean(debouncedReading)) {
      return
    }
    
    // 이미 로딩 중이면 중복 호출 방지
    if (fetcher.state !== 'idle') {
      return
    }
    
    // Mode별 API 파라미터 설정
    const params = new URLSearchParams({
      reading: debouncedReading,
      surname: String(modeConfig.isSurname),
      sort: modeConfig.sort,
      limit: String(modeConfig.limit)
    })
    
    // API 호출 횟수 증가 (테스트용)
    apiCallCountRef.current++
    if (typeof window !== 'undefined' && (window as any).__hanjaApiCallCount !== undefined) {
      (window as any).__hanjaApiCallCount++
    }
    
    fetcher.load(`/api/hanja/search?${params.toString()}`)
  }, [debouncedReading, isComposing, modeConfig]) // mode 변경 시 재실행
  
  // 로딩 상태
  const isLoading = fetcher.state === "loading"
  
  // API 응답 데이터 처리
  const apiResponse = fetcher.data as any
  const hanjaList: HanjaChar[] = apiResponse?.data || apiResponse || []
  
  // 하이라이트된 항목이 화면에 보이도록 스크롤
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const options = listboxRef.current.querySelectorAll('[role="option"]')
      const highlightedOption = options[highlightedIndex] as HTMLElement
      if (highlightedOption) {
        highlightedOption.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])
  
  // 드롭다운이 열릴 때 초기 하이라이트 설정
  useEffect(() => {
    if (isOpen && hanjaList.length > 0) {
      // 선택된 항목이 있으면 그 인덱스로, 없으면 0으로
      const selectedIndex = selectedHanja 
        ? hanjaList.findIndex(h => h.char === selectedHanja.char)
        : -1
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    } else if (!isOpen) {
      setHighlightedIndex(-1)
    }
  }, [isOpen, hanjaList, selectedHanja])
  
  // 스크린리더 알림 - 검색 결과 변경
  useEffect(() => {
    if (!isComposing && isValidKorean(reading) && hanjaList.length > 0) {
      setAnnouncement(`${hanjaList.length}개의 ${modeConfig.placeholderSuffix}를 찾았습니다.`)
    } else if (!isComposing && isValidKorean(reading) && hanjaList.length === 0 && !isLoading) {
      // 두음법칙 힌트 생성
      const dueumHints = getDueumHints(reading)
      if (dueumHints.length > 0) {
        setAnnouncement(`검색 결과가 없습니다. ${dueumHints.join(' 또는 ')}로도 검색해보세요.`)
      } else {
        setAnnouncement('검색 결과가 없습니다.')
      }
    }
  }, [hanjaList, reading, isComposing, isLoading, modeConfig])
  
  // 스크린리더 알림 리셋
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => {
        setAnnouncement('')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [announcement])
  
  // 에러 처리 - 조합 중이 아니고 완성된 한글일 때만 표시
  if (!isComposing && isValidKorean(reading) && 
      (apiResponse?.code === 'INVALID_INPUT' || apiResponse?.code === 'INTERNAL_ERROR')) {
    return (
      <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500 text-sm">
        {apiResponse.message || "오류가 발생했습니다"}
      </div>
    )
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>한자 검색 중...</span>
      </div>
    )
  }

  // 결과 없음 - 조합 중이 아니고 완성된 한글일 때만 표시
  if (!isLoading && !isComposing && isValidKorean(reading) && hanjaList.length === 0) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
        해당 음절의 한자가 없습니다
      </div>
    )
  }
  
  // 조합 중이거나 불완전한 한글일 때는 기본 상태 표시
  if (!isValidKorean(reading) || isComposing) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400 text-sm">
        한글을 입력하세요
      </div>
    )
  }
  
  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // IME 조합 중에는 키보드 이벤트 무시
    if (isComposing) {
      return
    }
    
    // 드롭다운이 열려있을 때만 네비게이션 키 처리
    if (!isOpen) {
      // 닫혀있을 때 Enter나 Space로 열기
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => {
          if (prev < hanjaList.length - 1) {
            return prev + 1
          }
          return 0 // 마지막에서 처음으로 순환
        })
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => {
          if (prev <= 0) {
            return hanjaList.length - 1 // 처음에서 마지막으로 순환
          }
          return prev - 1
        })
        break
        
      case 'Enter':
        e.preventDefault() // 폼 submit 방지
        if (highlightedIndex >= 0 && hanjaList[highlightedIndex]) {
          const selected = hanjaList[highlightedIndex]
          // 선택 알림
          setAnnouncement(`${selected.char}, ${selected.meaning}, ${selected.strokes ? `${selected.strokes}획` : '획수 정보 없음'}, ${selected.element ? `${selected.element}행` : '오행 정보 없음'} 선택됨`)
          onSelect(selected)
          setIsOpen(false)
          setHighlightedIndex(-1)
        }
        break
        
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
        
      case 'Tab':
        // Tab 키로 이동 시 선택하고 닫기
        if (highlightedIndex >= 0 && hanjaList[highlightedIndex]) {
          e.preventDefault()
          onSelect(hanjaList[highlightedIndex])
          setIsOpen(false)
          setHighlightedIndex(-1)
        } else {
          // 선택할 항목이 없으면 그냥 닫기
          setIsOpen(false)
          setHighlightedIndex(-1)
        }
        break
        
      case 'Home':
        e.preventDefault()
        setHighlightedIndex(0)
        break
        
      case 'End':
        e.preventDefault()
        setHighlightedIndex(hanjaList.length - 1)
        break
        
      case 'PageUp':
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(0, prev - 5))
        break
        
      case 'PageDown':
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(hanjaList.length - 1, prev + 5))
        break
    }
  }
  
  return (
    <>
      {/* 스크린리더 전용 라이브 리전 */}
      <div 
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
        <Button
          id={comboboxId}
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          aria-label={`${modeConfig.placeholderSuffix} 선택기`}
          aria-describedby={selectedHanja ? `${comboboxId}-value` : undefined}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedHanja && "text-muted-foreground"
          )}
        >
          {selectedHanja ? (
            <div className="flex items-center gap-2" id={`${comboboxId}-value`}>
              <span className="text-lg font-bold">{selectedHanja.char}</span>
              <span className="text-sm text-gray-600">
                {selectedHanja.meaning} {selectedHanja.strokes ? `(${selectedHanja.strokes}획)` : ''}
              </span>
            </div>
          ) : (
            <span>{effectivePlaceholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              '{reading}' 음절의 {modeConfig.placeholderSuffix} ({hanjaList.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div 
              id={listboxId}
              ref={listboxRef}
              role="listbox"
              aria-label={`${reading} 음절의 ${modeConfig.placeholderSuffix} 목록`}
              className="grid gap-2 max-h-60 overflow-y-auto"
            >
              {hanjaList.map((hanja, index) => (
                <button
                  key={index}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={selectedHanja?.char === hanja.char}
                  aria-label={`${hanja.char}, ${hanja.meaning}, ${hanja.strokes ? `${hanja.strokes}획` : '획수 정보 없음'}, ${hanja.element ? `${hanja.element}행` : '오행 정보 없음'}`}
                  data-highlighted={index === highlightedIndex}
                  onClick={() => {
                    // 선택 알림
                    setAnnouncement(`${hanja.char}, ${hanja.meaning}, ${hanja.strokes ? `${hanja.strokes}획` : '획수 정보 없음'}, ${hanja.element ? `${hanja.element}행` : '오행 정보 없음'} 선택됨`)
                    onSelect(hanja)
                    setIsOpen(false)
                    setHighlightedIndex(-1)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 text-left rounded-md transition-colors",
                    index === highlightedIndex && "bg-gray-100 ring-2 ring-orange-500 ring-inset",
                    selectedHanja?.char === hanja.char && !highlightedIndex && "bg-orange-50 border border-orange-200",
                    index !== highlightedIndex && "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl font-bold text-orange-600">
                      {hanja.char}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{hanja.meaning}</div>
                      <div className="text-xs text-gray-500">
                        {hanja.strokes ? `${hanja.strokes}획` : '획수 준비 중'} • {hanja.element ? `${hanja.element}행` : '오행 준비 중'}
                      </div>
                    </div>
                  </div>
                  {selectedHanja?.char === hanja.char && (
                    <Check className="h-4 w-4 text-orange-600" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
      </Popover>
    </>
  )
}

interface MultiHanjaSelectorProps {
  syllables: string[]
  selectedHanjas: (HanjaChar | null)[]
  onSelectionChange: (index: number, hanja: HanjaChar | null) => void
  label: string
  required?: boolean
}

export function MultiHanjaSelector({
  syllables,
  selectedHanjas,
  onSelectionChange,
  label,
  required = false
}: MultiHanjaSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {syllables.map((syllable, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-8 text-center text-sm font-medium text-gray-600">
              {syllable}
            </div>
            <div className="flex-1">
              <HanjaSelector
                reading={syllable}
                selectedHanja={selectedHanjas[index] || undefined}
                onSelect={(hanja) => onSelectionChange(index, hanja)}
                placeholder={`'${syllable}' 한자 선택`}
                required={required}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* 선택된 한자 미리보기 */}
      {selectedHanjas.some(h => h !== null) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">선택된 한자:</div>
          <div className="flex items-center gap-2">
            {selectedHanjas.map((hanja, index) => (
              <div key={index} className="flex items-center">
                <span className="text-lg font-bold text-orange-600">
                  {hanja?.char || syllables[index]}
                </span>
                {index < selectedHanjas.length - 1 && (
                  <span className="mx-1 text-gray-400">+</span>
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            총 {selectedHanjas.filter(h => h !== null).reduce((sum, h) => sum + (h?.strokes || 0), 0)}획
          </div>
        </div>
      )}
    </div>
  )
}