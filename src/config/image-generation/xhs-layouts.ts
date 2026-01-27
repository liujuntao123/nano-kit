import type { XHSLayoutPreset } from './types'

/**
 * 小红书布局预设
 * 用于 XHSImagesPage
 */
export const XHS_LAYOUT_PRESETS: XHSLayoutPreset[] = [
  {
    id: 'sparse',
    name: '稀疏',
    desc: '信息少，冲击强',
    bestFor: '封面/结尾、1-2 个重点',
    keyPoints: ['1-2 个重点', '留白 50%+', '大标题/大图标', '强视觉中心']
  },
  {
    id: 'balanced',
    name: '平衡',
    desc: '标准卡片结构',
    bestFor: '3-4 个要点、常规内容页',
    keyPoints: ['3-4 个要点', '结构清晰', '图文平衡', '易阅读']
  },
  {
    id: 'dense',
    name: '密集',
    desc: '高信息密度干货卡',
    bestFor: '5-8 个要点、总结/清单/速查',
    keyPoints: ['5-8 个要点', '分区网格', '信息层级强', '留白 20-30%']
  },
  {
    id: 'list',
    name: '列表',
    desc: '枚举/排行结构',
    bestFor: '4-7 项清单、工具推荐',
    keyPoints: ['编号列表', '每项 1 行核心', '统一结构', '高亮关键词']
  },
  {
    id: 'comparison',
    name: '对比',
    desc: '左右对照',
    bestFor: 'A/B 对比、优缺点、前后变化',
    keyPoints: ['左右分栏', '对照清晰', '差异高亮', '同维度对齐']
  },
  {
    id: 'flow',
    name: '流程',
    desc: '步骤/时间线',
    bestFor: '3-6 步流程、方法/教程',
    keyPoints: ['步骤编号', '箭头引导', '一步一图标', '起承转合']
  }
]
