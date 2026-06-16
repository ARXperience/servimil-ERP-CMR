const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
        Actúa como el mejor estratega de contenido para Instagram.
        Genera una estrategia de contenido mensual basada en lo siguiente:
        - Palabras clave: crédito rápido
        - Objetivo: Incrementar ventas
        - Público Objetivo: Militares
        - Producto/Servicio: Créditos
        - Tono de Marca: Institucional

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
              "copyText": "Copy persuasivo incluyendo emojis y hashtags",
              "visualPrompt": "Prompt descriptivo detallado para generar la imagen en DALL-E/Midjourney",
              "cta": "Llamado a la acción",
              "hashtags": ["#tag1", "#tag2"]
            }
          ]
        }
        Asegúrate de que haya exactamente 4 ideas en el arreglo generatedIdeas.
      `;

  const result = await model.generateContent(prompt);
  console.log("Raw response:", result.response.text());
}
run().catch(console.error);
