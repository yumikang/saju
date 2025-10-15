# Shadcn/UI Component Guide for Phase 3.1 Implementation

Complete reference for implementing Shadcn/UI components in Remix with TypeScript.

## Table of Contents
1. [Remix Setup](#remix-setup)
2. [Dialog/Modal Components](#dialogmodal-components)
3. [Form Components](#form-components)
4. [Badge Components](#badge-components)
5. [Skeleton Components](#skeleton-components)
6. [Slider Components](#slider-components)
7. [Date/Time Picker](#datetime-picker)

---

## Remix Setup

### Initial Installation

```bash
# 1. Create Remix project (if needed)
pnpm dlx create-remix@latest my-app

# 2. Initialize shadcn/ui
pnpm dlx shadcn@latest init

# 3. Install Tailwind CSS dependencies
pnpm add -D tailwindcss@latest autoprefixer@latest
```

### Configuration

**postcss.config.js**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**remix.config.js**
```javascript
export default {
  tailwind: true,
  postcss: true,
}
```

**app/root.tsx**
```typescript
import styles from "./tailwind.css?url"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
]
```

### Path Configuration

Shadcn/ui components use `@/components/ui/*` imports. Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

---

## Dialog/Modal Components

### Installation
```bash
pnpm dlx shadcn@latest add dialog
```

### Basic Usage

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CharacterDetailDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Character</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Character Details</DialogTitle>
          <DialogDescription>
            Detailed information about this character
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Character details content */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Controlled Dialog Pattern

```typescript
import { useState } from "react"

export function ControlledDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### TypeScript Types

```typescript
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}
```

### Remix Integration

In Remix, Dialog components work client-side. Ensure parent route component handles state:

```typescript
// app/routes/characters.$id.tsx
export default function CharacterRoute() {
  const character = useLoaderData<typeof loader>()

  return (
    <div>
      <CharacterDetailDialog character={character} />
    </div>
  )
}
```

### Customization

```typescript
// Custom styled dialog
<DialogContent className="sm:max-w-[425px]">
  <DialogHeader>
    <DialogTitle>Edit profile</DialogTitle>
    <DialogDescription>
      Make changes to your profile here. Click save when you're done.
    </DialogDescription>
  </DialogHeader>
  {/* Content */}
  <DialogFooter>
    <Button type="submit">Save changes</Button>
  </DialogFooter>
</DialogContent>
```

---

## Form Components

### Installation

```bash
# Install all form-related components
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add select
```

### Dependencies

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

### Basic Form with Validation

```typescript
"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Validation schema
const birthInfoSchema = z.object({
  year: z.number().min(1900).max(2100),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  gender: z.enum(["male", "female"]),
})

type BirthInfo = z.infer<typeof birthInfoSchema>

export function BirthInfoForm() {
  const form = useForm<BirthInfo>({
    resolver: zodResolver(birthInfoSchema),
    defaultValues: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      gender: "male",
    },
  })

  function onSubmit(values: BirthInfo) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1990"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Select Component

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Within FormField
<FormField
  control={form.control}
  name="gender"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Gender</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Remix Integration

For Remix, use `remix-hook-form` for better integration:

```bash
pnpm add remix-hook-form
```

```typescript
import { useRemixForm, RemixFormProvider } from "remix-hook-form"

export default function BirthInfoRoute() {
  const form = useRemixForm<BirthInfo>({
    resolver: zodResolver(birthInfoSchema),
  })

  return (
    <RemixFormProvider {...form}>
      <form method="post" onSubmit={form.handleSubmit}>
        {/* Form fields */}
      </form>
    </RemixFormProvider>
  )
}
```

### TypeScript Types

```typescript
// Form field props
interface FormFieldProps<T> {
  control: Control<T>
  name: Path<T>
  render: (props: { field: FieldValues }) => React.ReactElement
}

// Input props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: string
  placeholder?: string
  disabled?: boolean
}
```

---

## Badge Components

### Installation

```bash
pnpm dlx shadcn@latest add badge
```

### Basic Usage

```typescript
import { Badge } from "@/components/ui/badge"

export function ElementBadges() {
  return (
    <div className="flex gap-2">
      <Badge variant="default">木 (Wood)</Badge>
      <Badge variant="secondary">火 (Fire)</Badge>
      <Badge variant="destructive">土 (Earth)</Badge>
      <Badge variant="outline">金 (Metal)</Badge>
    </div>
  )
}
```

### Variants

```typescript
type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Custom Element Badges

```typescript
const elementColors = {
  wood: "bg-green-500 text-white hover:bg-green-600",
  fire: "bg-red-500 text-white hover:bg-red-600",
  earth: "bg-yellow-600 text-white hover:bg-yellow-700",
  metal: "bg-gray-400 text-white hover:bg-gray-500",
  water: "bg-blue-500 text-white hover:bg-blue-600",
}

export function ElementBadge({ element }: { element: string }) {
  return (
    <Badge className={elementColors[element as keyof typeof elementColors]}>
      {element}
    </Badge>
  )
}
```

### With Icons

```typescript
import { BadgeCheckIcon } from "lucide-react"

<Badge variant="secondary" className="gap-1">
  <BadgeCheckIcon className="h-3 w-3" />
  Verified
</Badge>
```

### Numeric Badges

```typescript
// For counts or scores
<Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
  {score}
</Badge>
```

### TypeScript Types

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
  asChild?: boolean
}
```

---

## Skeleton Components

### Installation

```bash
pnpm dlx shadcn@latest add skeleton
```

### Basic Usage

```typescript
import { Skeleton } from "@/components/ui/skeleton"

export function CharacterListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  )
}
```

### Card Skeleton Pattern

```typescript
export function CharacterCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-[60px]" />
          <Skeleton className="h-6 w-[60px]" />
        </div>
      </div>
    </div>
  )
}
```

### Table Skeleton Pattern

```typescript
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      ))}
    </div>
  )
}
```

### Remix Integration with Suspense

```typescript
import { Suspense } from "react"
import { Await } from "@remix-run/react"

export default function CharacterRoute() {
  const { characters } = useLoaderData<typeof loader>()

  return (
    <Suspense fallback={<CharacterListSkeleton />}>
      <Await resolve={characters}>
        {(resolvedCharacters) => (
          <CharacterList characters={resolvedCharacters} />
        )}
      </Await>
    </Suspense>
  )
}
```

### TypeScript Types

```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}
```

---

## Slider Components

### Installation

```bash
pnpm dlx shadcn@latest add slider
```

### Basic Usage

```typescript
import { Slider } from "@/components/ui/slider"

export function ScoreSlider() {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      className="w-full"
    />
  )
}
```

### Controlled Slider

```typescript
import { useState } from "react"

export function ControlledScoreSlider() {
  const [value, setValue] = useState([50])

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <label>Score Range</label>
        <span className="text-sm text-muted-foreground">{value[0]}</span>
      </div>
      <Slider
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
      />
    </div>
  )
}
```

### Range Slider (Dual Values)

For dual range filtering, the base slider supports multiple values:

```typescript
export function RangeSlider() {
  const [range, setRange] = useState([20, 80])

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <label>Score Range</label>
        <span className="text-sm text-muted-foreground">
          {range[0]} - {range[1]}
        </span>
      </div>
      <Slider
        value={range}
        onValueChange={setRange}
        max={100}
        step={1}
        minStepsBetweenThumbs={1}
      />
    </div>
  )
}
```

### With Form Integration

```typescript
<FormField
  control={form.control}
  name="scoreRange"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Score Range: {field.value[0]} - {field.value[1]}</FormLabel>
      <FormControl>
        <Slider
          value={field.value}
          onValueChange={field.onChange}
          max={100}
          step={1}
          className="w-full"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### TypeScript Types

```typescript
interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number[]
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  minStepsBetweenThumbs?: number
  disabled?: boolean
}
```

---

## Date/Time Picker

### Installation

```bash
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add button
```

### Dependencies

```bash
pnpm add date-fns react-day-picker
```

### Basic Date Picker

```typescript
"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Date Picker with Year/Month Dropdown

```typescript
export function DatePickerWithDropdown() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {date ? format(date, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={2100}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Date and Time Picker Combined

```typescript
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DateTimePicker() {
  const [date, setDate] = React.useState<Date>()
  const [time, setTime] = React.useState("12:00")

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {date ? format(date, "PP") : "Select date"}
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              captionLayout="dropdown-buttons"
              fromYear={1900}
              toYear={2100}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker">Time</Label>
        <Input
          type="time"
          id="time-picker"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-32"
        />
      </div>
    </div>
  )
}
```

### Form Integration

```typescript
<FormField
  control={form.control}
  name="birthDate"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date of birth</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] pl-3 text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value ? (
                format(field.value, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

### TypeScript Types

```typescript
import { DateRange } from "react-day-picker"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  fromYear?: number
  toYear?: number
}

interface CalendarProps {
  mode: "single" | "multiple" | "range"
  selected?: Date | Date[] | DateRange
  onSelect?: (date: any) => void
  captionLayout?: "label" | "dropdown" | "dropdown-buttons"
  fromYear?: number
  toYear?: number
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
}
```

### Remix Integration Note

In Remix, ensure these components are client-side by using proper boundaries:

```typescript
// app/routes/birth-info.tsx
import { ClientOnly } from "remix-utils/client-only"
import { DateTimePicker } from "~/components/ui/date-time-picker.client"

export default function BirthInfoRoute() {
  return (
    <ClientOnly fallback={<Skeleton className="h-10 w-full" />}>
      {() => <DateTimePicker />}
    </ClientOnly>
  )
}
```

---

## Best Practices

### 1. Component Organization

```
app/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── features/        # Feature-specific components
│       ├── character-detail-dialog.tsx
│       ├── birth-info-form.tsx
│       └── ...
```

### 2. TypeScript Conventions

- Always define prop interfaces
- Use `z.infer<typeof schema>` for form types
- Extend HTML element types for custom components

### 3. Remix-Specific

- Use `ClientOnly` for components with browser-only features
- Leverage Suspense boundaries with Skeleton components
- Combine `react-hook-form` with Remix's form handling via `remix-hook-form`

### 4. Accessibility

- Always use Label components with inputs
- Provide descriptive DialogTitle and DialogDescription
- Use proper ARIA attributes (handled by shadcn/ui)

### 5. Performance

- Use Skeleton components for loading states
- Lazy load Dialog content
- Memoize expensive computations in controlled components

---

## Quick Reference

### Installation Commands

```bash
# Core components for Phase 3.1
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add slider
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add button

# Additional dependencies
pnpm add react-hook-form zod @hookform/resolvers/zod
pnpm add date-fns react-day-picker
pnpm add remix-hook-form  # For Remix integration
pnpm add remix-utils      # For ClientOnly component
```

### Common Patterns

```typescript
// 1. Controlled form field
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// 2. Dialog with state
const [open, setOpen] = useState(false)
<Dialog open={open} onOpenChange={setOpen}>
  {/* content */}
</Dialog>

// 3. Suspense with Skeleton
<Suspense fallback={<Skeleton />}>
  <Await resolve={data}>
    {(resolved) => <Component data={resolved} />}
  </Await>
</Suspense>
```

---

## Additional Resources

- Official Documentation: https://ui.shadcn.com/docs
- Remix Documentation: https://remix.run/docs
- React Hook Form: https://react-hook-form.com/
- Zod Validation: https://zod.dev/
- Date-fns: https://date-fns.org/
