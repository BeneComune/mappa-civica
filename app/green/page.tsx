// app\green\page.tsx
import { ModulePlaceholder } from "@/components/module-placeholder"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function GreenPage() {
  return <ModulePlaceholder title={STRINGS.greenTitle} icon={ICONS.green} />
}
