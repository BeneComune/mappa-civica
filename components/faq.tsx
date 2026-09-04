// components\faq.tsx
export function Faq({ children }: { children: React.ReactNode }) {
  return (
    <details className="mt-2 text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none font-medium text-foreground">
        Cos&apos;è e come è calcolato?
      </summary>
      <p className="mt-1">{children}</p>
    </details>
  )
}
