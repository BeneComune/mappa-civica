"use client"

import { useEffect, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMapContext } from "@/components/map-provider"
import { CATEGORIES, buildReportMailto, resizeImageToDataUrl, type CategoryId, type CommunityReport } from "@/lib/community"
import { loadParcels, nearestParcel, type ParcelPoint } from "@/lib/catasto"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export function ReportDrawer({ onSubmitted }: { onSubmitted: (report: CommunityReport) => void }) {
  const { subscribeMapClick, setPinMarker } = useMapContext()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [photo, setPhoto] = useState<{ fileName: string; dataUrl: string } | null>(null)
  const [parcels, setParcels] = useState<ParcelPoint[]>([])
  const parcel = location ? nearestParcel(parcels, location[0], location[1]) : null

  useEffect(() => {
    if (!open) return
    const unsubscribe = subscribeMapClick((lngLat) => {
      setLocation([lngLat.lng, lngLat.lat])
      setPinMarker([lngLat.lng, lngLat.lat])
    })
    return () => {
      unsubscribe()
      setPinMarker(null)
    }
  }, [open, subscribeMapClick, setPinMarker])

  // Load the parcel points once, the first time the drawer opens.
  useEffect(() => {
    if (open && parcels.length === 0) {
      loadParcels().then(setParcels)
    }
  }, [open, parcels.length])

  function reset(): void {
    setCategory(CATEGORIES[0].id)
    setTitle("")
    setDescription("")
    setLocation(null)
    setPhoto(null)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setPhoto({ fileName: file.name, dataUrl })
    } catch {
      /* silently ignore resize errors */
    }
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
    reset()
    setOpen(false)
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-category">{STRINGS.reportCategoryLabel}</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as CategoryId)}>
              <SelectTrigger id="report-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-title">{STRINGS.reportTitleLabel}</Label>
            <Input id="report-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-description">{STRINGS.reportDescriptionLabel}</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-photo">{STRINGS.reportPhotoLabel}</Label>
            <Input id="report-photo" type="file" accept="image/*" onChange={handlePhotoChange} />
            {photo && (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview, next/image doesn't apply */}
                <img src={photo.dataUrl} alt="" className="h-12 w-12 rounded object-cover" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                  {STRINGS.reportPhotoRemove}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{STRINGS.reportLocationLabel}</Label>
            <p className="text-sm text-muted-foreground">
              {location ? `${location[1].toFixed(5)}, ${location[0].toFixed(5)}` : STRINGS.reportLocationUnset}
            </p>
            {parcel && (
              <p className="text-xs text-muted-foreground">
                {STRINGS.reportParcelLabel}: foglio {parcel.foglio}, particella {parcel.particella}
              </p>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={!location || !title.trim()}>
            {STRINGS.reportSubmit}
          </Button>
          <DrawerClose render={<Button variant="outline" />}>{STRINGS.reportCancel}</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
