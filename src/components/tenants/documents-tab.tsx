"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { FileText, Upload, Download, Loader2, File, Eye, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"

interface DocumentTabProps {
  tenantId: string
  userId: string
}

interface LeaseAgreement {
  id: string
  agreement_url: string
  signed_by_tenant: boolean
  signed_by_landlord: boolean
  signed_at: string | null
  valid_from: string
  valid_until: string
  created_at: string
}

interface IdVerification {
  id: string
  document_type: string
  document_url: string
  verified: boolean
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

export default function DocumentsTab({ tenantId, userId }: DocumentTabProps) {
  const supabase = createClient()
  const [agreements, setAgreements] = useState<LeaseAgreement[]>([])
  const [idDocs, setIdDocs] = useState<IdVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    const [agreementsRes, idDocsRes] = await Promise.all([
      supabase.from("lease_agreements").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("id_verifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ])
    if (agreementsRes.data) setAgreements(agreementsRes.data)
    if (idDocsRes.data) setIdDocs(idDocsRes.data)
    setLoading(false)
  }, [tenantId, userId, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocs().then(() => {})
  }, [fetchDocs])

  const uploadFile = async (bucket: string, file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })
    if (error) { console.error("Upload error:", error); return null }
    const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData?.publicUrl || null
  }

  const handleUploadAgreement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading("agreement")
    const path = `${tenantId}/${crypto.randomUUID()}_${file.name}`
    const publicUrl = await uploadFile("agreements", file, path)
    if (publicUrl) {
      const { error } = await supabase.from("lease_agreements").insert({
        tenant_id: tenantId,
        agreement_url: publicUrl,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      })
      if (error) {
        toast.error("Upload failed: " + error.message)
      } else {
        toast.success("Lease agreement uploaded")
        await fetchDocs()
      }
    } else {
      toast.error("Upload failed")
    }
    setUploading(null)
    e.target.value = ""
  }

  const handleUploadIdDoc = async (documentType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(`id_${documentType}`)
    const path = `${userId}/${crypto.randomUUID()}_${file.name}`
    const publicUrl = await uploadFile("documents", file, path)
    if (publicUrl) {
      const { error } = await supabase.from("id_verifications").insert({
        user_id: userId,
        document_type: documentType,
        document_url: publicUrl,
      })
      if (error) {
        toast.error("Upload failed: " + error.message)
      } else {
        toast.success("Document uploaded")
        await fetchDocs()
      }
    } else {
      toast.error("Upload failed")
    }
    setUploading(null)
    e.target.value = ""
  }

  const handleSignAgreement = async (id: string, field: "signed_by_tenant" | "signed_by_landlord") => {
    const { error } = await supabase.from("lease_agreements").update({
      [field]: true,
      signed_at: new Date().toISOString(),
    }).eq("id", id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Agreement signed")
      await fetchDocs()
    }
  }

  const handleVerifyDoc = async (id: string) => {
    const { error } = await supabase.from("id_verifications").update({
      verified: true,
      verified_by: userId,
      verified_at: new Date().toISOString(),
    }).eq("id", id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Document verified")
      await fetchDocs()
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const fileInputId = `agreement-upload-${tenantId}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Lease Agreements</CardTitle>
          <div>
            <input
              type="file"
              id={fileInputId}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg"
              onChange={handleUploadAgreement}
            />
            <label htmlFor={fileInputId}>
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <span>
                  {uploading === "agreement" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1.5" />
                  )}
                  Upload Agreement
                </span>
              </Button>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No lease agreements uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agreements.map((agreement) => (
                <motion.div
                  key={agreement.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <File className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Lease Agreement ({new Date(agreement.valid_from).toLocaleDateString()} - {new Date(agreement.valid_until).toLocaleDateString()})
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={agreement.signed_by_tenant ? "success" : "outline"} className="text-[10px] px-1.5">
                          {agreement.signed_by_tenant ? "Tenant Signed" : "Tenant Pending"}
                        </Badge>
                        <Badge variant={agreement.signed_by_landlord ? "success" : "outline"} className="text-[10px] px-1.5">
                          {agreement.signed_by_landlord ? "Landlord Signed" : "Landlord Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(agreement.agreement_url, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(agreement.agreement_url, `lease-${agreement.valid_from}.pdf`)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {!agreement.signed_by_landlord && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleSignAgreement(agreement.id, "signed_by_landlord")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Sign
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identification Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {idDocs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No identification documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {idDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <File className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{doc.document_type}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.verified ? "success" : "warning"} className="text-[10px]">
                      {doc.verified ? "Verified" : "Pending"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.document_url, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc.document_url, `${doc.document_type}.pdf`)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {!doc.verified && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleVerifyDoc(doc.id)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Verify
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <div>
            <p className="text-sm font-medium mb-3">Upload New Document</p>
            <div className="flex flex-wrap gap-2">
              {["national_id", "passport", "driver_license", "voters_card"].map((docType) => (
                <div key={docType}>
                  <input
                    type="file"
                    id={`id-upload-${docType}`}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleUploadIdDoc(docType, e)}
                  />
                  <label htmlFor={`id-upload-${docType}`}>
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <span>
                        {uploading === `id_${docType}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 mr-1" />
                        )}
                        {docType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </Button>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
