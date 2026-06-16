import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ContentStrategyService } from './services/content-strategy/content-strategy.service';
import { ImageGenerationService } from './services/image-generation/image-generation.service';
import { BrandAssetsService } from './services/brand-assets/brand-assets.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('content-studio')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentStudioController {
  constructor(
    private readonly strategyService: ContentStrategyService,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly brandAssetsService: BrandAssetsService,
    private readonly prisma: PrismaService,
  ) {}

  // ========================================
  // STRATEGY & CALENDAR
  // ========================================

  @Post('strategy/generate')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async generateStrategy(@Body() body: { keywords: string[], objective: string, audience: string, serviceOrProduct: string, brandTone: string, brandContext?: string }) {
    if (!body.objective || !body.keywords) {
      throw new BadRequestException('Faltan parámetros: objective, keywords');
    }
    const result = await this.strategyService.generateStrategy(body);
    return { success: true, message: 'Estrategia generada exitosamente', data: result };
  }

  @Post('strategy/save')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.EXECUTIVE)
  async saveStrategy(@Req() req: any, @Body() body: {
    name: string;
    keywords: string[];
    objective: string;
    audience: string;
    serviceOrProduct: string;
    brandTone: string;
    pillars: any[];
    generatedIdeas: any[];
  }) {
    if (!body.name || !body.objective) {
      throw new BadRequestException('Faltan parámetros: name, objective');
    }
    const userId = req.user.id;
    const result = await this.strategyService.saveStrategy({ ...body, userId });
    return { success: true, message: 'Estrategia guardada exitosamente', data: result };
  }

  @Get('strategy')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.EXECUTIVE, UserRole.DESIGNER, UserRole.APPROVER)
  async getStrategies() {
    const strategies = await this.strategyService.getStrategies();
    return { success: true, data: strategies };
  }

  @Get('strategy/:id')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.EXECUTIVE, UserRole.DESIGNER, UserRole.APPROVER)
  async getStrategyById(@Param('id') id: string) {
    const strategy = await this.strategyService.getStrategyById(id);
    return { success: true, data: strategy };
  }

  // ========================================
  // POST EDITING (inline copy editing)
  // ========================================

  @Post('analyze-brand')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  @UseInterceptors(FileInterceptor('file'))
  async analyzeBrandImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Falta la imagen (logo/referencia)');
    }
    const result = await this.strategyService.analyzeBrandImage(file);
    return { success: true, data: result };
  }

  @Patch('posts/:id/copy')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async updatePostCopy(@Param('id') id: string, @Body() body: { copyText: string; hashtags?: string[] }) {
    if (!body.copyText) {
      throw new BadRequestException('Falta el campo copyText');
    }
    const result = await this.strategyService.updatePostCopy(id, body.copyText, body.hashtags);
    return { success: true, data: result };
  }

  // ========================================
  // IMAGE GENERATION (per post idea)
  // ========================================

  @Post('posts/:id/generate-image')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async generateImageForPost(@Req() req: any, @Param('id') postId: string, @Body() body: { brandContext?: string }) {
    // 1) Get the post with its visualPrompt
    const post = await this.prisma.contentPost.findUnique({ where: { id: postId } });
    if (!post || !post.visualPrompt) {
      throw new BadRequestException('Post no encontrado o sin visual prompt');
    }

    // Map format to aspectRatio
    let aspectRatio = '1:1';
    if (post.format === 'REEL' || post.format === 'STORY') {
      aspectRatio = '9:16';
    }

    // 2) Generate image using the visualPrompt, aspectRatio, and brandContext
    const base64Image = await this.imageGenerationService.generateImage(post.visualPrompt, aspectRatio, body?.brandContext);

    // 3) Upload to Supabase
    const publicUrl = await this.brandAssetsService.uploadBase64Image(base64Image, `post_${postId}_${Date.now()}.jpg`);

    // 4) Save GeneratedImage record linked to the post
    const generatedImage = await this.prisma.generatedImage.create({
      data: {
        postId: postId,
        imageUrl: publicUrl,
        prompt: post.visualPrompt,
        provider: 'gemini-imagen-3',
        format: post.format,
        createdById: req.user.id,
      },
    });

    // 5) Update post status to GENERATED
    await this.prisma.contentPost.update({
      where: { id: postId },
      data: { status: 'GENERATED' },
    });

    return { success: true, data: { imageUrl: publicUrl, generatedImage } };
  }

  @Get('calendar')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER, UserRole.EXECUTIVE, UserRole.APPROVER)
  async getCalendar() {
    return { success: true, data: [] };
  }

  @Post('posts')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER)
  async createPost(@Body() body: any) {
    return { success: true, data: {} };
  }

  @Get('posts')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.EXECUTIVE, UserRole.APPROVER, UserRole.DESIGNER)
  async getPosts() {
    return { success: true, data: [] };
  }

  // ========================================
  // IMAGES (standalone generation)
  // ========================================

  @Post('images/generate')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async generateImage(@Body() body: { prompt: string, aspectRatio?: string }) {
    if (!body.prompt) {
      throw new BadRequestException('Falta el prompt');
    }
    const base64Image = await this.imageGenerationService.generateImage(body.prompt, body.aspectRatio);
    const publicUrl = await this.brandAssetsService.uploadBase64Image(base64Image, `generated_${Date.now()}.jpg`);
    return { success: true, message: 'Imagen generada exitosamente', url: publicUrl, localBase64: base64Image };
  }

  @Post('images/variations')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async generateImageVariations(@Body() body: any) {
    return { success: true, data: [] };
  }

  // ========================================
  // ASSETS & BRAND KIT
  // ========================================

  @Post('assets/upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async uploadAsset(@UploadedFile() file: Express.Multer.File, @Body('folder') folder: string) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado un archivo');
    }
    const url = await this.brandAssetsService.uploadAsset(file.buffer, file.originalname, file.mimetype, folder || 'assets');
    return { success: true, url };
  }

  @Get('brand-kit')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER)
  async getBrandKit() {
    return { success: true, data: {} };
  }

  // ========================================
  // PEOPLE (Authorized Faces)
  // ========================================

  @Get('people')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.DESIGNER, UserRole.APPROVER)
  async getPeople() {
    return { success: true, data: [] };
  }

  // ========================================
  // APPROVALS
  // ========================================

  @Post('approvals/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.APPROVER)
  async approveContent(@Param('id') id: string) {
    return { success: true, message: 'Contenido aprobado' };
  }

  @Post('approvals/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.APPROVER)
  async rejectContent(@Param('id') id: string, @Body() body: any) {
    return { success: true, message: 'Contenido rechazado', reason: body.reason };
  }

  // ========================================
  // SCHEDULER & INSTAGRAM
  // ========================================

  @Post('scheduler/schedule')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER)
  async schedulePost(@Body() body: any) {
    return { success: true, message: 'Publicación programada' };
  }

  @Get('instagram/connect')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER)
  async connectInstagram() {
    return { success: true, authUrl: 'https://www.facebook.com/v17.0/dialog/oauth?client_id=MOCK_APP_ID&redirect_uri=MOCK_REDIRECT&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement' };
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.EXECUTIVE)
  async getAnalytics() {
    return { success: true, data: { reach: 12000, impressions: 15000, likes: 450, comments: 23 } };
  }
}
