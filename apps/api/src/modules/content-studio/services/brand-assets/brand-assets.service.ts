import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BrandAssetsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async uploadAsset(fileBuffer: Buffer, fileName: string, mimeType: string, folder: string = 'assets') {
    try {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
      // If Supabase is not properly configured, return base64 data URI
      if (!supabaseUrl || supabaseUrl.includes('your-project') || !this.supabase) {
        console.log('Supabase no está configurado, devolviendo imagen en base64 para uploadAsset...');
        const base64Data = fileBuffer.toString('base64');
        return `data:${mimeType};base64,${base64Data}`;
      }

      const filePath = `${folder}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data, error } = await this.supabase.storage
        .from('content-studio')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: publicData } = this.supabase.storage
        .from('content-studio')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading asset to Supabase:', error);
      throw new InternalServerErrorException('No se pudo subir el archivo: ' + error.message);
    }
  }
  
  // Utilidad para convertir el base64 de Imagen 3 a buffer y subirlo
  async uploadBase64Image(base64Data: string, fileName: string) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    // If Supabase is not properly configured (e.g., default placeholder), just return the base64 directly
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      console.log('Supabase no está configurado, devolviendo imagen en base64...');
      // Make sure we have the data:image/... prefix
      if (!base64Data.startsWith('data:')) {
        return `data:image/jpeg;base64,${base64Data}`;
      }
      return base64Data;
    }

    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');
    return this.uploadAsset(buffer, fileName, 'image/jpeg', 'generated');
  }
}
