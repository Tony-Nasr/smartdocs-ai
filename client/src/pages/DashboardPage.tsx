import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client'

interface Doc {
  id: number
  title: string
  fileType: string
  summary: string | null
  keywords: string | null
  uploadedAt: string
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const [activeDoc, setActiveDoc] = useState<number | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const { data: docs, isLoading } = useQuery<Doc[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get('/documents')).data,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const askQuestion = async () => {
    if (!activeDoc) return
    const { data } = await api.post(`/documents/${activeDoc}/chat`, JSON.stringify(question), {
      headers: { 'Content-Type': 'application/json' },
    })
    setAnswer(data.answer)
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">SmartDocs AI Dashboard</h1>

      <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
        {uploadMutation.isPending ? 'Uploading & analyzing...' : 'Click to upload a PDF / TXT / DOCX'}
        <input
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files[0])}
        />
      </label>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {docs?.map((d) => (
            <div
              key={d.id}
              className={`border rounded-lg p-4 cursor-pointer ${activeDoc === d.id ? 'border-black' : ''}`}
              onClick={() => setActiveDoc(d.id)}
            >
              <h3 className="font-semibold">{d.title}</h3>
              <p className="text-sm text-gray-600">{d.summary}</p>
              <p className="text-xs text-gray-400">{d.keywords}</p>
            </div>
          ))}
        </div>
      )}

      {activeDoc && (
        <div className="border-t pt-4 space-y-2">
          <h2 className="font-semibold">Ask about this document</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What are the payment terms?"
            />
            <button className="bg-black text-white px-4 rounded-lg" onClick={askQuestion}>
              Ask
            </button>
          </div>
          {answer && <p className="bg-gray-100 rounded-lg p-3">{answer}</p>}
        </div>
      )}
    </div>
  )
}
