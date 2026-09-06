// components\site-footer.tsx
import { STRINGS } from "@/lib/strings"

const AUTHORS = [
  { name: "Leonardo Venturoso", href: "https://github.com/leoventuroso" },
  { name: "Emanuele Nardi", href: "https://github.com/emanuelenardi" },
]
const SOURCE_URL = "https://github.com/BeneComune/mappa-civica"

// Slim credits bar at the bottom of every page: who made it, and a link to
// the repo. Server Component - just links, no client state.
export function SiteFooter() {
  return (
    <footer className="shrink-0 border-t bg-background px-4 py-2 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span>
          {STRINGS.appName} · {STRINGS.footerCreditPrefix}{" "}
          {AUTHORS.map((author, index) => (
            <span key={author.href}>
              {index > 0 && ` ${STRINGS.footerCreditConjunction} `}
              <a
                href={author.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-foreground"
              >
                {author.name}
              </a>
            </span>
          ))}
        </span>

        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:text-foreground"
        >
          <GithubMark />
          {STRINGS.footerSource}
        </a>
      </div>
    </footer>
  )
}

// lucide-react dropped its brand icons, so the GitHub mark is inline.
function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}
