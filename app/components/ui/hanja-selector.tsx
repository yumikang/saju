import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "~/lib/utils"
import { getHanjaByReading, HanjaChar } from "~/lib/hanja-data"

interface HanjaSelectorProps {
  reading: string
  selectedHanja?: HanjaChar
  onSelect: (hanja: HanjaChar) => void
  placeholder?: string
  required?: boolean
}

export function HanjaSelector({ 
  reading, 
  selectedHanja, 
  onSelect, 
  placeholder = "한자를 선택하세요",
  required = false
}: HanjaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hanjaList = getHanjaByReading(reading)

  if (hanjaList.length === 0) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
        해당 음절의 한자가 없습니다
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedHanja && "text-muted-foreground"
          )}
        >
          {selectedHanja ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{selectedHanja.char}</span>
              <span className="text-sm text-gray-600">
                {selectedHanja.meaning} ({selectedHanja.strokes}획)
              </span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              '{reading}' 음절의 한자 ({hanjaList.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {hanjaList.map((hanja, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(hanja)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 rounded-md transition-colors",
                    selectedHanja?.char === hanja.char && "bg-orange-50 border border-orange-200"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl font-bold text-orange-600">
                      {hanja.char}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{hanja.meaning}</div>
                      <div className="text-xs text-gray-500">
                        {hanja.strokes}획 • {hanja.element}행
                      </div>
                    </div>
                  </div>
                  {selectedHanja?.char === hanja.char && (
                    <Check className="h-4 w-4 text-orange-600" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
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