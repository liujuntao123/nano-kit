import type { StyleKeywordRule } from './types'

/**
 * 文章配图风格关键词匹配规则
 */
export const ARTICLE_STYLE_KEYWORDS: StyleKeywordRule[] = [
  // 核心样式
  { id: 'notion', keywords: ['知识', '概念', '方法论', '生产力', '效率', '笔记', '复盘', '总结', '框架', 'saas', 'notion', '工具'] },
  { id: 'warm', keywords: ['成长', '情绪', '情感', '故事', '生活', '人生', '感受', '感悟', '陪伴', '治愈', '心理', '亲子', '关系'] },
  { id: 'minimal', keywords: ['极简', '简单', '专注', '核心', '本质', '要点', '精要', '少即是多', '冥想', '禅', 'zen'] },
  { id: 'playful', keywords: ['教程', '入门', '新手', '小白', '指南', '手把手', '怎么玩', '轻松', '好玩', '有趣', '一步步', 'how to', '趣味'] },
  { id: 'nature', keywords: ['自然', '环保', '生态', '健康', '养生', '户外', '旅行', '森林', '植物', '海洋', '绿色', '可持续', '有机'] },
  { id: 'sketch', keywords: ['想法', '点子', '脑暴', '草稿', '思考', '探索', '试验', '实验', '灵感'] },
  { id: 'elegant', keywords: ['商业', '公司', '职场', '战略', '策略', '分析', '报告', '增长', '管理', '运营', '市场', '品牌', '投融资', '专业'] },
  { id: 'bold', keywords: ['警告', '重要', '必须', '紧急', '风险', '注意', '避坑', '别踩坑', '严重', '关键', '危机', '必看'] },
  // 新增样式
  { id: 'watercolor', keywords: ['水彩', '艺术', '旅行', '美食', '生活方式', 'lifestyle', '创意', '手作', '摄影'] },
  { id: 'vintage', keywords: ['历史', '复古', '怀旧', '传记', '经典', '探险', '文化遗产', '老照片', '年代'] },
  { id: 'scientific', keywords: ['生物', '化学', '医学', '科研', '学术', '论文', '研究', '实验', '细胞', '基因', 'research'] },
  { id: 'chalkboard', keywords: ['课堂', '教学', '学校', '培训', '讲座', '工作坊', 'workshop', '板书', '老师', '学生'] },
  { id: 'editorial', keywords: ['杂志', '新闻', '深度', '调查', '报道', '解读', '分析报告', 'explainer', '图解'] },
  { id: 'flat', keywords: ['创业', 'startup', '产品', '数字', '现代', '互联网', 'app', '平台', '科技公司'] },
  { id: 'flat-doodle', keywords: ['工作流', 'workflow', '流程图', 'saas', '生产力工具', '协作', '团队', '项目管理'] },
  { id: 'retro', keywords: ['80s', '90s', '复古潮', '流行文化', '音乐', '怀旧', '游戏', '街机', '像素'] },
  { id: 'blueprint', keywords: ['建筑', '系统设计', '架构图', '工程', '技术方案', '基础设施', 'infrastructure', '蓝图'] },
  { id: 'vector-illustration', keywords: ['品牌', '儿童', '插画', '卡通', '玩具', '几何', '创意设计'] },
  { id: 'sketch-notes', keywords: ['视觉笔记', '手绘笔记', '知识卡片', '学习笔记', '读书笔记', '涂鸦笔记'] },
  { id: 'pixel-art', keywords: ['游戏', '8bit', '像素', '开发者', 'developer', '程序员', 'retro tech', '复古游戏'] },
  { id: 'intuition-machine', keywords: ['双语', '技术文档', '学术', '论文', '文献', 'documentation', '技术简报', 'briefing'] },
  { id: 'fantasy-animation', keywords: ['奇幻', '魔法', '童话', '吉卜力', 'ghibli', '迪士尼', 'disney', '儿童故事', '梦幻'] }
]

/**
 * 信息图风格关键词匹配规则
 */
