"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react"

interface PendingFile {
  name: string
  data: string
}

interface DocumentUploadProps {
  data: {
    idType: string
    idNumber: string
    uploadedFiles: string[]
    pendingFiles: PendingFile[]
  }
  onChange: (fields: Partial<{
    idType: string
    idNumber: string
    uploadedFiles: string[]
    pendingFiles: PendingFile[]
  }>) => void
}

const idTypes = [
  { value: "national-id", label: "National ID" },
  { value: "passport", label: "International Passport" },
  { value: "drivers-license", label: "Driver's License" },
  { value: "voter-card", label: "Voter's Card" },
]

export default function DocumentUpload({ data, onChange }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      if (result) {
        onChange({
          pendingFiles: [...data.pendingFiles, { name: file.name, data: result }],
        })
      }
      setLoading(false)
    }
    reader.onerror = () => {
      setLoading(false)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removePending = (index: number) => {
    const updated = data.pendingFiles.filter((_, i) => i !== index)
    onChange({ pendingFiles: updated })
  }

  const allFiles = [
    ...data.uploadedFiles.map((url) => ({ name: url.split("/").pop() || url, url, pending: false })),
    ...data.pendingFiles.map((f) => ({ name: f.name, url: "", pending: true })),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Document Upload</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your identification documents for verification. Files will be uploaded when you submit.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Identification Type</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {idTypes.map((idType) => (
              <button
                key={idType.value}
                type="button"
                onClick={() => onChange({ idType: idType.value })}
                className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                  data.idType === idType.value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-input hover:border-primary/50"
                }`}
              >
                {idType.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input
            id="idNumber"
            placeholder="Enter your ID number"
            value={data.idNumber}
            onChange={(e) => onChange({ idNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Upload Document</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={loading}
            className="w-full p-8 rounded-lg border-2 border-dashed border-input hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
            <span className="text-sm font-medium">
              {loading ? "Reading file..." : "Click to upload document"}
            </span>
            <span className="text-xs">PDF, JPG or PNG (max 5MB)</span>
          </button>
        </div>

        {allFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files</Label>
            {allFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                {file.pending ? (
                  <>
                    <span className="text-xs text-amber-500 flex-shrink-0">Pending upload</span>
                    <button
                      type="button"
                      onClick={() => removePending(i - (data.uploadedFiles.length))}
                      className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </>
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
