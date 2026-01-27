import type { ArticleStylePreset } from './types'

/**
 * 文章配图风格预设
 * 用于 ArticleIllustrationPage
 */
export const ARTICLE_STYLE_PRESETS: ArticleStylePreset[] = [
  {
    id: 'notion',
    name: '知识手绘（默认）',
    desc: '极简线稿、知识感、留白',
    bestFor: '知识分享、概念解释、生产力/效率类内容',
    reference: {
      colors: ['黑色 (#1A1A1A)', '深灰 (#4A4A4A)'],
      background: ['纯白 (#FFFFFF)', '微灰 (#FAFAFA)'],
      accents: ['粉彩蓝 (#A8D4F0)', '粉彩黄 (#F9E79F)', '粉彩粉 (#FADBD8)'],
      elements: ['简线涂鸦', '轻微手绘抖动', '几何形状', '火柴人', '最大留白']
    },
    palette: { primary: '#1A1A1A', background: '#FFFFFF', accent: '#A8D4F0' },
    previewBg: '/article/notion.webp'
  },
  {
    id: 'elegant',
    name: '优雅专业',
    desc: '精致克制、专业高级',
    bestFor: '专业文章、商业分析、策略/方法论类内容',
    reference: {
      colors: ['柔珊瑚粉 (#E8A598)', '柔青绿 (#5B8A8A)', '雾玫瑰粉 (#D4A5A5)'],
      background: ['暖奶油白 (#F5F0E6)', '柔米色'],
      accents: ['金色 (#C9A962)', '铜色'],
      elements: ['细腻线稿', '精致小图标', '轻微渐变', '平衡留白']
    },
    palette: { primary: '#E8A598', background: '#F5F0E6', accent: '#C9A962' },
    previewBg: '/article/elegant.webp'
  },
  {
    id: 'warm',
    name: '温暖亲和',
    desc: '温柔、友好、有人情味',
    bestFor: '个人成长、生活方式、教育、情感故事类内容',
    reference: {
      colors: ['暖橙 (#ED8936)', '金黄 (#F6AD55)', '陶土橙 (#C05621)'],
      background: ['奶油白 (#FFFAF0)', '柔桃色 (#FED7AA)'],
      accents: ['深棕 (#744210)', '柔红'],
      elements: ['圆润形状', '友好角色', '阳光/光晕元素', '爱心', '温馨灯光']
    },
    palette: { primary: '#ED8936', background: '#FFFAF0', accent: '#744210' },
    previewBg: '/article/warm.webp'
  },
  {
    id: 'minimal',
    name: '极简留白',
    desc: '干净、克制、聚焦核心',
    bestFor: '哲学/思考、极简主义、强调要点的解释类内容',
    reference: {
      colors: ['纯黑 (#000000)', '纯白 (#FFFFFF)'],
      background: ['白色或微灰 (#FAFAFA)'],
      accents: ['单一强调色（从内容中选取）'],
      elements: ['单一主体', '最大留白', '细线条', '简洁几何']
    },
    palette: { primary: '#000000', background: '#FAFAFA', accent: '#3B82F6' },
    previewBg: '/article/minimal.webp'
  },
  {
    id: 'playful',
    name: '活泼童趣',
    desc: '轻松好玩、涂鸦感',
    bestFor: '教程/入门/新手向、轻松内容、趣味主题',
    reference: {
      colors: ['粉彩粉 (#FED7E2)', '薄荷绿 (#C6F6D5)', '薰衣草紫 (#E9D8FD)', '天空蓝 (#BEE3F8)'],
      background: ['奶油黄 (#FFFBEB)', '柔白'],
      accents: ['亮黄', '珊瑚色', '松石绿'],
      elements: ['涂鸦', '星星', '旋涡', '可爱角色', '对话框']
    },
    palette: { primary: '#FED7E2', background: '#FFFBEB', accent: '#2DD4BF' },
    previewBg: '/article/playful.webp'
  },
  {
    id: 'nature',
    name: '自然治愈',
    desc: '有机、平静、自然纹理',
    bestFor: '健康/养生、环保、户外、慢生活、自然类内容',
    reference: {
      colors: ['森林绿 (#276749)', '鼠尾草绿 (#9AE6B4)', '土棕 (#744210)'],
      background: ['沙米色 (#F5E6D3)', '天空蓝 (#E0F2FE)'],
      accents: ['日落橙', '水蓝'],
      elements: ['植物元素', '自然纹理', '流动线条', '有机形状']
    },
    palette: { primary: '#276749', background: '#F5E6D3', accent: '#E0F2FE' },
    previewBg: '/article/nature.webp'
  },
  {
    id: 'sketch',
    name: '草图笔记',
    desc: '手稿感、过程感、像在纸上推演',
    bestFor: '思考过程、脑暴、概念草稿、想法整理',
    reference: {
      colors: ['铅笔灰 (#4A5568)', '纸白 (#FAFAFA)', '少量彩色高亮'],
      background: ['纸张纹理白 (#F7FAFC)'],
      accents: ['单一高亮色（蓝/红/黄）'],
      elements: ['粗糙线条', '箭头', '手写笔记感', '涂改痕迹']
    },
    palette: { primary: '#4A5568', background: '#F7FAFC', accent: '#60A5FA' },
    previewBg: '/article/sketch.webp'
  },
  {
    id: 'watercolor',
    name: '水彩艺术',
    desc: '柔和艺术、自然温暖',
    bestFor: '生活方式、旅行、创意、艺术类内容',
    reference: {
      colors: ['柔粉 (#FBBBC8)', '淡蓝 (#A8D8EA)', '浅绿 (#CBE4C9)', '淡紫 (#D7C4E4)'],
      background: ['水彩纸白 (#FFFEF7)', '柔米色 (#FFF8E7)'],
      accents: ['深靛蓝', '暖棕'],
      elements: ['水彩晕染', '柔和边缘', '渐变效果', '自然流动', '花卉点缀']
    },
    palette: { primary: '#FBBBC8', background: '#FFFEF7', accent: '#6B7FD7' },
    previewBg: '/article/watercolor.webp'
  },
  {
    id: 'vintage',
    name: '复古怀旧',
    desc: '做旧纸张、历史感、探险风',
    bestFor: '历史、传记、文化遗产、探险类内容',
    reference: {
      colors: ['棕褐色 (#8B7355)', '复古橙 (#D4A574)', '深棕 (#5D4037)'],
      background: ['做旧纸 (#F5E6D3)', '羊皮纸色 (#FAEBD7)'],
      accents: ['复古金', '深红'],
      elements: ['做旧纹理', '复古徽章', '羽毛笔元素', '地图装饰', '邮票效果']
    },
    palette: { primary: '#8B7355', background: '#F5E6D3', accent: '#C9A962' },
    previewBg: '/article/vintage.webp'
  },
  {
    id: 'scientific',
    name: '科学学术',
    desc: '学术精确、图解风格',
    bestFor: '生物、化学、医学、科研类内容',
    reference: {
      colors: ['深蓝 (#1A365D)', '白色', '浅灰 (#E2E8F0)'],
      background: ['纯白 (#FFFFFF)', '淡蓝 (#F0F9FF)'],
      accents: ['科学蓝 (#3182CE)', '生物绿 (#38A169)'],
      elements: ['精确线条', '标注箭头', '图例说明', '网格背景', '数据图表']
    },
    palette: { primary: '#1A365D', background: '#FFFFFF', accent: '#3182CE' },
    previewBg: '/article/scientific.webp'
  },
  {
    id: 'chalkboard',
    name: '黑板粉笔',
    desc: '课堂感、教学风格',
    bestFor: '教育、教程、工作坊、培训类内容',
    reference: {
      colors: ['白色粉笔', '黄色粉笔', '橙色粉笔', '淡绿色粉笔'],
      background: ['深灰黑板 (#2D3748)', '墨绿黑板 (#1A4731)'],
      accents: ['彩色粉笔高亮'],
      elements: ['粉笔线条', '板书效果', '擦除痕迹', '简笔画', '手写公式']
    },
    palette: { primary: '#FFFFFF', background: '#2D3748', accent: '#F6E05E' },
    previewBg: '/article/chalkboard.webp'
  },
  {
    id: 'editorial',
    name: '杂志信息图',
    desc: '杂志风格、视觉叙事',
    bestFor: '科技解释、新闻深度、调查报道类内容',
    reference: {
      colors: ['深黑 (#1A1A1A)', '白色', '强调红 (#E53E3E)'],
      background: ['纯白 (#FFFFFF)', '浅灰 (#F7FAFC)'],
      accents: ['品牌蓝', '数据橙'],
      elements: ['信息图表', '数据可视化', '清晰图标', '模块化布局', '引用框']
    },
    palette: { primary: '#1A1A1A', background: '#FFFFFF', accent: '#E53E3E' },
    previewBg: '/article/editorial.webp'
  },
  {
    id: 'flat',
    name: '现代扁平',
    desc: '现代、数字、当代风格',
    bestFor: '创业公司、数字产品、当代市场类内容',
    reference: {
      colors: ['品牌蓝 (#4299E1)', '活力橙 (#ED8936)', '清新绿 (#48BB78)'],
      background: ['纯白 (#FFFFFF)', '浅灰 (#F7FAFC)'],
      accents: ['渐变色', '鲜艳点缀'],
      elements: ['扁平图标', '几何形状', '简洁线条', '2.5D效果', '渐变背景']
    },
    palette: { primary: '#4299E1', background: '#FFFFFF', accent: '#ED8936' },
    previewBg: '/article/flat.webp'
  },
  {
    id: 'flat-doodle',
    name: '扁平涂鸦',
    desc: '粗线条、粉彩色、可爱圆润',
    bestFor: '生产力工具、SaaS、工作流程类内容',
    reference: {
      colors: ['粉彩蓝 (#BEE3F8)', '粉彩黄 (#FEFCBF)', '粉彩粉 (#FED7E2)', '粉彩绿 (#C6F6D5)'],
      background: ['纯白 (#FFFFFF)', '柔白 (#FFFEF7)'],
      accents: ['深色轮廓线', '阴影效果'],
      elements: ['粗黑轮廓', '圆润形状', '简化人物', '图标化元素', '对话气泡']
    },
    palette: { primary: '#4A5568', background: '#FFFFFF', accent: '#BEE3F8' },
    previewBg: '/article/flat-doodle.webp'
  },
  {
    id: 'retro',
    name: '复古流行',
    desc: '80s/90s振感、怀旧',
    bestFor: '流行文化、游戏、娱乐类内容',
    reference: {
      colors: ['霓虹粉 (#FF69B4)', '电青 (#00CED1)', '亮紫 (#9B59B6)', '柠檬黄 (#F1C40F)'],
      background: ['深紫 (#2C1E4A)', '深蓝 (#1A365D)'],
      accents: ['霓虹色', '渐变光效'],
      elements: ['半色调点阵', '复古徽章', '霓虹线条', '像素元素', '几何图案']
    },
    palette: { primary: '#FF69B4', background: '#2C1E4A', accent: '#00CED1' },
    previewBg: '/article/retro.webp'
  },
  {
    id: 'blueprint',
    name: '蓝图技术',
    desc: '技术图纸、工程精度',
    bestFor: '建筑、系统设计、基础设施类内容',
    reference: {
      colors: ['蓝图白 (#E8F4FF)', '深蓝线 (#1A365D)'],
      background: ['蓝图蓝 (#1E3A5F)', '深海蓝 (#0D2137)'],
      accents: ['亮白标注', '黄色高亮'],
      elements: ['精密线条', '技术标注', '尺寸标记', '网格背景', '等距视图']
    },
    palette: { primary: '#E8F4FF', background: '#1E3A5F', accent: '#F6E05E' },
    previewBg: '/article/blueprint.webp'
  },
  {
    id: 'vector-illustration',
    name: '矢量插画',
    desc: '扁平矢量、黑色轮廓、复古色彩',
    bestFor: '教育、创意、品牌类内容',
    reference: {
      colors: ['复古橙 (#E07B53)', '复古绿 (#4A9B7F)', '复古蓝 (#5B8DB8)', '复古黄 (#F2C94C)'],
      background: ['米白 (#FDF6E3)', '浅灰 (#F5F5F5)'],
      accents: ['深棕轮廓', '阴影效果'],
      elements: ['黑色粗轮廓', '扁平填充', '几何形状', '简化角色', '场景构图']
    },
    palette: { primary: '#E07B53', background: '#FDF6E3', accent: '#4A9B7F' },
    previewBg: '/article/vector-illustration.webp'
  },
  {
    id: 'sketch-notes',
    name: '手绘笔记',
    desc: '柔和手绘、温暖教育感',
    bestFor: '知识分享、教程、学习笔记类内容',
    reference: {
      colors: ['暖灰 (#6B7280)', '柔棕 (#A78B71)', '淡蓝 (#93C5FD)'],
      background: ['笔记纸白 (#FFFEF7)', '格纹纸 (#F9FAFB)'],
      accents: ['荧光黄高亮', '红色重点'],
      elements: ['手绘线条', '箭头连接', '气泡框', '图标符号', '手写字体']
    },
    palette: { primary: '#6B7280', background: '#FFFEF7', accent: '#FBBF24' },
    previewBg: '/article/sketch-notes.webp'
  },
  {
    id: 'pixel-art',
    name: '像素艺术',
    desc: '复古8位、游戏怀旧',
    bestFor: '游戏、技术、开发者类内容',
    reference: {
      colors: ['像素绿 (#00FF00)', '像素蓝 (#00BFFF)', '像素粉 (#FF69B4)', '像素黄 (#FFD700)'],
      background: ['深黑 (#0D0D0D)', '深蓝 (#1A1A2E)'],
      accents: ['霓虹色', '像素高亮'],
      elements: ['像素网格', '8位图形', '像素字体', '复古游戏元素', '扫描线效果']
    },
    palette: { primary: '#00FF00', background: '#0D0D0D', accent: '#00BFFF' },
    previewBg: '/article/pixel-art.webp'
  },
  {
    id: 'intuition-machine',
    name: '技术简报',
    desc: '技术文档、双语标签',
    bestFor: '学术、技术、研究、文档类内容',
    reference: {
      colors: ['深灰 (#374151)', '科技蓝 (#3B82F6)', '白色'],
      background: ['纯白 (#FFFFFF)', '浅灰 (#F9FAFB)'],
      accents: ['蓝色高亮', '红色标注'],
      elements: ['技术图表', '双语标签', '流程图', '数据表格', '引用标注']
    },
    palette: { primary: '#374151', background: '#FFFFFF', accent: '#3B82F6' },
    previewBg: '/article/intuition-machine.webp'
  },
  {
    id: 'fantasy-animation',
    name: '奇幻动画',
    desc: '吉卜力/迪士尼风格、魔幻',
    bestFor: '故事讲述、儿童、创意类内容',
    reference: {
      colors: ['天空蓝 (#87CEEB)', '草地绿 (#90EE90)', '暖阳橙 (#FFB347)', '云朵白 (#FFFAFA)'],
      background: ['天空渐变', '柔和色调'],
      accents: ['魔法金', '星光闪烁'],
      elements: ['柔和线条', '梦幻场景', '可爱角色', '自然元素', '魔法光效']
    },
    palette: { primary: '#87CEEB', background: '#FFFEF7', accent: '#FFB347' },
    previewBg: '/article/fantasy-animation.webp'
  },
  {
    id: 'bold',
    name: '强烈冲击',
    desc: '高对比、强能量、强调重点',
    bestFor: '强观点、提醒/警告、行动号召、重要结论',
    reference: {
      colors: ['亮红 (#E53E3E)', '明橙 (#DD6B20)', '电黄 (#F6E05E)'],
      background: ['纯黑 (#000000)', '深炭黑'],
      accents: ['白色', '霓虹高光'],
      elements: ['强形状', '强对比', '动态构图', '感叹号元素', '箭头元素']
    },
    palette: { primary: '#E53E3E', background: '#000000', accent: '#F6E05E' },
    previewBg: '/article/bold.jpeg'
  }
]
