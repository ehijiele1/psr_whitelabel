"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, Upload, RotateCcw, Check, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@radix-ui/react-dialog"

interface PhotoCaptureProps {
  value: string
  onChange: (dataUrl: string) => void
}

export default function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const facingRef = useRef<"user" | "environment">("user")

  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingRef.current, width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
        if (!cancelled) setCameraReady(true)
      } catch {
        if (!cancelled) setCameraReady(false)
      }
    })()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [cameraOpen])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    onChange(dataUrl)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraOpen(false)
  }, [onChange])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        if (result) onChange(result)
      }
      reader.readAsDataURL(file)

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [onChange]
  )

  const clearPhoto = useCallback(() => onChange(""), [onChange])

  const flipCamera = useCallback(() => {
    facingRef.current = facingRef.current === "user" ? "environment" : "user"
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraOpen(false)
    setTimeout(() => setCameraOpen(true), 50)
  }, [])

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Passport Photo
      </label>

      <div className="flex items-center gap-4">
        <motion.div
          layout
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-input bg-muted flex-shrink-0"
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Passport photo"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-0 right-0 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <User className="h-10 w-10" />
            </div>
          )}
        </motion.div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </Button>

          <Dialog.Root open={cameraOpen} onOpenChange={setCameraOpen}>
            <Dialog.Trigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-background rounded-xl p-4 w-full max-w-md shadow-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Dialog.Title className="text-lg font-semibold">
                      Take Passport Photo
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] mb-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                        Starting camera...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={flipCamera}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Flip Camera
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={capturePhoto}
                      disabled={!cameraReady}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {value && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
        >
          <Check className="h-3 w-3" />
          Photo uploaded successfully
        </motion.p>
      )}
    </div>
  )
}
