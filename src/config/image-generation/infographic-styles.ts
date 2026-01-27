import type { InfographicStylePreset } from './types'

/**
 * 信息图风格预设
 * 用于 InfographicPage
 */
export const INFOGRAPHIC_STYLE_PRESETS: InfographicStylePreset[] = [
  {
    id: 'craft-handmade',
    name: '手工插画（默认）',
    tag: '手绘,纸艺,温馨',
    preview: '/infographic/craft-handmade.webp',
    background: '背景为柔和的纸张纹理或米白色。',
    visual_style: '「手工插画」风格的信息图，采用手绘插画和纸艺拼贴效果，线条柔和自然。',
    word_style: '标题使用手写体，正文使用清晰的手写风格，重点用彩色标注。',
    content_principle: '将抽象概念具象化为可爱的角色或生活物件。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '保持约30%的留白，营造温馨舒适的视觉感受。'
  },
  {
    id: 'claymation',
    name: '粘土动画',
    tag: '3D,黏土,趣味',
    preview: '/infographic/claymation.webp',
    background: '背景为柔和的纯色或渐变色。',
    visual_style: '「粘土动画」风格的信息图，采用3D粘土质感的角色和物件，圆润可爱。',
    word_style: '标题使用粗圆体，文字有立体浮雕效果。',
    content_principle: '将概念转化为可爱的粘土角色和场景。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '布局饱满但不拥挤，元素之间保持呼吸感。'
  },
  {
    id: 'kawaii',
    name: '卡哇伊',
    tag: '日系,可爱,粉彩',
    preview: '/infographic/kawaii.webp',
    background: '背景为粉彩色渐变或柔和的纯色。',
    visual_style: '「卡哇伊」风格的信息图，采用日式可爱插画风格，大眼睛角色，圆润线条。',
    word_style: '标题使用圆润可爱字体，配以表情符号和装饰性标点。',
    content_principle: '将信息转化为可爱的角色对话或场景互动。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '布局活泼，适当留白，点缀星星、爱心等装饰元素。'
  },
  {
    id: 'storybook-watercolor',
    name: '绘本水彩',
    tag: '水彩,童话,柔和',
    preview: '/infographic/storybook-watercolor.webp',
    background: '背景为水彩纸纹理，柔和的暖色调。',
    visual_style: '「绘本水彩」风格的信息图，采用柔和的水彩插画，色彩晕染自然。',
    word_style: '标题使用手写体，正文柔和清晰，整体有童话般的温馨感。',
    content_principle: '将信息融入故事场景，角色和场景具有叙事性。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '大量留白，水彩元素自然过渡到白色背景。'
  },
  {
    id: 'chalkboard',
    name: '黑板板书',
    tag: '黑板,粉笔,教学',
    preview: '/infographic/chalkboard.webp',
    background: '背景为深灰色或墨绿色的黑板质感，有真实的粉笔擦拭痕迹。',
    visual_style: '「黑板板书」风格的信息图，采用粉笔手绘线条和简笔画。',
    word_style: '标题使用大号白色粉笔字，重点用彩色粉笔高亮。',
    content_principle: '模拟老师在黑板上推演的场景，结构清晰，逻辑分明。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '板书区域留有适当边距，营造课堂现场感。'
  },
  {
    id: 'cyberpunk-neon',
    name: '赛博霓虹',
    tag: '霓虹,未来,暗黑',
    preview: '/infographic/cyberpunk-neon.webp',
    background: '背景为深黑色或深紫色，带有城市夜景元素。',
    visual_style: '「赛博霓虹」风格的信息图，采用霓虹发光效果，未来科技感。',
    word_style: '标题使用霓虹发光字体，文字有光晕效果。',
    content_principle: '将信息转化为科技界面或全息投影效果。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '深色背景大面积留白，霓虹元素点睛。'
  },
  {
    id: 'bold-graphic',
    name: '大胆图形',
    tag: '漫画,高对比,冲击',
    preview: '/infographic/bold-graphic.webp',
    background: '背景为纯白或纯色，强调对比度。',
    visual_style: '「大胆图形」风格的信息图，采用漫画风格，粗线条，半色调点阵效果。',
    word_style: '标题粗大醒目，使用漫画式字体，感叹号和动态效果。',
    content_principle: '用强烈的视觉冲击传达信息，适合警示和重点强调。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '高对比留白，突出核心信息。'
  },
  {
    id: 'aged-academia',
    name: '复古学术',
    tag: '复古,学术,棕褐',
    preview: '/infographic/aged-academia.webp',
    background: '背景为做旧的羊皮纸或棕褐色纸张纹理。',
    visual_style: '「复古学术」风格的信息图，采用棕褐色调的精细素描和图解。',
    word_style: '标题使用衬线字体，正文使用印刷风格，有学术文献感。',
    content_principle: '模拟古典学术文献的排版和插图风格。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '经典的页边距设计，有书籍装帧感。'
  },
  {
    id: 'corporate-memphis',
    name: '企业孟菲斯',
    tag: '扁平,商务,现代',
    preview: '/infographic/corporate-memphis.webp',
    background: '背景为纯白或浅色渐变。',
    visual_style: '「企业孟菲斯」风格的信息图，采用扁平化矢量人物，高饱和度色彩。',
    word_style: '标题使用现代无衬线字体，简洁专业。',
    content_principle: '用简化的人物和场景表达商业概念。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '干净的留白，模块化布局，现代商务感。'
  },
  {
    id: 'technical-schematic',
    name: '技术原理图',
    tag: '蓝图,工程,精密',
    preview: '/infographic/technical-schematic.webp',
    background: '背景为深蓝色或网格纸效果。',
    visual_style: '「技术原理图」风格的信息图，采用工程图纸风格，等距视图，精密标注。',
    word_style: '标题使用工程字体，标注清晰规范。',
    content_principle: '用技术图纸的方式精确呈现结构和流程。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '规范的图纸边距和标题栏。'
  },
  {
    id: 'origami',
    name: '折纸艺术',
    tag: '折纸,几何,简约',
    preview: '/infographic/origami.webp',
    background: '背景为纯净的浅色或渐变。',
    visual_style: '「折纸艺术」风格的信息图，采用折纸几何形状，有纸张折痕和阴影。',
    word_style: '标题简洁现代，与几何风格呼应。',
    content_principle: '用折纸形状表达概念，简约而有创意。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '大量留白，突出折纸元素的精致感。'
  },
  {
    id: 'pixel-art',
    name: '像素艺术',
    tag: '像素,复古,游戏',
    preview: '/infographic/pixel-art.webp',
    background: '背景为深色或复古游戏风格的场景。',
    visual_style: '「像素艺术」风格的信息图，采用8位像素风格的图形和角色。',
    word_style: '标题使用像素字体，复古游戏界面感。',
    content_principle: '将信息转化为游戏关卡或像素场景。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '像素风格的边框和背景，营造游戏氛围。'
  },
  {
    id: 'ui-wireframe',
    name: 'UI线框图',
    tag: '线框,界面,灰度',
    preview: '/infographic/ui-wireframe.webp',
    background: '背景为浅灰色网格或纯白。',
    visual_style: '「UI线框图」风格的信息图，采用灰度线框风格，模拟界面原型。',
    word_style: '标题使用系统字体，标注清晰规范。',
    content_principle: '用界面原型的方式呈现信息结构。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '规范的界面间距和对齐。'
  },
  {
    id: 'subway-map',
    name: '地铁线路图',
    tag: '线路,交通,彩色',
    preview: '/infographic/subway-map.webp',
    background: '背景为纯白或浅灰。',
    visual_style: '「地铁线路图」风格的信息图，采用彩色线路和站点标记。',
    word_style: '标题简洁，站点标签清晰规范。',
    content_principle: '将流程或关系转化为地铁线路图的形式。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '线路之间保持清晰间距。'
  },
  {
    id: 'ikea-manual',
    name: '宜家说明书',
    tag: '极简,线稿,说明',
    preview: '/infographic/ikea-manual.webp',
    background: '背景为纯白。',
    visual_style: '「宜家说明书」风格的信息图，采用极简线稿，无文字或少文字的图示说明。',
    word_style: '仅使用必要的编号和简短标签。',
    content_principle: '用图解方式一步步说明流程或结构。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '大量留白，每一步骤清晰分离。'
  },
  {
    id: 'knolling',
    name: '俯视整理',
    tag: '俯视,整齐,物品',
    preview: '/infographic/knolling.webp',
    background: '背景为纯色或木纹桌面。',
    visual_style: '「俯视整理」风格的信息图，采用俯视角度，物品整齐排列。',
    word_style: '标签清晰简洁，使用指示线标注。',
    content_principle: '将概念物化为具体物品的整齐陈列。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '物品之间保持均匀间距，整体有序。'
  },
  {
    id: 'lego-brick',
    name: '乐高积木',
    tag: '积木,拼搭,趣味',
    preview: '/infographic/lego-brick.webp',
    background: '背景为浅色或积木底板效果。',
    visual_style: '「乐高积木」风格的信息图，采用积木块的形式构建场景和图形。',
    word_style: '标题使用粗体字，有积木拼搭感。',
    content_principle: '将信息转化为积木拼搭的形式，模块化呈现。保留所有原始条目、流程、逻辑关系、数据和专业术语。',
    negative_space: '积木之间保持清晰的结构关系。'
  }
]
