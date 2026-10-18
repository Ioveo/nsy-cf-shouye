import { useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  Sparkles,
  Minus,
  Palette,
  Loader2,
  ChevronDown,
  Package,
  Music,
  FolderOpen,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { R2AssetPickerDialog } from './r2-asset-picker-dialog'
import { EmbedSoftwareDialog } from './embed-software-dialog'
import { EmbedMusicDialog } from './embed-music-dialog'
import { TemplatePickerDropdown } from './template-picker-dropdown'

interface WorkbenchToolbarProps {
  onInsertWrap: (prefix: string, suffix: string, defaultText: string) => void
  onInsertHeading: (prefix: string) => void
  onInsertText: (text: string) => void
}

const COLOR_PRESETS = [
  { name: '极光金 (品牌)', value: '#E5A93C', bg: 'bg-[#E5A93C]' },
  { name: '科技青 (高亮)', value: '#38BDF8', bg: 'bg-[#38BDF8]' },
  { name: '翡翠绿 (成功)', value: '#34D399', bg: 'bg-[#34D399]' },
  { name: '珊瑚红 (警示)', value: '#F87171', bg: 'bg-[#F87171]' },
  { name: '银月灰 (低调)', value: '#94A3B8', bg: 'bg-[#94A3B8]' },
]

export function WorkbenchToolbar({
  onInsertWrap,
  onInsertHeading,
  onInsertText,
}: WorkbenchToolbarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Dialog states for Eco-System Closed Loop
  const [r2PickerOpen, setR2PickerOpen] = useState(false)
  const [softwareEmbedOpen, setSoftwareEmbedOpen] = useState(false)
  const [musicEmbedOpen, setMusicEmbedOpen] = useState(false)

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const toastId = toast.loading(`正在上传图片 ${file.name}...`)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
      if (res.success && res.url) {
        toast.success('图片上传成功', { id: toastId })
        const snippet = `\n\n![${file.name.replace(/\.[^.]+$/, '')}](${res.url})\n\n`
        onInsertText(snippet)
      } else {
        toast.error(res.msg || '上传失败', { id: toastId })
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`, { id: toastId })
    } finally {
      setIsUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }



  function handleInsertR2Image(url: string, name?: string) {
    const title = name ? name.replace(/\.[^.]+$/, '') : '插图'
    onInsertText(`\n\n![${title}](${url})\n\n`)
    toast.success('已从 R2 媒体库插入图片')
  }

  return (
    <>
      <div className='border-b border-border bg-muted/30 px-3 sm:px-4 py-1.5 flex items-center gap-1 flex-wrap sticky top-0 z-20 backdrop-blur-sm select-none'>
        {/* 1. 标题组 */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertHeading('# ')}
            title='一级大标题 (H1)'
          >
            <Heading1 className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertHeading('## ')}
            title='二级分类标题 (H2)'
          >
            <Heading2 className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertHeading('### ')}
            title='三级小标题 (H3)'
          >
            <Heading3 className='size-3.5' />
          </Button>
        </div>

        {/* 2. 行内排版组 */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('**', '**', '加粗文字')}
            title='加粗 (Ctrl+B)'
          >
            <Bold className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('*', '*', '斜体文字')}
            title='斜体 (Ctrl+I)'
          >
            <Italic className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('<u>', '</u>', '下划线文字')}
            title='下划线 (<u>)'
          >
            <UnderlineIcon className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('~~', '~~', '删除线文字')}
            title='删除线 (~~)'
          >
            <Strikethrough className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('`', '`', '行内代码')}
            title='行内代码 (`code`)'
          >
            <Code className='size-3.5' />
          </Button>
        </div>

        {/* 3. 颜色高亮组 */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground'
                title='设置文字颜色'
              >
                <Palette className='size-3.5 text-primary' />
                <span className='text-[11px] hidden sm:inline'>文字色</span>
                <ChevronDown className='size-2.5 opacity-60' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-48'>
              <DropdownMenuLabel className='text-[11px] text-muted-foreground'>选择品牌强调色</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLOR_PRESETS.map((color) => (
                <DropdownMenuItem
                  key={color.value}
                  onClick={() =>
                    onInsertWrap(
                      `<span style="color: ${color.value}; font-weight: 600;">`,
                      '</span>',
                      '高亮文字'
                    )
                  }
                  className='flex items-center gap-2 cursor-pointer text-xs'
                >
                  <span className={`size-3 rounded-full ${color.bg}`} />
                  <span>{color.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onInsertWrap('<mark class="article-mark">', '</mark>', '标记重点')}
                className='flex items-center gap-2 cursor-pointer text-xs'
              >
                <span className='px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded text-[10px] font-mono'>MARK</span>
                <span>荧光马克笔底色</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 4. 段落与结构组 */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('> ', '', '在这里输入引言...')}
            title='引用段落 (>)'
          >
            <Quote className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('- ', '', '列表条目')}
            title='无序列表 (-)'
          >
            <List className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertWrap('1. ', '', '有序条目')}
            title='有序列表 (1.)'
          >
            <ListOrdered className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={() => onInsertText('\n<hr class="article-divider" />\n')}
            title='插入微光分割线'
          >
            <Minus className='size-3.5' />
          </Button>
        </div>

        {/* 5. 图片管理（支持 R2 图片库选择 + 本地直传 R2） */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={isUploading}
                className='h-7 px-2 text-xs gap-1 text-foreground'
                title='插入图片 (支持从 R2 媒体库调用或本地上传)'
              >
                {isUploading ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <ImageIcon className='size-3.5 text-primary' />
                )}
                <span className='text-[11px] font-medium'>插图</span>
                <ChevronDown className='size-2.5 opacity-60' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-48'>
              <DropdownMenuItem
                onClick={() => setR2PickerOpen(true)}
                className='flex items-center gap-2 cursor-pointer text-xs font-medium'
              >
                <FolderOpen className='size-3.5 text-primary' />
                <span>从 R2 媒体库选择</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => imageInputRef.current?.click()}
                className='flex items-center gap-2 cursor-pointer text-xs'
              >
                <Upload className='size-3.5 text-muted-foreground' />
                <span>本地上传并存入 R2</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={imageInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleImageFile}
          />
        </div>

        {/* 6. 生态闭环：引用软件中心 */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setSoftwareEmbedOpen(true)}
            className='h-7 px-2 text-xs gap-1 text-foreground hover:text-primary transition-colors'
            title='在正文中引用自研软件卡片（闭环下载转化）'
          >
            <Package className='size-3.5 text-primary' />
            <span className='text-[11px] font-medium'>引用软件</span>
          </Button>
        </div>

        {/* 7. 生态闭环：引用音乐频道 */}
        <div className='flex items-center gap-0.5 border-r border-border/70 pr-2 mr-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setMusicEmbedOpen(true)}
            className='h-7 px-2 text-xs gap-1 text-foreground hover:text-primary transition-colors'
            title='在正文中引用音乐频道歌曲（边听边读）'
          >
            <Music className='size-3.5 text-primary' />
            <span className='text-[11px] font-medium'>引用音乐</span>
          </Button>
        </div>

        {/* 8. 微信公众号与高级排版样式库 (支持分类、产品图文与自定义模板) */}
        <TemplatePickerDropdown onInsertText={onInsertText} />
      </div>

      {/* R2 Image Picker Dialog */}
      <R2AssetPickerDialog
        open={r2PickerOpen}
        onClose={() => setR2PickerOpen(false)}
        onSelect={handleInsertR2Image}
        title='从 R2 媒体库调用图片'
        selectButtonText='插入正文'
      />

      {/* Software Embed Dialog */}
      <EmbedSoftwareDialog
        open={softwareEmbedOpen}
        onClose={() => setSoftwareEmbedOpen(false)}
        onInsert={(snippet) => {
          onInsertText(snippet)
          toast.success('已插入自研软件互动推荐卡片')
        }}
      />

      {/* Music Embed Dialog */}
      <EmbedMusicDialog
        open={musicEmbedOpen}
        onClose={() => setMusicEmbedOpen(false)}
        onInsert={(snippet) => {
          onInsertText(snippet)
          toast.success('已插入音乐播放卡片')
        }}
      />
    </>
  )
}
