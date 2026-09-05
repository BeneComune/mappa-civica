// components\report-drawer\index.tsx
"use client"

import { useCallback, useState } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIES, buildReportMailto, type CategoryId, type CommunityReport } from "@/lib/community"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { CategorySelect } from "./category-select"
import { LocationField } from "./location-field"
import { PhotoField, type ReportPhoto } from "./photo-field"
import { useMapLocationPicker } from "./use-map-location-picker"
import { useNearestParcel } from "./use-nearest-parcel"

// Owns the report draft and turns it into a mailto on submit. Picking a
// location and resolving its parcel are delegated to the two hooks; each
// non-trivial field is its own component.
export function ReportDrawer({ onSubmitted }: { onSubmitted: (report: CommunityReport) => void }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [photo, setPhoto] = useState<ReportPhoto | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handlePick = useCallback((picked: [number, number]) => setLocation(picked), [])
  useMapLocationPicker(open, handlePick)
  const parcel = useNearestParcel(open, location)

  function reset(): void {
    setCategory(CATEGORIES[0].id)
    setTitle("")
    setDescription("")
    setLocation(null)
    setPhoto(null)
    setSubmitted(false)
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
    <Drawer
      open={open}
      swipeDirection="right"
      modal={false}
      disablePointerDismissal
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DrawerTrigger render={<Button size="sm" />}>
        <NewReportIcon className="size-4" />
        {STRINGS.newReport}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{STRINGS.reportFormTitle}</DrawerTitle>
          <DrawerDescription>{STRINGS.reportFormDescription}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 p-4">
          <CategorySelect value={category} onChange={setCategory} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-title">{STRINGS.reportTitleLabel}</Label>
            <Input id="report-title" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
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
  )
}
