// components\report-drawer\category-select.tsx
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES, type CategoryId } from "@/lib/community"
import { STRINGS } from "@/lib/strings"

// The report category picker. Both the trigger and the options render the
// category's own icon in its own colour.
export function CategorySelect({
  value,
  onChange,
}: {
  value: CategoryId
  onChange: (value: CategoryId) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-category">{STRINGS.reportCategoryLabel}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as CategoryId)}>
        <SelectTrigger id="report-category" className="w-full">
          <SelectValue>
            {(selectedId: CategoryId) => {
              const selected = CATEGORIES.find((c) => c.id === selectedId)
              if (!selected) return null
              const Icon = selected.icon
              return (
                <>
                  <Icon className="size-4" style={{ color: selected.color }} />
                  {selected.label}
                </>
              )
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            return (
              <SelectItem key={c.id} value={c.id}>
                <Icon className="size-4" style={{ color: c.color }} />
                {c.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
