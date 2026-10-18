import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  Loader2,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useCatalog, useLanding } from '@/lib/queries'
// @ts-ignore
import { formatBytes } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { WizardStepBasic } from './wizard-step-basic'
import { WizardStepMedia } from './wizard-step-media'
import { WizardStepPackages } from './wizard-step-packages'
import { WizardStepPublish } from './wizard-step-publish'
import { WizardPreviewDialog } from './wizard-preview-dialog'
import { useWizardForm } from './use-wizard-form'

export function SoftwareWizard() {
  const params = useParams({ strict: false }) as { id?: string }
  const { data: catalog } = useCatalog()
  const { data: landingData } = useLanding()

  const softwareList = catalog?.software || []
  const categories = catalog?.categories || []
  const existingSoftware = params.id
    ? softwareList.find((s) => s.id === params.id || s.slug === params.id)
    : null

  const [currentStep, setCurrentStep] = useState(1)
  const [previewOpen, setPreviewOpen] = useState(false)

  const form = useWizardForm(existingSoftware, categories, softwareList, setCurrentStep)

  // Payload for live preview
  const previewPayload = {
    id: existingSoftware?.id || form.slug.trim(),
    slug: form.slug.trim(),
    name: form.name.trim() || '软件名称预览',
    categoryId: form.categoryId || 'general',
    categoryName: categories.find((c) => c.id === form.categoryId)?.name || '未分类',
    tagline: form.tagline.trim() || '一句话亮点介绍',
    description: form.description.trim() || '软件介绍详细内容...',
    requirements: form.requirements.trim(),
    developer: form.developer.trim(),
    website: form.website.trim(),
    priceLabel: form.priceLabel.trim() || '免费',
    iconUrl: form.iconUrl || '/favicon.ico',
    coverUrl: form.coverUrl || '',
    screenshots: form.screenshots,
    highlights: form.highlights.filter((h) => h.title.trim() || h.text.trim()),
    featured: form.featured,
    featuredOrder: form.featuredOrder,
    landingUrl: form.landingUrl,
    status: form.status || 'draft',
    releases: [
      ...form.pendingPackages.map((p, idx) => ({
        id: `pending-${idx}`,
        version: form.version.trim() || '1.0.0',
        fileName: p.file.name,
        fileSize: p.file.size,
        size: formatBytes(p.file.size),
        platform: p.platform,
        label: p.label,
        arch: p.arch,
        changelog: form.changelog.trim(),
        isLatest: idx === 0 && form.existingReleases.length === 0,
        status: 'published',
      })),
      ...form.existingReleases,
    ],
  }

  const featuredSoftwareList = softwareList.filter(
    (s) => s.featured && s.slug !== form.slug.trim() && s.id !== existingSoftware?.id
  )

  const steps = [
    { num: 1, label: '基础资料' },
    { num: 2, label: '媒体素材' },
    { num: 3, label: '安装包' },
    { num: 4, label: '展示与发布' },
  ]

  return (
    <div className='space-y-6 pb-20'>
      {/* Top Header */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='sm' asChild className='size-8 p-0'>
            <Link to='/software'>
              <ArrowLeft className='size-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {existingSoftware ? `编辑软件 · ${existingSoftware.name}` : '发布新软件向导'}
            </h1>
            <p className='text-xs text-muted-foreground mt-0.5'>
              4 步极简向导，定义软件档案、媒体素材、安装包与主推展示规则
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setPreviewOpen(true)}
            className='gap-1.5'
          >
            <Eye className='size-3.5 text-primary' />
            实时预览
          </Button>
          {existingSoftware && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              asChild
              className='gap-1.5'
            >
              <Link
                to='/site/promotions'
                search={{
                  createEntity: 'software',
                  id: existingSoftware.id || existingSoftware.slug,
                }}
              >
                <Sparkles className='size-3.5 text-primary' />
                加入推广位
              </Link>
            </Button>
          )}
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={form.isSavingDraft || form.isPublishing}
            onClick={() => form.performSave('draft')}
            className='gap-1.5'
          >
            {form.isSavingDraft ? <Loader2 className='size-3.5 animate-spin' /> : null}
            保存草稿
          </Button>
          <Button
            type='button'
            size='sm'
            disabled={!form.requiredPassed || form.isPublishing || form.isSavingDraft}
            onClick={() => form.performSave('active')}
            className='gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm'
          >
            {form.isPublishing ? <Loader2 className='size-3.5 animate-spin' /> : <CheckCircle2 className='size-3.5' />}
            上架发布
          </Button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className='flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-2 backdrop-blur-sm'>
        {steps.map((st, idx) => {
          const isActive = currentStep === st.num
          const isDone = currentStep > st.num
          return (
            <div key={st.num} className='flex-1 flex items-center'>
              <button
                type='button'
                onClick={() => setCurrentStep(st.num)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isDone
                    ? 'text-foreground hover:bg-muted/40'
                    : 'text-muted-foreground hover:bg-muted/20'
                )}
              >
                <span className={cn(
                  'size-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                  isActive ? 'border-primary-foreground/40 bg-primary-foreground/20' : isDone ? 'border-primary text-primary' : 'border-muted'
                )}>
                  {isDone ? <Check className='size-3 text-primary' /> : st.num}
                </span>
                <span>{st.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className='size-4 text-muted-foreground/40 shrink-0 mx-1' />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <WizardStepBasic
          name={form.name}
          setName={form.setName}
          slug={form.slug}
          setSlug={form.setSlug}
          isSlugManuallyEdited={form.isSlugManuallyEdited}
          setIsSlugManuallyEdited={form.setIsSlugManuallyEdited}
          categoryId={form.categoryId}
          setCategoryId={form.setCategoryId}
          categories={categories}
          onOpenCategoryModal={() => form.setCategoryModalOpen(true)}
          tagline={form.tagline}
          setTagline={form.setTagline}
          description={form.description}
          setDescription={form.setDescription}
          requirements={form.requirements}
          setRequirements={form.setRequirements}
          developer={form.developer}
          setDeveloper={form.setDeveloper}
          website={form.website}
          setWebsite={form.setWebsite}
          priceLabel={form.priceLabel}
          setPriceLabel={form.setPriceLabel}
          highlights={form.highlights}
          setHighlights={form.setHighlights}
        />
      )}

      {currentStep === 2 && (
        <WizardStepMedia
          iconUrl={form.iconUrl}
          setIconUrl={form.setIconUrl}
          isUploadingIcon={form.isUploadingIcon}
          onIconUpload={form.handleIconUpload}
          coverUrl={form.coverUrl}
          setCoverUrl={form.setCoverUrl}
          isUploadingCover={form.isUploadingCover}
          onCoverUpload={form.handleCoverUpload}
          screenshots={form.screenshots}
          setScreenshots={form.setScreenshots}
          isUploadingScreenshots={form.isUploadingScreenshots}
          onScreenshotsUpload={form.handleScreenshotsUpload}
        />
      )}

      {currentStep === 3 && (
        <WizardStepPackages
          version={form.version}
          setVersion={form.setVersion}
          changelog={form.changelog}
          setChangelog={form.setChangelog}
          pendingPackages={form.pendingPackages}
          setPendingPackages={form.setPendingPackages}
          existingReleases={form.existingReleases}
          onAddPackages={form.handleAddPackages}
        />
      )}

      {currentStep === 4 && (
        <WizardStepPublish
          featured={form.featured}
          setFeatured={form.setFeatured}
          featuredOrder={form.featuredOrder}
          setFeaturedOrder={form.setFeaturedOrder}
          landingUrl={form.landingUrl}
          setLandingUrl={form.setLandingUrl}
          status={form.status}
          setStatus={form.setStatus}
          landingPages={landingData?.pages || []}
          currentSoftware={{
            name: form.name,
            slug: form.slug,
            tagline: form.tagline,
            iconUrl: form.iconUrl,
            coverUrl: form.coverUrl,
          }}
          featuredSoftwareList={featuredSoftwareList}
        />
      )}

      {/* Bottom Sticky Action Bar */}
      <div className='fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/80 backdrop-blur-md px-6 py-3'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          >
            上一步
          </Button>

          <div className='flex items-center gap-2'>
            {currentStep < 4 ? (
              <Button
                type='button'
                size='sm'
                onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
              >
                下一步
              </Button>
            ) : (
              <Button
                type='button'
                size='sm'
                disabled={!form.requiredPassed || form.isPublishing || form.isSavingDraft}
                onClick={() => form.performSave('active')}
                className='bg-primary text-primary-foreground font-semibold shadow-sm'
              >
                {form.isPublishing ? <Loader2 className='size-3.5 animate-spin mr-1' /> : <CheckCircle2 className='size-3.5 mr-1' />}
                上架发布
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      <WizardPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        softwarePayload={previewPayload}
      />

      {/* Category Creation Modal */}
      <Dialog open={form.categoryModalOpen} onOpenChange={form.setCategoryModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>新建软件分类</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='new-cat-name'>分类名称</Label>
              <Input
                id='new-cat-name'
                placeholder='例如：AI智能工具、开发插件...'
                value={form.newCatName}
                onChange={(e) => form.setNewCatName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => form.setCategoryModalOpen(false)}>
              取消
            </Button>
            <Button disabled={form.isCreatingCat || !form.newCatName.trim()} onClick={form.handleCreateCategory}>
              {form.isCreatingCat ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
              确定创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
