require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
  
  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
    gemini: {
      apiKey: (process.env.GEMINI_API_KEY || '').trim(),
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    },
    huggingFace: {
      apiKey: (process.env.HUGGINGFACE_API_KEY || '').trim(),
      modelUrl: process.env.HUGGINGFACE_MODEL_URL || 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
    },
    openai: {
      apiKey: (process.env.OPENAI_API_KEY || '').trim(),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    customApi: {
      endpoint: process.env.CUSTOM_MODEL_ENDPOINT || 'http://localhost:8000/predict',
    }
  }
};

module.exports = config;
