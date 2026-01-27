import type { LayoutPreset } from './types'

/**
 * 信息图布局预设
 * 用于 InfographicPage
 */
export const INFOGRAPHIC_LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'bento-grid',
    name: '便当盒网格（默认）',
    desc: '多主题概览，模块化布局',
    bestFor: '多个独立要点、概览总结、功能介绍',
    keyPoints: ['网格分区', '模块独立', '视觉平衡', '灵活组合']
  },
  {
    id: 'linear-progression',
    name: '线性进程',
    desc: '时间线、步骤流程',
    bestFor: '教程、历史时间线、阶段性过程',
    keyPoints: ['左右/上下流动', '箭头连接', '编号步骤', '起点终点明确']
  },
  {
    id: 'binary-comparison',
    name: '二元对比',
    desc: 'A vs B 左右对照',
    bestFor: '对比分析、优缺点、前后变化',
    keyPoints: ['左右分栏', '中线分隔', '对应项对齐', '差异高亮']
  },
  {
    id: 'comparison-matrix',
    name: '对比矩阵',
    desc: '多因素多维度对比',
    bestFor: '产品对比、方案评估、特性矩阵',
    keyPoints: ['表格结构', '行列对应', '勾叉图标', '总结行']
  },
  {
    id: 'hierarchical-layers',
    name: '层级金字塔',
    desc: '金字塔、同心圆、优先级',
    bestFor: '重要性层级、马斯洛需求、优先级排序',
    keyPoints: ['上窄下宽', '层级递进', '颜色区分', '标签清晰']
  },
  {
    id: 'tree-branching',
    name: '树形分支',
    desc: '分类、分支、决策树',
    bestFor: '分类体系、决策流程、组织架构',
    keyPoints: ['根节点中心', '分支延伸', '叶节点详情', '连接线清晰']
  },
  {
    id: 'hub-spoke',
    name: '中心辐射',
    desc: '中心概念+周边关联',
    bestFor: '核心概念解析、关系网络、生态系统',
    keyPoints: ['中心突出', '辐射连接', '周边均匀', '关系标注']
  },
  {
    id: 'structural-breakdown',
    name: '结构拆解',
    desc: '爆炸图、剖面图、部件标注',
    bestFor: '产品结构、系统组成、解剖说明',
    keyPoints: ['主体居中', '部件分离', '引线标注', '层次分明']
  },
  {
    id: 'iceberg',
    name: '冰山模型',
    desc: '表面 vs 深层',
    bestFor: '表象与本质、显性与隐性、问题根源',
    keyPoints: ['水面分割', '上小下大', '层级递进', '深浅对比']
  },
  {
    id: 'bridge',
    name: '桥梁跨越',
    desc: '问题-解决方案、差距-跨越',
    bestFor: '问题解决、目标达成、转型过程',
    keyPoints: ['两端对比', '桥梁连接', '跨越可视', '前后变化']
  },
  {
    id: 'funnel',
    name: '漏斗模型',
    desc: '转化流程、筛选过程',
    bestFor: '销售漏斗、用户转化、筛选机制',
    keyPoints: ['上宽下窄', '层层递进', '数据标注', '转化率']
  },
  {
    id: 'isometric-map',
    name: '等距地图',
    desc: '空间关系、位置布局',
    bestFor: '场景展示、空间布局、流程地图',
    keyPoints: ['等距视角', '3D效果', '路径引导', '区域划分']
  },
  {
    id: 'dashboard',
    name: '仪表盘',
    desc: '指标、KPI、数据展示',
    bestFor: '数据报告、业绩展示、监控面板',
    keyPoints: ['数字突出', '图表组合', '色彩编码', '实时感']
  },
  {
    id: 'periodic-table',
    name: '元素周期表',
    desc: '分类集合、元素归类',
    bestFor: '工具集合、元素分类、资源清单',
    keyPoints: ['网格排列', '色彩分类', '简短标签', '系统性']
  },
  {
    id: 'comic-strip',
    name: '漫画条',
    desc: '叙事序列、场景故事',
    bestFor: '故事叙述、场景演示、用户旅程',
    keyPoints: ['分格布局', '时间序列', '角色一致', '对话气泡']
  },
  {
    id: 'story-mountain',
    name: '故事山',
    desc: '情节结构、张力曲线',
    bestFor: '故事结构、情绪曲线、事件发展',
    keyPoints: ['起承转合', '高潮突出', '曲线可视', '节点标注']
  },
  {
    id: 'jigsaw',
    name: '拼图组合',
    desc: '互联部件、整体构成',
    bestFor: '要素组合、能力拼图、完整构成',
    keyPoints: ['拼图形状', '互锁关系', '整体呈现', '缺一不可']
  },
  {
    id: 'venn-diagram',
    name: '韦恩图',
    desc: '重叠关系、交集概念',
    bestFor: '概念关系、共同点、差异与交集',
    keyPoints: ['圆形重叠', '交集突出', '标签清晰', '颜色区分']
  },
  {
    id: 'winding-roadmap',
    name: '蜿蜒路线图',
    desc: '旅程、里程碑、发展路径',
    bestFor: '发展规划、学习路径、项目里程碑',
    keyPoints: ['蜿蜒曲线', '节点标记', '里程碑', '起终点']
  },
  {
    id: 'circular-flow',
    name: '循环流程',
    desc: '循环过程、闭环系统',
    bestFor: '生命周期、循环机制、持续过程',
    keyPoints: ['圆形闭环', '箭头流向', '阶段划分', '循环可视']
  }
]
