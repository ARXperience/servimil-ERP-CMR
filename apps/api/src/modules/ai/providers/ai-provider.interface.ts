export interface AiProvider {
  generateText(prompt: string, options?: any): Promise<string>;
  generateJSON(prompt: string, schema?: any, options?: any): Promise<any>;
  analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string>;
}
