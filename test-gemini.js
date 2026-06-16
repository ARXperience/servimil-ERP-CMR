const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const apiKey = 'AIzaSyAA5HDZNTgpg_LZhu1UnuBsOm4sAAC_pT0';
  console.log('Testing key:', apiKey);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  try {
    const result = await model.generateContent('Di hola en español');
    console.log('SUCCESS:', result.response.text());
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
main();
