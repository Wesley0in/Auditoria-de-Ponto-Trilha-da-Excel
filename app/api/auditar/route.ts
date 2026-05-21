import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { sucesso: false, erro: "Arquivo não fornecido ou inválido." },
        { status: 400 }
      )
    }

    const n8nFormData = new FormData()
    n8nFormData.append("file", file)

    const response = await fetch("https://n8n-n8n.wtrtwm.easypanel.host/webhook/auditoria-ponto", {
      method: "POST",
      body: n8nFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { sucesso: false, erro: `Erro no servidor n8n: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Erro no proxy de auditoria:", error)
    return NextResponse.json(
      { sucesso: false, erro: error.message || "Erro interno no servidor." },
      { status: 500 }
    )
  }
}