export const INFOGRAPHIC_STYLE_KEYWORDS: StyleKeywordRule[] = [
  { id: 'craft-handmade', keywords: ['手绘', '手工', '插画', '温馨', '可爱', '生活', '日常'] },
  { id: 'claymation', keywords: ['粘土', '3d', '立体', '趣味', '动画', '角色'] },
  { id: 'kawaii', keywords: ['可爱', '日系', '粉彩', '少女', '萌', '卡哇伊'] },
  { id: 'storybook-watercolor', keywords: ['水彩', '童话', '绘本', '故事', '柔和', '温暖'] },
  { id: 'chalkboard', keywords: ['黑板', '教学', '课堂', '粉笔', '老师', '学校', '培训'] },
  { id: 'cyberpunk-neon', keywords: ['霓虹', '赛博', '未来', '科技', '暗黑', '夜景', 'ai', '人工智能'] },
  { id: 'bold-graphic', keywords: ['漫画', '冲击', '警告', '重要', '强调', '高对比'] },
  { id: 'aged-academia', keywords: ['复古', '学术', '历史', '经典', '文献', '论文'] },
  { id: 'corporate-memphis', keywords: ['商务', '企业', '现代', '扁平', '职场', '商业'] },
  { id: 'technical-schematic', keywords: ['技术', '工程', '蓝图', '架构', '系统', '原理图'] },
  { id: 'origami', keywords: ['折纸', '几何', '简约', '创意', '艺术'] },
  { id: 'pixel-art', keywords: ['像素', '游戏', '复古', '8bit', '开发者', '程序'] },
  { id: 'ui-wireframe', keywords: ['界面', '线框', 'ui', 'ux', '原型', '设计'] },
  { id: 'subway-map', keywords: ['地铁', '线路', '交通', '路径', '流程'] },
  { id: 'ikea-manual', keywords: ['说明书', '指南', '步骤', '组装', '极简'] },
  { id: 'knolling', keywords: ['俯视', '整理', '物品', '陈列', '收纳'] },
  { id: 'lego-brick', keywords: ['积木', '乐高', '拼搭', '模块', '构建'] }
]

/**
 * 小红书风格关键词匹配规则
 */
export const XHS_STYLE_KEYWORDS: StyleKeywordRule[] = [
  { id: 'cute', keywords: ['美妆', '护肤', '化妆', '穿搭', '时尚', '少女', '女孩', '粉', 'pink', 'cute', 'girly'] },
  { id: 'fresh', keywords: ['健康', '养生', '自律', '清新', '自然', '轻食', 'wellness', 'self-care', 'organic', 'clean'] },
  { id: 'tech', keywords: ['ai', 'aigc', 'llm', '大模型', '人工智能', '算法', '数据', '编程', '代码', '开发', 'app', '工具', 'tool', '效率', '生产力'] },
  { id: 'warm', keywords: ['生活', '故事', '情绪', '情感', '成长', '治愈', '陪伴', '关系', '日常', '温暖'] },
  { id: 'bold', keywords: ['警告', '重要', '必须', '避坑', '踩坑', '别再', '风险', '注意', '必看', '必收藏'] },
  { id: 'minimal', keywords: ['极简', '简洁', '高级', '干净', '专业', '商务', '职场', '策略', '复盘'] },
  { id: 'retro', keywords: ['复古', '怀旧', '经典', '老派', 'vintage', 'retro', '年代'] },
  { id: 'pop', keywords: ['惊呆', '震惊', '炸裂', '上头', '好玩', '有趣', 'fun', 'wow', 'amazing', '爆款', '种草'] },
  { id: 'notion', keywords: ['知识', '概念', '方法论', '生产力', '效率', '笔记', '总结', '框架', 'saaS', 'notion'] },
  { id: 'chalkboard', keywords: ['教程', '教学', '课堂', '学习', '培训', '讲解', '干货', '笔记', '知识点', '学校', '老师'] }
]

/**
 * 通用的风格关键词匹配函数
 * @param text 待匹配的文本
 * @param rules 关键词规则数组
 * @param defaultId 默认风格 ID
 * @returns 匹配到的最佳风格 ID
 */
export function matchBestStyleId(
  text: string,
  rules: StyleKeywordRule[],
  defaultId: string
): string {
  const normalizedText = text.trim().toLowerCase()
  if (!normalizedText) return defaultId

  let bestId = defaultId
  let bestScore = 0

  for (const rule of rules) {
    let score = 0
    for (const kw of rule.keywords) {
      if (!kw) continue
      if (normalizedText.includes(kw.toLowerCase())) {
        score += 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestId = rule.id
    }
  }

  return bestId
}
