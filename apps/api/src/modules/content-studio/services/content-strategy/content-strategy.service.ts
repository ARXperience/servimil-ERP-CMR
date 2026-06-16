import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ContentFormat } from '@prisma/client';

@Injectable()
export class ContentStrategyService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash' });
  }

  async generateStrategy(params: {
    keywords: string[];
    objective: string;
    audience: string;
    serviceOrProduct: string;
    brandTone: string;
    brandContext?: string;
  }) {
    try {
      let prompt = `
        Actúa como el mejor estratega de contenido para Instagram, enfocado exclusivamente en el mercado de Colombia.
        Genera una estrategia de contenido mensual basada en lo siguiente:
        - Palabras clave: ${params.keywords.join(', ')}
        - Objetivo: ${params.objective}
        - Público Objetivo: ${params.audience}
        - Producto/Servicio: ${params.serviceOrProduct}
        - Tono de Marca: ${params.brandTone}
      `;

      if (params.brandContext) {
        prompt += `\n        - Identidad Visual (Logo analizado): ${params.brandContext}\n`;
      }

      prompt += `
        INSTRUCCIÓN CRÍTICA: Todo el contenido (textos, hashtags, llamados a la acción, modismos) debe estar claramente dirigido a Colombia. 
        Además, los "visualPrompt" DEBEN especificar claramente escenarios, paisajes, ciudades (Bogotá, Medellín, Cali, etc.), biotipos, o arquitectura típica colombiana para garantizar que la imagen resultante tenga características geográficas y regionales de Colombia.
        Si se proporcionó una "Identidad Visual", asegúrate de que los "visualPrompt" indiquen el uso de la paleta de colores y el estilo tipográfico/gráfico mencionado.

        Devuelve la respuesta ESTRICTAMENTE en un objeto JSON con la siguiente estructura y en formato stringificado (sin markdown ni bloques \`\`\`json):
        {
          "objective": "Objetivo general de la campaña",
          "pillars": [
            { "name": "Nombre Pilar 1", "description": "Descripción" },
            { "name": "Nombre Pilar 2", "description": "Descripción" }
          ],
          "generatedIdeas": [
            {
              "title": "Título de la idea",
              "format": "FEED_SQUARE | REEL | CAROUSEL | STORY",
              "copyText": "Copy persuasivo incluyendo emojis, lenguaje natural colombiano y hashtags colombianos",
              "visualPrompt": "Prompt descriptivo detallado para generar la imagen en IA. DEBE especificar elementos geográficos, culturales o ciudades de Colombia.",
              "cta": "Llamado a la acción",
              "hashtags": ["#tag1", "#tagColombia"]
            }
          ]
        }
        Asegúrate de que haya exactamente 4 ideas en el arreglo generatedIdeas.
        Para el campo "format", usa EXACTAMENTE uno de estos valores: FEED_SQUARE, REEL, CAROUSEL, STORY.
      `;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanedJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error al generar estrategia:', error);
      throw new InternalServerErrorException('No se pudo generar la estrategia de contenido con Gemini');
    }
  }

  async analyzeBrandImage(file: Express.Multer.File) {
    try {
      // Use gemini-2.5-flash for vision
      const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Analiza detenidamente esta imagen que corresponde al logo o material de identidad visual de una marca.
        Extrae y describe:
        1. La paleta de colores principal (indica nombres de colores como "Azul marino", "Rojo vibrante", etc. y su vibra general).
        2. El estilo tipográfico (si es formal, moderno, elegante, grueso, cursiva, etc.).
        3. El tono o la vibra de la marca (ej. corporativo, amigable, infantil, premium, rústico).
        4. Las formas predominantes o elementos gráficos clave.
        
        Devuelve SOLO un párrafo cohesivo que describa todo esto. No incluyas viñetas ni títulos, solo el texto puro, ya que esto será inyectado como contexto para generar futuras imágenes de la marca.
      `;

      const imageParts = [
        {
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype
          }
        }
      ];

      const result = await visionModel.generateContent([prompt, ...imageParts]);
      const brandContext = result.response.text().trim();
      
      return { brandContext };
    } catch (error) {
      console.error('Error al analizar la marca:', error);
      throw new InternalServerErrorException('No se pudo analizar la identidad de marca con Gemini Vision');
    }
  }

  /**
   * Save a generated strategy to the database, creating ContentPost records for each idea
   */
  async saveStrategy(params: {
    name: string;
    keywords: string[];
    objective: string;
    audience: string;
    serviceOrProduct: string;
    brandTone: string;
    pillars: any[];
    generatedIdeas: any[];
    userId: string;
  }) {
    const validFormats: Record<string, ContentFormat> = {
      'FEED_SQUARE': 'FEED_SQUARE',
      'FEED_VERTICAL': 'FEED_VERTICAL',
      'STORY': 'STORY',
      'REEL': 'REEL',
      'CAROUSEL': 'CAROUSEL',
    };

    // Create the strategy with its posts in a transaction
    const strategy = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contentStrategy.create({
        data: {
          name: params.name,
          keywords: params.keywords,
          objective: params.objective,
          audience: params.audience,
          serviceOrProduct: params.serviceOrProduct,
          brandTone: params.brandTone,
          pillars: params.pillars,
          generatedIdeas: params.generatedIdeas,
          createdById: params.userId,
        },
      });

      // Create a ContentPost for each generated idea
      if (params.generatedIdeas && params.generatedIdeas.length > 0) {
        for (const idea of params.generatedIdeas) {
          const format = validFormats[idea.format] || 'FEED_SQUARE';
          await tx.contentPost.create({
            data: {
              strategyId: created.id,
              title: idea.title,
              format: format,
              copyText: idea.copyText,
              visualPrompt: idea.visualPrompt,
              cta: idea.cta,
              hashtags: idea.hashtags || [],
              status: 'DRAFT',
              createdById: params.userId,
            },
          });
        }
      }

      return created;
    });

    // Return the full strategy with posts
    return this.getStrategyById(strategy.id);
  }

  /**
   * Get all saved strategies (summary list)
   */
  async getStrategies() {
    return this.prisma.contentStrategy.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        posts: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  /**
   * Get a single strategy with all its posts and generated images
   */
  async getStrategyById(id: string) {
    const strategy = await this.prisma.contentStrategy.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        posts: {
          orderBy: { createdAt: 'asc' },
          include: {
            generatedImages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!strategy) {
      throw new NotFoundException('Estrategia no encontrada');
    }

    return strategy;
  }

  /**
   * Update a post's copy text (for inline editing)
   */
  async updatePostCopy(postId: string, copyText: string, hashtags?: string[]) {
    const updateData: any = { copyText };
    if (hashtags) {
      updateData.hashtags = hashtags;
    }

    return this.prisma.contentPost.update({
      where: { id: postId },
      data: updateData,
    });
  }
}
