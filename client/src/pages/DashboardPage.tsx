import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

interface Doc {
  id: number
  title: string
  fileType: string
  summary: string | null
  keywords: string | null
  uploadedAt: string
  categoryId: number | null
}

interface Category {
  id: number
  name: string
  color: string
  count: number
}

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']

export default function DashboardPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { fullName, email, logout } = useAuthStore()
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null | 'all'>('all')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(COLORS[0])

  const { data: docs } = useQuery<Doc[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get('/documents')).data,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/documents/${id}`),
    onSuccess: (_, id) => {
      if (activeDoc?.id === id) { setActiveDoc(null); setAnswer('') }
      setConfirmDelete(null)
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: async () => api.post('/categories', { name: newCatName, color: newCatColor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setNewCatName('')
      setShowNewCategory(false)
    },
  })

  const assignCategoryMutation = useMutation({
    mutationFn: async ({ docId, categoryId }: { docId: number; categoryId: number | null }) =>
      api.patch(`/documents/${docId}/category`, categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const askQuestion = async () => {
    if (!activeDoc || !question.trim()) return
    setAsking(true); setAnswer('')
    try {
      const { data } = await api.post(`/documents/${activeDoc.id}/chat`, JSON.stringify(question), {
        headers: { 'Content-Type': 'application/json' },
      })
      setAnswer(data.answer)
    } catch { setAnswer('Something went wrong. Please try again.') }
    finally { setAsking(false) }
  }

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ?? 'U'

  const filteredDocs = docs?.filter(d => {
    if (activeCategoryId === 'all') return true
    if (activeCategoryId === null) return d.categoryId === null
    return d.categoryId === activeCategoryId
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/10 flex flex-col p-5 shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <span className="font-semibold">SmartDocs AI</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {/* All documents */}
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
              activeCategoryId === 'all' ? 'bg-white/10 font-medium' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2"><span>📄</span> All Documents</span>
            <span className="text-xs text-white/40">{docs?.length ?? 0}</span>
          </button>

          {/* Uncategorized */}
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
              activeCategoryId === null ? 'bg-white/10 font-medium' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2"><span>📁</span> Uncategorized</span>
            <span className="text-xs text-white/40">{docs?.filter(d => !d.categoryId).length ?? 0}</span>
          </button>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="pt-2">
              <p className="text-white/30 text-xs px-3 mb-1 uppercase tracking-wider">Categories</p>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                    activeCategoryId === cat.id ? 'bg-white/10 font-medium' : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }}/>
                    {cat.name}
                  </span>
                  <span className="text-xs text-white/40">{cat.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* New category */}
          {showNewCategory ? (
            <div className="mt-2 p-2 bg-white/5 rounded-lg space-y-2">
              <input
                className="w-full bg-white/10 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                placeholder="Category name"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full transition ${newCatColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0a]' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => newCatName.trim() && createCategoryMutation.mutate()}
                  className="flex-1 bg-white text-black text-xs py-1.5 rounded font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewCategory(false)}
                  className="flex-1 bg-white/10 text-white text-xs py-1.5 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCategory(true)}
              className="w-full text-left px-3 py-2 text-xs text-white/30 hover:text-white/60 transition"
            >
              + New category
            </button>
          )}
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{fullName}</p>
              <p className="text-xs text-white/40 truncate">{email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-xs text-white/40 hover:text-white/70 transition px-1">
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">
              {activeCategoryId === 'all' ? 'All Documents'
                : activeCategoryId === null ? 'Uncategorized'
                : categories?.find(c => c.id === activeCategoryId)?.name ?? 'Documents'}
            </h1>
            <p className="text-white/40 text-xs">{filteredDocs?.length ?? 0} files</p>
          </div>
          <label className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/90 transition">
            {uploadMutation.isPending ? 'Uploading...' : '+ Upload document'}
            <input type="file" className="hidden" accept=".pdf,.txt,.docx"
              onChange={e => e.target.files && uploadMutation.mutate(e.target.files[0])} />
          </label>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Document list */}
          <div className="w-80 border-r border-white/10 overflow-y-auto p-4 space-y-2 shrink-0">
            {filteredDocs?.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm">
                <p className="text-3xl mb-3">📂</p>
                <p>No documents here</p>
              </div>
            )}
            {filteredDocs?.map(d => (
              <div key={d.id}
                className={`p-4 rounded-xl border cursor-pointer transition group relative ${
                  activeDoc?.id === d.id ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
                onClick={() => { setActiveDoc(d); setAnswer(''); setQuestion('') }}
              >
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(d.id) }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition text-xs"
                >✕</button>

                {confirmDelete === d.id && (
                  <div className="absolute inset-0 bg-[#0a0a0a]/95 rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                    <p className="text-xs text-white/70">Delete this document?</p>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(d.id) }}
                        className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg">
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(null) }}
                        className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {d.fileType === 'pdf' ? '📕' : d.fileType === 'docx' ? '📘' : '📄'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate pr-4">{d.title}</p>
                    <p className="text-white/40 text-xs mt-1 line-clamp-2">
                      {d.summary?.startsWith('AI analysis') ? 'Analysis unavailable' : d.summary ?? 'Processing...'}
                    </p>
                    {/* Category badge + assign */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {d.categoryId && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ background: categories?.find(c => c.id === d.categoryId)?.color + '40',
                            color: categories?.find(c => c.id === d.categoryId)?.color }}>
                          {categories?.find(c => c.id === d.categoryId)?.name}
                        </span>
                      )}
                      <select
                        onClick={e => e.stopPropagation()}
                        onChange={e => assignCategoryMutation.mutate({ docId: d.id, categoryId: e.target.value ? Number(e.target.value) : null })}
                        value={d.categoryId ?? ''}
                        className="text-xs bg-transparent text-white/30 border-none outline-none cursor-pointer hover:text-white/60"
                      >
                        <option value="">+ category</option>
                        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col p-6">
            {!activeDoc ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <p className="text-5xl mb-4">💬</p>
                  <p className="text-white/40 text-sm">Select a document to start chatting</p>
                  <p className="text-white/20 text-xs mt-1">Hover over a document to delete it</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 pb-4 border-b border-white/10">
                  <h2 className="font-semibold">{activeDoc.title}</h2>
                  {activeDoc.summary && !activeDoc.summary.startsWith('AI analysis') && (
                    <p className="text-white/50 text-sm mt-1">{activeDoc.summary}</p>
                  )}
                  {activeDoc.keywords && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeDoc.keywords.split(',').slice(0, 5).map(k => (
                        <span key={k} className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">{k.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {answer && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 leading-relaxed">
                      <p className="text-white/40 text-xs mb-2">AI Answer</p>
                      {answer}
                    </div>
                  )}
                  {asking && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/40 animate-pulse">Thinking...</div>
                  )}
                  {!answer && !asking && (
                    <div className="text-center py-8 text-white/20 text-sm">Ask anything about this document</div>
                  )}
                </div>
                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Ask anything about this document..."
                    onKeyDown={e => e.key === 'Enter' && askQuestion()}
                  />
                  <button onClick={askQuestion} disabled={asking || !question.trim()}
                    className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/90 transition disabled:opacity-40">
                    Ask
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}