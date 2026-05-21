"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react"

const N8N_WEBHOOK_URL = "https://n8n-n8n.wtrtwm.easypanel.host/webhook/auditoria-ponto"

export default function PlanilhaProcessor() {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [erro, setErro] = useState("")
  const [resultadoFinalUrl, setResultadoFinalUrl] = useState<string | null>(null)
  const [resultadoFinalFilename, setResultadoFinalFilename] = useState("")
  const [revisaoHumanaUrl, setRevisaoHumanaUrl] = useState<string | null>(null)
  const [revisaoHumanaFilename, setRevisaoHumanaFilename] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const isValidExcel = (file: File) => {
    const validExtensions = [".xlsx", ".xls"]
    const validMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ]
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
    const hasValidMime = validMimeTypes.includes(file.type) || file.type === ""
    return hasValidExtension || hasValidMime
  }

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidExcel(file)) {
      setArquivo(file)
      setErro("")
    } else {
      setErro("Selecione um arquivo Excel valido (.xlsx ou .xls)")
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && isValidExcel(file)) {
      setArquivo(file)
      setErro("")
    } else {
      setErro("Selecione um arquivo Excel valido (.xlsx ou .xls)")
    }
  }

  const handleProcessar = async () => {
    if (!arquivo) {
      setErro("Selecione uma planilha.")
      return
    }

    setStatus("loading")
    setErro("")

    try {
      const formData = new FormData()
      formData.append("file", arquivo)

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`)

      const resJson = await response.json()

      if (!resJson.sucesso) {
        throw new Error("O processamento retornou um status de falha do n8n.")
      }

      // Processar Resultado Final
      if (resJson.resultado_final?.data) {
        const bytes = Uint8Array.from(atob(resJson.resultado_final.data), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        setResultadoFinalUrl(url)
        setResultadoFinalFilename(resJson.resultado_final.filename || "Resultado_final.xlsx")
      }

      // Processar Revisao Humana
      if (resJson.revisao_humana?.data) {
        const bytes = Uint8Array.from(atob(resJson.revisao_humana.data), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        setRevisaoHumanaUrl(url)
        setRevisaoHumanaFilename(resJson.revisao_humana.filename || "Revisao_humana.xlsx")
      }
      
      setStatus("success")
    } catch (err: any) {
      setErro(err.message || "Falha ao processar. Verifique o n8n e tente novamente.")
      setStatus("error")
    }
  }

  const downloadFile = (url: string | null, filename: string) => {
    if (url) {
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
    }
  }

  const resetar = () => {
    if (resultadoFinalUrl) {
      URL.revokeObjectURL(resultadoFinalUrl)
    }
    if (revisaoHumanaUrl) {
      URL.revokeObjectURL(revisaoHumanaUrl)
    }
    setArquivo(null)
    setStatus("idle")
    setErro("")
    setResultadoFinalUrl(null)
    setResultadoFinalFilename("")
    setRevisaoHumanaUrl(null)
    setRevisaoHumanaFilename("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <header className="mb-8">
          <div className="mb-4">
            <img 
              src="/kontik-logo.png" 
              alt="Logo Kontik" 
              className="h-30 w-auto object-contain" 
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Auditoria de Ponto — Trilha da Excelência
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload da folha de ponto mensal para apuração automática de assiduidade
          </p>
        </header>

        <Card className="shadow-sm">
          {status === "success" ? (
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#C2D82F]/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="size-6 text-[#404653]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Auditoria concluída</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Seus arquivos estão prontos para download.
                </p>
                <div className="flex flex-col gap-3">
                  {resultadoFinalUrl && (
                    <Button 
                      onClick={() => downloadFile(resultadoFinalUrl, resultadoFinalFilename)} 
                      className="gap-2 bg-[#C2D82F] hover:bg-[#b0c42a] text-[#404653] font-semibold w-full"
                    >
                      <Download className="size-4" />
                      Baixar resultado final
                    </Button>
                  )}
                  {revisaoHumanaUrl && (
                    <Button 
                      onClick={() => downloadFile(revisaoHumanaUrl, revisaoHumanaFilename)} 
                      variant="outline"
                      className="gap-2 border-[#404653]/30 hover:bg-[#404653]/10 text-[#404653] font-semibold w-full"
                    >
                      <Download className="size-4" />
                      Baixar revisão humana
                    </Button>
                  )}
                  <Button variant="ghost" onClick={resetar} className="gap-2 mt-2 hover:bg-muted text-muted-foreground hover:text-foreground">
                    <RotateCcw className="size-4" />
                    Auditar outra folha
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : status === "loading" ? (
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#C2D82F]/20 flex items-center justify-center mb-4">
                  <Loader2 className="size-6 text-[#404653] animate-spin" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analisando colaboradores...</h3>
                <p className="text-sm text-muted-foreground">
                  Por favor, aguarde enquanto realizamos a auditoria.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Isso pode levar até 1 minuto. Por favor aguarde!
                </p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">Configuração da Auditoria</CardTitle>
                <CardDescription>
                  Faça o upload do arquivo de folha de ponto para iniciar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Drop Zone */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Folha de Ponto (.xlsx)
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                      transition-colors duration-200
                      ${arquivo
                        ? "border-[#C2D82F]/50 bg-[#C2D82F]/5"
                        : "border-border hover:border-[#C2D82F]/30 hover:bg-muted/50"
                      }
                    `}
                  >
                    {arquivo ? (
                      <div className="space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-lg bg-[#C2D82F]/20 flex items-center justify-center">
                          <FileSpreadsheet className="size-5 text-[#404653]" />
                        </div>
                        <p className="font-medium text-foreground text-sm">{arquivo.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(arquivo.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Upload className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-foreground">
                          Arraste ou clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground">Arquivos Excel (.xlsx, .xls)</p>
                      </div>
                    )}
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleArquivo}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Erro */}
                {erro && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="size-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{erro}</p>
                  </div>
                )}

                {/* Resumo */}
                {arquivo && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">Arquivo selecionado</span>
                      <p className="font-medium text-foreground truncate mt-1">{arquivo.name}</p>
                    </div>
                  </div>
                )}

                {/* Botao Processar */}
                <Button
                  onClick={handleProcessar}
                  disabled={status === "loading" || !arquivo}
                  className="w-full gap-2 bg-[#C2D82F] hover:bg-[#b0c42a] text-[#404653] font-semibold"
                  size="lg"
                >
                  <Download className="size-4" />
                  Processar folha de ponto
                </Button>
              </CardContent>
            </>
          )}
        </Card>


      </div>
    </main>
  )
}
