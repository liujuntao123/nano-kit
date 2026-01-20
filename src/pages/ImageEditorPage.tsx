import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { useAppStore } from '../store/appStore'
import { usePageHeader } from '../components/layout/PageHeaderContext'

interface Line {
  percent: number
  type: 'h' | 'v'
}

type SliceResult = { blob: Blob; name: string; url: string }

export default function ImageEditorPage() {
  const navigate = useNavigate()
  const { slicerImageUrl, closeSlicerModal, showToast } = useAppStore()
  const { setHeader } = usePageHeader()

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [horizontalLines, setHorizontalLines] = useState<Line[]>([])
  const [verticalLines, setVerticalLines] = useState<Line[]>([])
  const [mode, setMode] = useState<'horizontal' | 'vertical'>('horizontal')
  const [forceSquare, setForceSquare] = useState(false)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [slices, setSlices] = useState<SliceResult[]>([])
  const slicesRef = useRef<SliceResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [, forceUpdate] = useState(0)

  const imageRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    slicesRef.current = slices
  }, [slices])

  const clearSlices = useCallback(() => {
    setSlices(prev => {
      prev.forEach(s => URL.revokeObjectURL(s.url))
      return []
    })
  }, [])

  const resetEditor = useCallback(() => {
    setHorizontalLines([])
    setVerticalLines([])
    clearSlices()
  }, [clearSlices])

  useEffect(() => {
    if (slicerImageUrl) {
      setImageSrc(slicerImageUrl)
      resetEditor()
      // Auto grid
      setTimeout(() => autoGrid(6, 4), 100)
    }
  }, [slicerImageUrl, resetEditor])

  useEffect(() => {
    return () => {
      // Cleanup blob URLs on unmount
      slicesRef.current.forEach(s => URL.revokeObjectURL(s.url))
    }
  }, [])

  const autoGrid = (rows: number, cols: number) => {
    const hLines: Line[] = []
    const vLines: Line[] = []
    for (let i = 1; i < rows; i++) {
      hLines.push({ percent: (i / rows) * 100, type: 'h' })
    }
    for (let j = 1; j < cols; j++) {
      vLines.push({ percent: (j / cols) * 100, type: 'v' })
    }
    setHorizontalLines(hLines)
    setVerticalLines(vLines)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string)
      resetEditor()
    }
    reader.readAsDataURL(file)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!overlayRef.current || e.target !== overlayRef.current) return

    const rect = overlayRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (mode === 'horizontal') {
      const percent = (y / rect.height) * 100
      setHorizontalLines(prev => [...prev, { percent, type: 'h' }])
    } else {
      const percent = (x / rect.width) * 100
      setVerticalLines(prev => [...prev, { percent, type: 'v' }])
    }
  }

  const removeLine = (type: 'h' | 'v', index: number) => {
    if (type === 'h') {
      setHorizontalLines(prev => prev.filter((_, i) => i !== index))
    } else {
      setVerticalLines(prev => prev.filter((_, i) => i !== index))
    }
  }

  const clearLines = () => {
    setHorizontalLines([])
    setVerticalLines([])
  }

  const processSlices = async () => {
    if (!imageRef.current) return

    setProcessing(true)
    clearSlices()

    const img = imageRef.current
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight

    // Calculate cut positions
    const hCuts = horizontalLines.map(l => (l.percent / 100) * imgHeight)
    hCuts.push(0, imgHeight)
    hCuts.sort((a, b) => a - b)

    const vCuts = verticalLines.map(l => (l.percent / 100) * imgWidth)
    vCuts.push(0, imgWidth)
    vCuts.sort((a, b) => a - b)

    const newSlices: SliceResult[] = []

    for (let i = 0; i < hCuts.length - 1; i++) {
      for (let j = 0; j < vCuts.length - 1; j++) {
        const srcX = vCuts[j]
        const srcY = hCuts[i]
        const srcW = vCuts[j + 1] - vCuts[j]
        const srcH = hCuts[i + 1] - hCuts[i]

        if (srcW < 1 || srcH < 1) continue

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const scale = 2 // 2x resolution

        if (forceSquare) {
          const maxDim = Math.max(srcW, srcH)
          canvas.width = maxDim * scale
          canvas.height = maxDim * scale

          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const offsetX = (maxDim - srcW) / 2
          const offsetY = (maxDim - srcH) / 2
          ctx.drawImage(
            img,
            srcX, srcY, srcW, srcH,
            offsetX * scale, offsetY * scale, srcW * scale, srcH * scale
          )
        } else {
          canvas.width = srcW * scale
          canvas.height = srcH * scale
          ctx.drawImage(
            img,
            srcX, srcY, srcW, srcH,
            0, 0, srcW * scale, srcH * scale
          )
        }

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png', 1.0)
        })

        const name = `slice_${i + 1}_${j + 1}.png`
        const url = URL.createObjectURL(blob)
        newSlices.push({ blob, name, url })
      }
    }

    setSlices(newSlices)
    setProcessing(false)
    showToast(`成功生成 ${newSlices.length} 个切片`, 'success')
  }

  const downloadSlice = (slice: { url: string; name: string }) => {
    const a = document.createElement('a')
    a.href = slice.url
    a.download = slice.name
    a.click()
  }

  const downloadAll = async () => {
    if (slices.length === 0) return

    const zip = new JSZip()
    const folder = zip.folder('slices')!
    slices.forEach(slice => folder.file(slice.name, slice.blob))

    const content = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(content)
    a.download = `slices_${Date.now()}.zip`
    a.click()
  }

  const handleClear = useCallback(() => {
    setImageSrc(null)
    resetEditor()
    closeSlicerModal()
  }, [closeSlicerModal, resetEditor])

  const headerActions = useMemo(() => (
    <>
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        返回
      </button>
      <button
        onClick={handleClear}
        className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] text-sm shadow-sm hover:opacity-80 transition-opacity"
      >
        清空
      </button>
    </>
  ), [navigate, handleClear])

  useEffect(() => {
    setHeader({
      title: '图片编辑',
      description: '切片/表情包工具',
      actions: headerActions
    })
    return () => setHeader(null)
  }, [setHeader, headerActions])

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full max-w-6xl mx-auto p-4 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4 lg:hidden">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">图片编辑</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 font-serif">切片/表情包工具</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] text-sm shadow-sm hover:opacity-80 transition-opacity"
            >
              清空
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-sm">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left - Editor */}
            <div className="lg:w-2/3 p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] flex flex-col">
              {/* Controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm bg-[var(--accent-color)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
                >
                  选择图片
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />

                <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-xl p-1 border border-[var(--border-color)] shadow-sm">
                  <button
                    onClick={() => setMode('horizontal')}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${mode === 'horizontal' ? 'bg-[var(--bg-primary)] shadow-sm' : 'hover:bg-[var(--bg-secondary)]'}`}
                  >
                    横线
                  </button>
                  <button
                    onClick={() => setMode('vertical')}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${mode === 'vertical' ? 'bg-[var(--bg-primary)] shadow-sm' : 'hover:bg-[var(--bg-secondary)]'}`}
                  >
                    竖线
                  </button>
                </div>

                <button
                  onClick={clearLines}
                  className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] rounded-xl hover:opacity-80 transition-opacity shadow-sm"
                >
                  清除线条
                </button>

                <button
                  onClick={processSlices}
                  disabled={!imageSrc || processing}
                  className="px-3 py-1.5 text-sm bg-[var(--success-color)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                >
                  {processing ? '处理中...' : '生成切片'}
                </button>
              </div>

              {/* Options */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forceSquare}
                    onChange={(e) => setForceSquare(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  强制正方形
                </label>
                {forceSquare && (
                  <label className="flex items-center gap-2">
                    背景色:
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </label>
                )}
              </div>

              {/* Image Editor */}
              <div className="flex-1 relative bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                {!imageSrc ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-tertiary)] cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p>点击选择图片</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt=""
                      className="max-w-full max-h-full object-contain"
                      crossOrigin="anonymous"
                      onLoad={() => forceUpdate(v => v + 1)}
                    />
                    {/* Overlay for lines */}
                    <div
                      ref={overlayRef}
                      className="absolute inset-0 cursor-crosshair"
                      onClick={handleOverlayClick}
                      style={{
                        top: imageRef.current
                          ? `${((overlayRef.current?.parentElement?.clientHeight || 0) - (imageRef.current?.clientHeight || 0)) / 2}px`
                          : 0,
                        left: imageRef.current
                          ? `${((overlayRef.current?.parentElement?.clientWidth || 0) - (imageRef.current?.clientWidth || 0)) / 2}px`
                          : 0,
                        width: imageRef.current?.clientWidth || '100%',
                        height: imageRef.current?.clientHeight || '100%'
                      }}
                    >
                      {/* Horizontal lines */}
                      {horizontalLines.map((line, i) => (
                        <div
                          key={`h-${i}`}
                          className="absolute left-0 right-0 h-0.5 bg-[var(--accent-color)] cursor-ns-resize group"
                          style={{ top: `${line.percent}%` }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); removeLine('h', i) }}
                            className="absolute right-0 -top-3 w-6 h-6 bg-[var(--accent-color)] text-white text-xs rounded opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {/* Vertical lines */}
                      {verticalLines.map((line, i) => (
                        <div
                          key={`v-${i}`}
                          className="absolute top-0 bottom-0 w-0.5 bg-[var(--link-color)] cursor-ew-resize group"
                          style={{ left: `${line.percent}%` }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); removeLine('v', i) }}
                            className="absolute -left-3 bottom-0 w-6 h-6 bg-[var(--link-color)] text-white text-xs rounded opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                点击图片添加切割线，橙色为横线，蓝色为竖线
              </p>
            </div>

            {/* Right - Results */}
            <div className="lg:w-1/3 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">切片结果</h3>
                {slices.length > 0 && (
                  <button
                    onClick={downloadAll}
                    className="px-3 py-1.5 text-sm bg-[var(--link-color)] text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    下载全部 (ZIP)
                  </button>
                )}
              </div>

              {slices.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-tertiary)]">
                  {processing ? '处理中...' : '点击“生成切片”查看结果'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slices.map((slice, i) => (
                    <div
                      key={i}
                      onClick={() => downloadSlice(slice)}
                      className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-[var(--link-color)] transition-shadow border border-[var(--border-color)]"
                    >
                      <img src={slice.url} alt="" className="w-full aspect-square object-contain" />
                      <div className="p-1 text-xs text-center text-[var(--text-secondary)]">
                        {slice.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
