import type { ArticleStylePreset } from './types'

/**
 * 小红书风格预设
 * 用于 XHSImagesPage
 * 注意：使用 ArticleStylePreset 类型，因为结构相同
 */
export const XHS_STYLE_PRESETS: ArticleStylePreset[] = [
  {
    id: 'cute',
    name: '甜美可爱（默认）',
    desc: '小红书经典甜酷少女感',
    bestFor: '美妆/穿搭/生活方式/日常小技巧',
    reference: {
      colors: ['粉色 (#FED7E2)', '蜜桃 (#FEEBC8)', '薄荷绿 (#C6F6D5)', '薰衣草紫 (#E9D8FD)'],
      background: ['奶油白 (#FFFAF0)', '柔粉 (#FFF5F7)'],
      accents: ['亮粉', '珊瑚色'],
      elements: ['爱心', '星星', '闪光', '贴纸风元素', '可爱表情', '丝带装饰', 'emoji图标']
    },
    palette: { primary: '#FED7E2', background: '#FFFAF0', accent: '#F56565' },
    previewBg: '/xhs/cute.webp'
  },
  {
    id: 'fresh',
    name: '清新自然',
    desc: '干净、清爽、呼吸感强',
    bestFor: '健康/养生/自律/极简生活/自我关怀',
    reference: {
      colors: ['薄荷绿 (#9AE6B4)', '天空蓝 (#90CDF4)', '浅黄 (#FAF089)'],
      background: ['纯白 (#FFFFFF)', '柔薄荷 (#F0FFF4)'],
      accents: ['叶绿', '水蓝'],
      elements: ['植物叶片', '云朵', '水滴', '简单几何', '大留白/开放式构图']
    },
    palette: { primary: '#9AE6B4', background: '#FFFFFF', accent: '#90CDF4' },
    previewBg: '/xhs/fresh.webp'
  },
  {
    id: 'tech',
    name: '科技数码',
    desc: '现代、聪明、数字感',
    bestFor: 'AI/工具推荐/效率方法/数码产品',
    reference: {
      colors: ['深蓝 (#1A365D)', '紫色 (#6B46C1)', '电光青 (#00D4FF)'],
      background: ['深灰 (#1A202C)', '近黑 (#0D1117)'],
      accents: ['霓虹绿 (#00FF88)', '电蓝'],
      elements: ['电路纹理', '数据图标', '几何网格', '微发光效果', '科技装饰线']
    },
    palette: { primary: '#1A365D', background: '#0D1117', accent: '#00D4FF' },
    previewBg: '/xhs/tech.jpeg'
  },
  {
    id: 'warm',
    name: '温暖治愈',
    desc: '松弛、友好、亲和',
    bestFor: '生活感悟/个人故事/情绪价值/关系与成长',
    reference: {
      colors: ['暖橙 (#ED8936)', '金黄 (#F6AD55)', '陶土橙 (#C05621)'],
      background: ['奶油白 (#FFFAF0)', '柔桃色 (#FED7AA)'],
      accents: ['深棕 (#744210)', '柔红'],
      elements: ['阳光光晕', '咖啡/生活小物', '暖光效果', '圆润装饰', '友好图标']
    },
    palette: { primary: '#ED8936', background: '#FFFAF0', accent: '#744210' },
    previewBg: '/xhs/warm.webp'
  },
  {
    id: 'bold',
    name: '强烈冲击',
    desc: '高对比、抓眼、强调重点',
    bestFor: '重要提醒/避坑/必看清单/高能结论',
    reference: {
      colors: ['亮红 (#E53E3E)', '明橙 (#DD6B20)', '电黄 (#F6E05E)'],
      background: ['纯黑 (#000000)', '深炭黑'],
      accents: ['白色', '霓虹黄'],
      elements: ['感叹号', '箭头', '警示图标', '强形状', '夸张对比', '戏剧化构图']
    },
    palette: { primary: '#E53E3E', background: '#000000', accent: '#F6E05E' },
    previewBg: '/xhs/bold.webp'
  },
  {
    id: 'minimal',
    name: '极简高级',
    desc: '克制、干净、有质感',
    bestFor: '严肃内容/职业建议/表达清晰的总结卡',
    reference: {
      colors: ['纯黑 (#000000)', '纯白 (#FFFFFF)'],
      background: ['微灰 (#FAFAFA)', '纯白'],
      accents: ['单一强调色（从内容中选取）'],
      elements: ['细线条', '单一视觉中心', '最大留白', '极简装饰']
    },
    palette: { primary: '#000000', background: '#FAFAFA', accent: '#3B82F6' },
    previewBg: '/xhs/minimal.webp'
  },
  {
    id: 'retro',
    name: '复古怀旧',
    desc: '复古潮流、旧报纸/做旧纸感',
    bestFor: '怀旧内容/经典建议/复盘总结',
    reference: {
      colors: ['做旧橙（muted orange）', '灰粉 (#FED7E2 70%)', '复古青（faded teal）'],
      background: ['做旧纸 (#F5E6D3)', '棕褐/sepia'],
      accents: ['褪色红', '复古金'],
      elements: ['半色调点阵', '复古徽章', '胶带效果', '做旧纹理叠层']
    },
    palette: { primary: '#DD6B20', background: '#F5E6D3', accent: '#C9A962' },
    previewBg: '/xhs/retro.webp'
  },
  {
    id: 'pop',
    name: '潮流爆款',
    desc: '高饱和、活力、漫画感',
    bestFor: '强互动/有趣知识/热点玩法/教程吸睛版',
    reference: {
      colors: ['亮红 (#F56565)', '亮黄 (#ECC94B)', '亮蓝 (#4299E1)', '亮绿 (#48BB78)'],
      background: ['白色 (#FFFFFF)', '浅灰'],
      accents: ['霓虹粉', '电紫'],
      elements: ['漫画气泡', '爆炸星芒', '粗线条形状', '动态构图', '高能效果贴纸']
    },
    palette: { primary: '#F56565', background: '#FFFFFF', accent: '#805AD5' },
    previewBg: '/xhs/pop.webp'
  },
  {
    id: 'notion',
    name: '知识手绘',
    desc: '极简线稿、知识卡片感',
    bestFor: '知识分享/概念解释/生产力/效率技巧',
    reference: {
      colors: ['黑色 (#1A1A1A)', '深灰 (#4A4A4A)'],
      background: ['纯白 (#FFFFFF)', '微灰 (#FAFAFA)'],
      accents: ['粉彩蓝 (#A8D4F0)', '粉彩黄 (#F9E79F)', '粉彩粉 (#FADBD8)'],
      elements: ['简线涂鸦', '轻微手绘抖动', '几何形状', '火柴人', '最大留白']
    },
    palette: { primary: '#1A1A1A', background: '#FFFFFF', accent: '#A8D4F0' },
    previewBg: '/xhs/notion.webp'
  },
  {
    id: 'chalkboard',
    name: '黑板教学',
    desc: '粉笔手绘、课堂感、知识传递',
    bestFor: '教程/知识分享/学习笔记/干货总结',
    reference: {
      colors: ['白色粉笔', '黄色粉笔', '橙色粉笔', '淡绿色粉笔'],
      background: ['深灰黑板 (#2D3748)', '墨绿黑板 (#1A4731)'],
      accents: ['彩色粉笔高亮'],
      elements: ['粉笔线条', '板书效果', '擦除痕迹', '简笔画', '手写公式']
    },
    palette: { primary: '#FFFFFF', background: '#2D3748', accent: '#F6E05E' },
    previewBg: '/xhs/chalkboard.webp'
  }
]
