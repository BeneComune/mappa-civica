// components\report-drawer\index.tsx
"use client"

import { useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { MapPin } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePanelSheet } from "@/components/mobile-panel-sheet"
import { CATEGORIES, buildReportMailto, type CategoryId, type CommunityReport } from "@/lib/community"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { useIsMobile } from "@/lib/use-is-mobile"
import { CategorySelect } from "./category-select"
import { LocationField } from "./location-field"
import { PhotoField, type ReportPhoto } from "./photo-field"
import { useMapLocationPicker } from "./use-map-location-picker"
import { useNearestParcel } from "./use-nearest-parcel"

// Owns the report draft and turns it into a mailto on submit.
//
// Desktop: a right-side drawer with modal={false}, so the map behind it stays
// clickable for picking the location. Mobile: a two-step flow - tapping "Nuova
// segnalazione" collapses the panel sheet and shows a hint to tap the map;
// once a point is picked the form opens as a bottom sheet.
export function ReportDrawer({ onSubmitted }: { onSubmitted: (report: CommunityReport) => void }) {
  const isMobile = useIsMobile()
  const sheet = usePanelSheet()

  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [photo, setPhoto] = useState<ReportPhoto | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Two-step on mobile: a map tap while picking lands the point, ends picking
  // mode and opens the form. (This runs from a map click handler, not an
  // effect.)
  const handlePick = useCallback(
    (picked: [number, number]) => {
      setLocation(picked)
      if (picking) {
        setPicking(false)
        setOpen(true)
      }
    },
    [picking]
  )
  useMapLocationPicker(isMobile ? picking : open, handlePick)
  const parcel = useNearestParcel(open || picking, location)

  function reset(): void {
    setCategory(CATEGORIES[0].id)
    setTitle("")
    setDescription("")
    setLocation(null)
    setPhoto(null)
    setSubmitted(false)
    setPicking(false)
  }

  function startReport(): void {
    if (isMobile) {
      sheet?.collapse()
      setLocation(null)
      setPicking(true)
    } else {
      setOpen(true)
    }
  }

  function changePoint(): void {
    setOpen(false)
    sheet?.collapse()
    setLocation(null)
    setPicking(true)
  }

  function handleSubmit(): void {
    if (!location || !title.trim()) return

    const report: CommunityReport = {
      id: crypto.randomUUID(),
      category,
      title: title.trim(),
      description: description.trim(),
      lon: location[0],
      lat: location[1],
      createdAt: new Date().toISOString(),
      photoDataUrl: photo?.dataUrl,
      foglio: parcel?.foglio,
      particella: parcel?.particella,
    }

    window.location.href = buildReportMailto(report)
    onSubmitted(report)
    setSubmitted(true)
    setTimeout(() => {
      reset()
      setOpen(false)
    }, 2000)
  }

  const NewReportIcon = ICONS.newReport

  return (
    <>
      <Button size="sm" onClick={startReport}>
        <NewReportIcon className="size-4" />
        {STRINGS.newReport}
      </Button>

      {/* Portaled to <body> so the collapsed panel sheet (display:none) can't
          hide it. */}
      {picking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-[calc(env(safe-area-inset-top)+4.5rem)] right-14 left-3 z-50 flex items-center justify-between gap-2 rounded-lg border bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
            <span className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{STRINGS.reportPickHint}</span>
            </span>
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="shrink-0 font-medium underline underline-offset-2"
            >
              {STRINGS.reportCancel}
            </button>
          </div>,
          document.body
        )}

      <Drawer
        open={open}
        swipeDirection={isMobile ? "down" : "right"}
        modal={isMobile}
        disablePointerDismissal={!isMobile}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{STRINGS.reportFormTitle}</DrawerTitle>
            <DrawerDescription>{STRINGS.reportFormDescription}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <CategorySelect value={category} onChange={setCategory} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-title">{STRINGS.reportTitleLabel}</Label>
              <Input
                id="report-title"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-description">{STRINGS.reportDescriptionLabel}</Label>
              <Textarea
                id="report-description"
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <PhotoField photo={photo} onChange={setPhoto} />

            <LocationField location={location} parcel={parcel} />
            {isMobile && (
              <Button variant="outline" size="sm" className="w-fit" onClick={changePoint}>
                <MapPin className="size-3.5" aria-hidden="true" />
                {STRINGS.reportChangePoint}
              </Button>
            )}
          </div>
          <DrawerFooter>
            {submitted ? (
              <p className="text-sm text-muted-foreground">{STRINGS.reportSubmitted}</p>
            ) : (
              <>
                <Button onClick={handleSubmit} disabled={!location || !title.trim()}>
                  {STRINGS.reportSubmit}
                </Button>
                <DrawerClose render={<Button variant="outline" />}>{STRINGS.reportCancel}</DrawerClose>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
