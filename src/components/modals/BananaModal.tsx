import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import Modal from '../ui/Modal'
import { nativeFetch } from '../../utils/helpers'
import type { BananaPrompt, CustomPrompt } from '../../types'

const URLS = [
  'https://raw.githubusercontent.com/glidea/banana-prompt-quicker/refs/heads/main/prompts.json',
  'https://cdn.jsdelivr.net/gh/glidea/banana-prompt-quicker@main/prompts.json',
  'https://fastly.jsdelivr.net/gh/glidea/banana-prompt-quicker@main/prompts.json'
]

const PROMPTS_CACHE_KEY = 'banana_prompts_cache_v1'
const PROMPTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// Extract tags from prompt text
function extractTags(prompt: string, category: string, mode: string): string[] {
  const tags: string[] = []

  // Add category and mode as tags
  if (category) tags.push(category)
  if (mode) tags.push(mode)

  // Common style keywords to extract
  const styleKeywords = [
    'anime', 'realistic', 'cartoon', 'pixel', '3d', 'watercolor', 'oil painting',
    'sketch', 'digital art', 'photography', 'cinematic', 'portrait', 'landscape',
    'fantasy', 'sci-fi', 'horror', 'cute', 'dark', 'bright', 'vintage', 'modern',
    'minimalist', 'detailed', 'abstract', 'surreal', 'cyberpunk', 'steampunk',
    'ghibli', 'disney', 'pixar', 'manga', 'comic', 'illustration', 'concept art',
    '动漫', '写实', '卡通', '像素', '水彩', '油画', '素描', '数字艺术', '摄影',
    '电影感', '肖像', '风景', '奇幻', '科幻', '恐怖', '可爱', '暗黑', '明亮',
    '复古', '现代', '极简', '细节', '抽象', '超现实', '赛博朋克', '蒸汽朋克'
  ]

  const lowerPrompt = prompt.toLowerCase()
  for (const keyword of styleKeywords) {
    if (lowerPrompt.includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
      tags.push(keyword)
      if (tags.length >= 6) break // Limit to 6 tags
    }
  }

  return tags
}

type PromptSourceTab = 'all' | 'saved'
type PromptModeFilter = 'all' | 'generate' | 'edit'

type PromptListItem = {
  id: string
  title: string
  prompt: string
  preview?: string
  category?: string
  mode?: 'generate' | 'edit'
  author?: string
  source: 'banana' | 'saved'
}

