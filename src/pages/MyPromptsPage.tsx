import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import type { CustomPrompt } from '../types'
import { usePageHeader } from '../components/layout/PageHeaderContext'

export default function MyPromptsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { showToast, setPendingInputText, showConfirm } = useAppStore()
  const { setHeader } = usePageHeader()

  const [prompts, setPrompts] = useState<CustomPrompt[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: '', content: '' })

  const loadPrompts = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('custom_prompts') || '[]')
      setPrompts(Array.isArray(saved) ? saved : [])
    } catch (e) {
      console.error('Failed to load prompts:', e)
      setPrompts([])
    }
  }, [])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const headerActions = useMemo(() => (
    <button
      onClick={() => {
        loadPrompts()
        showToast('已刷新', 'success')
      }}
      className="shrink-0 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
    >
      刷新
    </button>
  ), [loadPrompts, showToast])

  useEffect(() => {
    setHeader({
      title: '我的提示词',
      description: '自定义/收藏的提示词库',
      actions: headerActions
    })
    return () => setHeader(null)
  }, [setHeader, headerActions])

  const savePrompts = (newPrompts: CustomPrompt[]) => {
    localStorage.setItem('custom_prompts', JSON.stringify(newPrompts))
    setPrompts(newPrompts)
  }

  const clearForm = () => {
    setEditingId(null)
    setFormData({ title: '', content: '' })
  }

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('请填写标题和内容', 'warning')
      return
    }

    if (editingId) {
      const updated = prompts.map(p =>
        p.id === editingId
          ? { ...p, title: formData.title, content: formData.content, updatedAt: Date.now() }
          : p
      )
      savePrompts(updated)
      showToast('更新成功', 'success')
      clearForm()
      return
    }

    const newPrompt: CustomPrompt = {
      id: 'prompt_' + Date.now(),
      title: formData.title,
      content: formData.content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    savePrompts([newPrompt, ...prompts])
    showToast('保存成功', 'success')
    clearForm()
  }

  const handleDelete = (id: string) => {
    showConfirm({
      title: '删除提示词',
      message: '确定删除这条提示词吗？',
      type: 'danger',
      onConfirm: () => {
        savePrompts(prompts.filter(p => p.id !== id))
        showToast('已删除', 'success')
      }
    })
  }

  const handleEdit = (prompt: CustomPrompt) => {
    setEditingId(prompt.id)
    setFormData({ title: prompt.title, content: prompt.content })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制', 'success')
    })
  }

  const handleUse = (text: string) => {
    setPendingInputText(text)
    showToast('提示词已填充到输入框', 'success')
    if (location.pathname !== '/create') {
      navigate('/create')
    }
  }

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      if (!searchTerm) return true
      const s = searchTerm.toLowerCase()
      return p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s)
    })
  }, [prompts, searchTerm])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-start justify-between gap-3 mb-4 lg:hidden">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">我的提示词</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 font-serif">自定义/收藏的提示词库</p>
          </div>
          <button
            onClick={() => {
              loadPrompts()
              showToast('已刷新', 'success')
            }}
            className="shrink-0 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            刷新
          </button>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-medium mb-3">{editingId ? '编辑提示词' : '新建提示词'}</h3>
          <input
            type="text"
            placeholder="标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] mb-2 shadow-sm"
          />
          <textarea
            placeholder="提示词内容"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] h-24 resize-none mb-3 shadow-sm font-serif"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
            >
              {editingId ? '更新' : '保存'}
            </button>
            {editingId && (
              <button
                onClick={clearForm}
                className="px-4 py-2 bg-[var(--bg-tertiary)] rounded-xl hover:opacity-80 transition-opacity shadow-sm"
              >
                取消
              </button>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="搜索提示词..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] mb-4 shadow-sm"
        />

        {filteredPrompts.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-tertiary)]">
            {prompts.length === 0 ? '暂无提示词，创建一个吧' : '未找到匹配的提示词'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPrompts.map(prompt => (
              <div
                key={prompt.id}
                className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-4 shadow-sm"
              >
                <h4 className="font-medium text-sm mb-2">{prompt.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] font-serif line-clamp-3 mb-3">
                  {prompt.content}
                </p>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => handleCopy(prompt.content)}
                    className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    复制
                  </button>
                  <button
                    onClick={() => handleUse(prompt.content)}
                    className="px-3 py-1 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    使用
                  </button>
                  <button
                    onClick={() => handleEdit(prompt)}
                    className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    className="px-3 py-1 text-[var(--danger-color)] hover:bg-[color:rgba(178,58,58,0.10)] rounded-lg transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
