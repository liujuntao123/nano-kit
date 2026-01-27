import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Provider } from '../types'
import { usePageHeader } from '../components/layout/PageHeaderContext'

function getEmptyForm(): Partial<Provider> {
  return {
    id: '',
    name: '',
    type: 'gemini',
    host: '',
    key: '',
    textModel: 'gemini-3-flash',
    imageModel: 'gemini-3-pro-image',
    capabilities: { image: true, text: true },
    enableModelSuffix: false
  }
}

export default function SettingsPage() {
  const {
    providers,
    activeProviderId,
    activeTextProviderId,
    saveProvider,
    deleteProvider,
    setActiveProvider,
    setActiveTextProvider,
    showToast,
    showConfirm
  } = useAppStore()
  const { setHeader } = usePageHeader()

  const [formData, setFormData] = useState<Partial<Provider>>(getEmptyForm())

  useEffect(() => {
    setHeader({
      title: '设置',
      description: 'API 渠道管理'
    })
    return () => setHeader(null)
  }, [setHeader])

  const providerById = useMemo(() => {
    const map = new Map<string, Provider>()
    providers.forEach(p => map.set(p.id, p))
    return map
  }, [providers])

  const loadProvider = (provider: Provider) => setFormData(provider)

  const clearForm = () => setFormData(getEmptyForm())

  const setCapability = (key: 'image' | 'text', value: boolean) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        image: prev.capabilities?.image ?? true,
        text: prev.capabilities?.text ?? false,
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    const payload = {
      id: formData.id,
      name: (formData.name || '').trim(),
      type: (formData.type || 'gemini') as Provider['type'],
      host: (formData.host || '').trim(),
      key: (formData.key || '').trim(),
      textModel: (formData.textModel || '').trim(),
      imageModel: (formData.imageModel || '').trim(),
      capabilities: {
        image: formData.capabilities?.image ?? true,
        text: formData.capabilities?.text ?? false
      },
      enableModelSuffix: formData.enableModelSuffix ?? true
    }

    if (!payload.name || !payload.host || !payload.key) {
      showToast('渠道名称、API Host、API Key 必填', 'warning')
      return
    }
    if (!payload.capabilities.image && !payload.capabilities.text) {
      showToast('至少勾选一个能力：图片或文案', 'warning')
      return
    }
    if (payload.capabilities.text && !payload.textModel) {
      showToast('请填写文本模型', 'warning')
      return
    }
    if (payload.capabilities.image && !payload.imageModel) {
      showToast('请填写绘图模型', 'warning')
      return
    }

    const id = saveProvider(payload as Omit<Provider, 'id'> & { id?: string })
    setFormData(prev => ({ ...prev, id }))
  }

  const handleDelete = () => {
    if (!formData.id) return
    showConfirm({
      title: '删除渠道',
      message: '确定删除该渠道?',
      type: 'danger',
      onConfirm: () => {
        deleteProvider(formData.id!)
        clearForm()
      }
    })
  }

  const activeImageLabel = providerById.get(activeProviderId)?.name || '未选择'

  const activeTextLabel = providerById.get(activeTextProviderId)?.name || '未选择'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-4 lg:hidden">
          <h1 className="text-lg font-semibold tracking-tight">设置</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 font-serif">API 渠道管理</p>
        </div>

        <Section title="API 渠道">
          <div className="mb-3 px-3 py-2 rounded-xl bg-[var(--highlight)] border border-[var(--border-color)] text-sm">
            <span className="text-[var(--text-tertiary)]">💡 Tips: </span>
            <a
              href="https://foxcode.rjj.cc/auth/register?aff=8LR7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--link-color)] hover:underline"
            >
              高性价比 API 站
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-4">
            {/* Left: channel list */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 shadow-sm">
                <div className="text-xs text-[var(--text-tertiary)] mb-2 font-serif">默认渠道</div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">图片生成</label>
                      <span className="text-xs text-[var(--text-tertiary)]">{activeImageLabel}</span>
                    </div>
                    <select
                      value={activeProviderId}
                      onChange={(e) => setActiveProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                    >
                      <option value="" disabled>请选择...</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id} disabled={!p.capabilities?.image}>
                          {p.name}{p.capabilities?.image ? '' : ' (未启用图片)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">文案生成</label>
                      <span className="text-xs text-[var(--text-tertiary)]">{activeTextLabel}</span>
                    </div>
                    <select
                      value={activeTextProviderId}
                      onChange={(e) => setActiveTextProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                    >
                      <option value="" disabled>请选择...</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id} disabled={!p.capabilities?.text}>
                          {p.name}{p.capabilities?.text ? '' : ' (未启用文案)'}
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-serif">
                      用于文章配图、信息图等功能
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--text-tertiary)] font-serif">渠道列表</div>
                <button
                  onClick={clearForm}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-tertiary)] text-xs hover:opacity-80 transition-opacity shadow-sm"
                >
                  + 新增渠道
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 shadow-sm">
                {providers.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-[var(--text-tertiary)]">
                    暂无渠道，点击“新增渠道”开始配置
                  </div>
                ) : (
                  providers.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loadProvider(p)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors border border-transparent
                        ${formData.id === p.id ? 'bg-[var(--bg-secondary)] border-[var(--border-color)]' : 'hover:bg-[var(--bg-secondary)]'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">{p.name}</span>
                            {activeProviderId === p.id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--highlight)] text-[var(--link-color)]">
                                绘图
                              </span>
                            )}
                            {activeTextProviderId === p.id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--highlight)] text-[var(--link-color)]">
                                文案
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {p.type === 'gemini' ? 'Gemini' : 'OpenAI 兼容'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {p.capabilities?.image && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)]">图</span>
                          )}
                          {p.capabilities?.text && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)]">文</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: details */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-[var(--text-secondary)]">
                    {formData.id ? '编辑渠道' : '新增渠道'}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] font-serif mt-0.5">
                    勾选该渠道支持的能力：图片/文案
                  </div>
                </div>
                {formData.id && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 bg-[var(--danger-color)] text-white rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm"
                  >
                    删除
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="渠道名称"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.type || 'gemini'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI 兼容</option>
                  </select>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.capabilities?.image ?? true}
                        onChange={(e) => setCapability('image', e.target.checked)}
                        className="accent-[var(--accent-color)]"
                      />
                      图片
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.capabilities?.text ?? false}
                        onChange={(e) => setCapability('text', e.target.checked)}
                        className="accent-[var(--accent-color)]"
                      />
                      文案
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="API Host"
                  value={formData.host || ''}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                />
                <input
                  type="password"
                  placeholder="API Key"
                  value={formData.key || ''}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="文本模型"
                    value={formData.textModel || ''}
                    onChange={(e) => setFormData({ ...formData, textModel: e.target.value })}
                    disabled={!(formData.capabilities?.text ?? false)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]"
                  />
                  <input
                    type="text"
                    placeholder="绘图模型"
                    value={formData.imageModel || ''}
                    onChange={(e) => setFormData({ ...formData, imageModel: e.target.value })}
                    disabled={!(formData.capabilities?.image ?? true)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]"
                  />
                </div>

                {/* 模型名称拼接开关 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
                  <div>
                    <div className="text-sm">模型名称拼接</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] font-serif">
                      自动拼接分辨率和比例后缀，如gemini-3-pro-image-4k-16x9
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enableModelSuffix: !(formData.enableModelSuffix ?? true) })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      (formData.enableModelSuffix ?? true) ? 'bg-[var(--accent-color)]' : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        (formData.enableModelSuffix ?? true) ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 py-2 bg-[var(--accent-color)] text-white rounded-xl text-sm hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
                  >
                    保存
                  </button>
                  <button
                    onClick={clearForm}
                    className="px-3 py-2 bg-[var(--bg-tertiary)] rounded-xl text-sm hover:opacity-80 transition-opacity shadow-sm"
                  >
                    清空
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{title}</h2>
      {children}
    </div>
  )
}