export default function BananaModal() {
  const { bananaModalOpen, closeBananaModal, showToast, setPendingInputText } = useAppStore()
  const [prompts, setPrompts] = useState<BananaPrompt[]>([])
  const [savedPrompts, setSavedPrompts] = useState<CustomPrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [sourceTab, setSourceTab] = useState<PromptSourceTab>('all')
  const [modeFilter, setModeFilter] = useState<PromptModeFilter>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const readPromptsCache = (): { data: BananaPrompt[]; expired: boolean } | null => {
    try {
      const raw = localStorage.getItem(PROMPTS_CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const cachedAt = Number(parsed?.cachedAt || 0)
      const data = parsed?.data
      if (!cachedAt || !Array.isArray(data)) return null
      const expired = Date.now() - cachedAt > PROMPTS_CACHE_TTL_MS
      return { data, expired }
    } catch {
      return null
    }
  }

  const writePromptsCache = (data: BananaPrompt[]) => {
    try {
      localStorage.setItem(
        PROMPTS_CACHE_KEY,
        JSON.stringify({ cachedAt: Date.now(), data })
      )
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (bananaModalOpen) {
      loadSavedPrompts()
      if (prompts.length > 0) return

      const cache = readPromptsCache()
      if (cache && !cache.expired && cache.data.length > 0) {
        setPrompts(cache.data)
        return
      }

      fetchData()
    }
  }, [bananaModalOpen])

  const loadSavedPrompts = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('custom_prompts') || '[]')
      const arr = Array.isArray(saved) ? saved : []
      setSavedPrompts(arr)
    } catch (e) {
      console.error('Failed to load saved prompts:', e)
      setSavedPrompts([])
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(false)

    const staleCache = readPromptsCache()

    for (const url of URLS) {
      try {
        const res = await nativeFetch(url, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) continue

        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setPrompts(data)
          writePromptsCache(data)
          setLoading(false)
          showToast(`成功加载 ${data.length} 个提示词`, 'success')
          return
        }
      } catch (e) {
        console.warn('Failed to fetch from:', url)
      }
    }

    setLoading(false)

    if (staleCache && staleCache.data.length > 0) {
      setPrompts(staleCache.data)
      showToast('加载失败，已使用缓存提示词', 'warning')
      return
    }

    setError(true)
    showToast('加载提示词失败', 'error')
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制', 'success')
    })
  }

  const handleUse = (text: string) => {
    setPendingInputText(text)
    closeBananaModal()
    showToast('提示词已填充', 'success')
  }

  const handleSaveToCustom = (item: PromptListItem) => {
    try {
      const saved = JSON.parse(localStorage.getItem('custom_prompts') || '[]')
      const exists = saved.some((p: any) =>
        p?.title === item.title ||
        p?.content === item.prompt ||
        p?.prompt === item.prompt
      )

      if (exists) {
        showToast('该提示词已存在', 'warning')
        return
      }

      saved.unshift({
        id: 'prompt_' + Date.now(),
        title: item.title,
        content: item.prompt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        category: item.category,
        mode: item.mode,
        preview: item.preview,
        author: item.author
      })

      localStorage.setItem('custom_prompts', JSON.stringify(saved))
      loadSavedPrompts()
      showToast('已保存到我的提示词', 'success')
    } catch (e) {
      showToast('保存失败', 'error')
    }
  }

  const savedPromptIndex = useMemo(() => {
    const titles = new Set<string>()
    const contents = new Set<string>()
    for (const p of savedPrompts) {
      if (p?.title) titles.add(p.title)
      if (p?.content) contents.add(p.content)
      if ((p as any)?.prompt) contents.add((p as any).prompt)
    }
    return { titles, contents }
  }, [savedPrompts])

  const allItems = useMemo<PromptListItem[]>(() => {
    return prompts.map((p, idx) => ({
      id: `banana_${idx}`,
      title: p.title,
      prompt: p.prompt,
      preview: p.preview,
      category: p.category,
      mode: p.mode,
      author: p.author,
      source: 'banana'
    }))
  }, [prompts])

  const savedItems = useMemo<PromptListItem[]>(() => {
    return savedPrompts.map((p) => ({
      id: p.id,
      title: p.title,
      prompt: (p as any).content ?? (p as any).prompt ?? '',
      preview: p.preview,
      category: p.category,
      mode: p.mode,
      author: p.author,
      source: 'saved'
    }))
  }, [savedPrompts])

  const baseItems = sourceTab === 'all' ? allItems : savedItems

  const primaryFiltered = useMemo(() => {
    return baseItems.filter((item) => {
      if (modeFilter !== 'all' && item.mode !== modeFilter) return false

      if (searchTerm) {
        const s = searchTerm.toLowerCase()
        const haystack = [
          item.title,
          item.prompt,
          item.category || '',
          item.author || ''
        ]
          .join('\n')
          .toLowerCase()
        if (!haystack.includes(s)) return false
      }

      return true
    })
  }, [baseItems, modeFilter, searchTerm])

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of primaryFiltered) {
      const tags = extractTags(item.prompt || '', item.category || '', item.mode || '')
      for (const tag of tags) {
        if (tag === 'generate' || tag === 'edit') continue
        counts.set(tag, (counts.get(tag) || 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag)
  }, [primaryFiltered])

  useEffect(() => {
    if (tagFilter !== 'all' && !availableTags.includes(tagFilter)) {
      setTagFilter('all')
    }
  }, [availableTags, tagFilter])

  const filteredItems = useMemo(() => {
    return primaryFiltered.filter((item) => {
      if (tagFilter === 'all') return true
      const tags = extractTags(item.prompt || '', item.category || '', item.mode || '')
      return tags.includes(tagFilter)
    })
  }, [primaryFiltered, tagFilter])

  const sourceTabs = [
    { id: 'all' as const, label: `全部提示词${prompts.length > 0 ? `（${prompts.length}）` : ''}` },
    { id: 'saved' as const, label: `我收藏的提示词${savedPrompts.length > 0 ? `（${savedPrompts.length}）` : ''}` }
  ]

  const modeTabs = [
    { id: 'all' as const, label: '全部' },
    { id: 'generate' as const, label: '生成' },
    { id: 'edit' as const, label: '编辑' }
  ]

  return (
    <Modal
      isOpen={bananaModalOpen}
      onClose={closeBananaModal}
      title="提示词参考"
      className="w-[95vw] max-w-5xl h-[85vh]"
    >
      <div className="p-4 flex flex-col h-full gap-4">
        {/* Source + Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              {sourceTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSourceTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors
                    ${sourceTab === tab.id
                      ? 'bg-[var(--accent-color)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {modeTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setModeFilter(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors
                    ${modeFilter === tab.id
                      ? 'bg-[var(--ink)] text-[var(--paper)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="搜索提示词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-[var(--text-tertiary)] shrink-0">标签：</span>
            <button
              type="button"
              onClick={() => setTagFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors
                ${tagFilter === 'all'
                  ? 'bg-[var(--accent-color)] text-white border-transparent'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                }`}
            >
              全部
            </button>
            {availableTags.slice(0, 40).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tag)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors
                  ${tagFilter === tag
                    ? 'bg-[var(--accent-color)] text-white border-transparent'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {sourceTab === 'all' && loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="loading-spinner w-8 h-8" />
              <span className="ml-3 text-[var(--text-secondary)]">加载中...</span>
            </div>
          ) : sourceTab === 'all' && error ? (
            <div className="text-center py-20">
              <p className="text-[var(--danger-color)] mb-4">加载失败</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
              >
                重试
              </button>
            </div>
          ) : sourceTab === 'saved' && savedItems.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-tertiary)]">
              还没有收藏提示词，点卡片右下角按钮即可收藏
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-tertiary)]">
              未找到相关提示词
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <PromptCard
                    key={item.id}
                    item={item}
                    onCopy={handleCopy}
                    onUse={handleUse}
                    onSave={handleSaveToCustom}
                    saveDisabled={
                      item.source !== 'banana' ||
                      savedPromptIndex.titles.has(item.title) ||
                      savedPromptIndex.contents.has(item.prompt)
                    }
                    onTagClick={(tag) => {
                      if (tag === 'generate' || tag === 'edit') {
                        setModeFilter(tag)
                        setTagFilter('all')
                        return
                      }
                      setTagFilter(tag)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function PromptCard({
  item,
  onCopy,
  onUse,
  onSave,
  saveDisabled,
  onTagClick
}: {
  item: PromptListItem
  onCopy: (text: string) => void
  onUse: (text: string) => void
  onSave: (item: PromptListItem) => void
  saveDisabled: boolean
  onTagClick: (tag: string) => void
}) {
  const tags = extractTags(item.prompt || '', item.category || '', item.mode || '')

  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
      {/* Preview Image */}
      <div className="relative h-40 bg-[var(--bg-secondary)]">
        {item.preview ? (
          <img
            src={item.preview}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Preview'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--border-color)] text-[var(--text-tertiary)] text-xs font-medium">
            {item.source === 'saved' ? '收藏' : 'No Preview'}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="px-3 pt-3 flex flex-wrap gap-1">
        {tags.map((tag, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onTagClick(tag)}
            className={`px-2 py-0.5 text-xs rounded ${
              idx === 0 ? 'bg-[var(--ink)] text-[var(--paper)]' :
              idx === 1 ? (item.mode === 'generate' ? 'bg-[var(--success-color)] text-[var(--paper)]' : 'bg-[var(--link-color)] text-[var(--paper)]') :
              'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 pt-2">
        <h4 className="font-medium text-sm mb-2 truncate">{item.title}</h4>
        <p className="text-xs text-[var(--text-secondary)] font-serif line-clamp-2 mb-3 h-8">
          {item.prompt}
        </p>

        {/* Author */}
        {item.author && (
          <p className="text-xs text-[var(--text-tertiary)] mb-2">
            by {item.author.split('@')[0]}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onCopy(item.prompt)}
            className="flex-1 px-2 py-1.5 text-xs bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            复制
          </button>
          <button
            onClick={() => onUse(item.prompt)}
            className="flex-1 px-2 py-1.5 text-xs bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            使用
          </button>
          {item.source === 'banana' && (
            <button
              type="button"
              disabled={saveDisabled}
              onClick={() => {
                if (saveDisabled) return
                onSave(item)
              }}
              className={`px-2 py-1.5 text-xs bg-[var(--bg-tertiary)] rounded-lg transition-colors ${
                saveDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-secondary)]'
              }`}
              title={saveDisabled ? '已在我的提示词中' : '保存到我的提示词'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
