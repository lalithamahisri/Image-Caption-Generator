const fs = require('fs');
const config = require('../config/config');

class CaptionService {
  async generateCaption(file, style = 'Social', additionalContext = '') {
    if (!file || !file.path) {
      throw new Error('No image file was provided for analysis.');
    }

    const provider = config.ai.provider;

    switch (provider) {
      case 'gemini':
        return await this._callGeminiVision(file, style, additionalContext);

      case 'huggingface':
        return await this._callHuggingFaceVision(file, style, additionalContext);

      case 'openai':
        return await this._callOpenAIVision(file, style, additionalContext);

      case 'custom_api':
        return await this._callCustomVisionAPI(file, style, additionalContext);

      default:
        if (config.ai.gemini.apiKey) {
          return await this._callGeminiVision(file, style, additionalContext);
        } else if (config.ai.openai.apiKey) {
          return await this._callOpenAIVision(file, style, additionalContext);
        } else if (config.ai.huggingFace.apiKey) {
          return await this._callHuggingFaceVision(file, style, additionalContext);
        }
        
        throw new Error(
          'No AI Vision API key found. Please add your GEMINI_API_KEY in the .env file.'
        );
    }
  }

  _buildVisionPrompt(style, additionalContext) {
    const styleKey = (style || '').toLowerCase();
    let styleGuideline = '';

    if (styleKey.includes('social') || styleKey.includes('creative')) {
      styleGuideline = `Create an authentic, engaging social media caption (perfect for Instagram, TikTok, or Twitter/X).
- Write a catchy, conversational hook describing what is happening in the photo.
- Include 2-3 natural, fitting emojis that match the mood and objects.
- Add 3-5 relevant, popular hashtags at the end.`;
    } else if (styleKey.includes('blog') || styleKey.includes('story')) {
      styleGuideline = `Create an evocative, storytelling caption suitable for a travel, lifestyle, or photo blog.
- Write 2-3 engaging sentences describing the atmosphere, experience, and visual details.
- Make it inspirational and reflective.`;
    } else if (styleKey.includes('short') || styleKey.includes('punchy')) {
      styleGuideline = `Create a short, punchy, witty one-liner caption for quick social posts.
- Keep it under 15 words with 1-2 expressive emojis.`;
    } else if (styleKey.includes('professional') || styleKey.includes('business')) {
      styleGuideline = `Create a polished, articulate, and insightful caption for professional platforms like LinkedIn or portfolio websites.
- Highlight purpose, activity, focus, or teamwork without excessive slang.`;
    } else if (styleKey.includes('accessibility') || styleKey.includes('alt')) {
      styleGuideline = `Create a precise, objective, and detailed Alt-Text description for visually impaired users and screen readers describing the main subjects, layout, colors, and actions.`;
    } else {
      styleGuideline = `Create a lively, natural caption ready to post online. Describe what is genuinely happening in the scene with a warm, authentic tone, appropriate emojis, and 2-3 hashtags.`;
    }

    const contextGuideline = additionalContext
      ? `User provided context to help guide your caption: "${additionalContext}". Weave this context naturally into the caption if it matches the visual scene.`
      : '';

    return `You are a professional social media content creator and AI caption writer.
Look closely at the ACTUAL IMAGE provided.

Analyze what is visually happening:
- Who or what is in the photo (people, pets, scenery, food, objects, nature, etc.)
- What actions or activities are taking place
- The setting, lighting, and overall mood

TASK:
Write a high-quality, ready-to-publish caption for this specific image.

${styleGuideline}

${contextGuideline}

STRICT INSTRUCTIONS:
1. Base the caption strictly on what is visible in the actual image.
2. Never mention file names (like .jpg, .png) or image dimensions.
3. Do not use dry robotic language like "The image depicts..." or "A photo of...". Make it sound like a real person sharing a moment.
4. Output ONLY the final caption text ready to copy-paste. Do not include labels like "Caption:".`;
  }

  async _callGeminiVision(file, style, additionalContext) {
    const apiKey = config.ai.gemini.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please set GEMINI_API_KEY in your .env file.');
    }

    const imageBytes = fs.readFileSync(file.path);
    const base64Image = imageBytes.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    const promptText = this._buildVisionPrompt(style, additionalContext);

    const candidateModels = [
      config.ai.gemini.model || 'gemini-3.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash'
    ];

    const modelsToTry = [...new Set(candidateModels)];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Image
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          let msg = `Gemini Vision API error (${response.status})`;
          try {
            const parsed = JSON.parse(errBody);
            if (parsed.error?.message) msg = parsed.error.message;
          } catch (e) {}

          if (response.status === 503 || msg.includes('high demand') || response.status === 404) {
            lastError = new Error(msg);
            continue;
          }
          throw new Error(msg);
        }

        const data = await response.json();
        const caption = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!caption || !caption.trim()) {
          throw new Error('Gemini Vision returned an empty caption.');
        }

        return this._cleanCaption(caption);
      } catch (err) {
        lastError = err;
        if (err.message.includes('high demand') || err.message.includes('404')) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Unable to generate caption. Please try again.');
  }

  async _callHuggingFaceVision(file, style, additionalContext) {
    const apiKey = config.ai.huggingFace.apiKey;
    if (!apiKey) {
      throw new Error('Hugging Face API key is missing. Please set HUGGINGFACE_API_KEY in your .env file.');
    }

    const imageBytes = fs.readFileSync(file.path);
    const modelUrl = config.ai.huggingFace.modelUrl;

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': file.mimetype || 'application/octet-stream'
      },
      body: imageBytes
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face error: ${errorText}`);
    }

    const result = await response.json();
    const rawCaption = (Array.isArray(result) && result[0]?.generated_text) ? result[0].generated_text : 'Visual scene';
    
    return `✨ ${rawCaption.charAt(0).toUpperCase() + rawCaption.slice(1)}! Loving every moment of this view. 🌿 #LifeInFocus #DailyVibes`;
  }

  async _callOpenAIVision(file, style, additionalContext) {
    const apiKey = config.ai.openai.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key is missing. Please set OPENAI_API_KEY in your .env file.');
    }

    const imageBytes = fs.readFileSync(file.path);
    const base64Image = imageBytes.toString('base64');
    const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${base64Image}`;
    const promptText = this._buildVisionPrompt(style, additionalContext);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.ai.openai.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI Vision request failed with status ${response.status}`);
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content;

    if (!caption) {
      throw new Error('OpenAI Vision returned an empty caption.');
    }

    return this._cleanCaption(caption);
  }

  async _callCustomVisionAPI(file, style, additionalContext) {
    const endpoint = config.ai.customApi.endpoint;
    const imageBytes = fs.readFileSync(file.path);
    const blob = new Blob([imageBytes], { type: file.mimetype || 'image/jpeg' });

    const formData = new FormData();
    formData.append('image', blob, file.originalname);
    formData.append('style', style);
    formData.append('additionalContext', additionalContext);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Custom model server returned error status ${response.status}`);
    }

    const data = await response.json();
    return this._cleanCaption(data.caption || data.generated_text || data.description);
  }

  _cleanCaption(raw) {
    let clean = (raw || '').trim().replace(/^["']|["']$/g, '');
    return clean;
  }
}

module.exports = new CaptionService();
