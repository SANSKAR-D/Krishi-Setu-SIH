require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const ChatHistory = require('../models/ChatHistory');
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const TRANSLATION_MODEL = "gemini-3.1-flash-lite";

// ─── Helper: safely parse JSON from Gemini (strips markdown fences) ───
function safeJsonParse(text) {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  return JSON.parse(cleaned);
}

// ─── Helper: Translate text to English ───
async function translateTextToEnglish(text) {
  const response = await ai.models.generateContent({
    model: TRANSLATION_MODEL,
    contents: `Analyze this text and translate it to English.

RULES:
- If the text is already in pure English, set original_language to "English" and copy the text as-is into translated_text.
- If the text uses English letters but contains Hindi/Urdu words (e.g. "kya", "hai", "kaise", "accha", "tumhare", "mein", "khet"), set original_language to "Hinglish".
- For any other language (Hindi in Devanagari, Tamil, Marathi, etc.), set original_language to that language name.
- Do NOT answer, summarize, or change the meaning. Only translate.

Text: "${text}"

Reply ONLY with a JSON object: {"translated_text": "...", "original_language": "..."}`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text);
}

// ─── Helper: Translate English response back to user's language ───
async function translateToUserLanguage(englishText, targetLanguage) {
  if (!targetLanguage || targetLanguage.toLowerCase() === 'english') {
    return englishText;
  }

  try {
    let languageInstruction = `Translate the following English text into ${targetLanguage}.`;

    if (targetLanguage.toLowerCase() === 'hinglish') {
      languageInstruction = `Translate the following English text into Hinglish.
CRITICAL: Write Hindi words using ONLY English letters (Latin script). 
Example output: "Gehu ek Rabi fasal hai jo October-November mein boi jaati hai."
Do NOT use Devanagari script. Do NOT just return the English text unchanged.`;
    }

    const response = await ai.models.generateContent({
      model: TRANSLATION_MODEL,
      contents: `${languageInstruction}

Text: ${englishText}`
    });
    return response.text;
  } catch (err) {
    console.error("⚠️ Back-translation failed, returning English:", err.message);
    return englishText;
  }
}

// ─── Cloudinary upload helper ───
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'krishi_setu_expert_chat' },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// ─── Get chat history ───
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    let history = await ChatHistory.findOne({ userId });
    if (!history) {
      history = new ChatHistory({ userId, messages: [] });
      await history.save();
    }
    res.json({ success: true, messages: history.messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

const { getSoilAndWeatherData } = require('./dashboardController');

// ─── Main chat handler ───
const handleChatRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const textMessage = req.body.message;
    const lat = req.body.lat ? parseFloat(req.body.lat) : null;
    const lon = req.body.lon ? parseFloat(req.body.lon) : null;
    const imageFiles = req.files && req.files['image'] ? req.files['image'] : [];
    console.log("📸 Received image files count:", imageFiles.length);
    
    let imageUrls = null;
    let finalEnglishQuery = '';
    let originalLanguage = 'English'; 
    let soilMetrics = null;

    // 0. Fetch Soil Data if location provided
    if (lat && lon) {
      try {
        const result = await getSoilAndWeatherData(lat, lon);
        soilMetrics = result.soilMetrics;
        console.log("🌍 Fetched live field conditions for chat context");
      } catch (err) {
        console.error("Failed to fetch soil data for chat:", err.message);
      }
    }

    // 1. Upload images to Cloudinary
    if (imageFiles.length > 0) {
      console.log("⬆️ Uploading images to Cloudinary...");
      imageUrls = await Promise.all(imageFiles.map(file => uploadToCloudinary(file.buffer)));
      console.log("✅ Cloudinary URLs generated:", imageUrls);
    }

    // 2. Translate user text to English
    if (!textMessage || !textMessage.trim()) {
      return res.status(400).json({ error: "No text message provided." });
    }

    const result = await translateTextToEnglish(textMessage);
    finalEnglishQuery = result.translated_text;
    originalLanguage = result.original_language;
    console.log("📝 Text translation:", { original: textMessage, translated: finalEnglishQuery, language: originalLanguage });

    console.log("=== TRANSLATION PIPELINE ===");
    console.log("Detected Language:", originalLanguage);
    console.log("Final English Query:", finalEnglishQuery);

    // 3. Send English query to FastAPI agent
    const fastApiPayload = {
      user_query: finalEnglishQuery,
      image_urls: imageUrls,
      thread_id: userId,
      soil_metrics: soilMetrics
    };
    const fastApiResponse = await axios.post(`${FASTAPI_URL}/ask`, fastApiPayload);
    const agentResponseText = fastApiResponse.data.final_advice;
    const stateDetails = fastApiResponse.data.state_details;

    console.log("🤖 FastAPI English response received (" + agentResponseText.length + " chars)");

    // 4. Translate response back to user's language
    const translatedResponse = await translateToUserLanguage(agentResponseText, originalLanguage);

    console.log("🌐 Back-translated to:", originalLanguage);

    // 5. Save to MongoDB ChatHistory
    let history = await ChatHistory.findOne({ userId });
    if (!history) {
      history = new ChatHistory({ userId, messages: [] });
    }
    
    // Add user message
    history.messages.push({
      role: 'user',
      text: textMessage,
      image: imageUrls
    });
    
    // Add AI message
    history.messages.push({
      role: 'ai',
      text: translatedResponse
    });

    await history.save();

    // 6. Send final response to Frontend
    return res.json({
      success: true,
      original_query: textMessage,
      english_query: finalEnglishQuery,
      detected_language: originalLanguage,
      response: translatedResponse,
      state_details: stateDetails,
      history: history.messages
    });

  } catch (error) {
    console.error("Error in chatController:", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
};

// ─── Transcribe Audio with Gemini ───
const transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const mimeType = req.file.mimetype || 'audio/webm';
    const audioData = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          inlineData: {
            data: audioData,
            mimeType: mimeType
          }
        },
        `Listen to this audio and transcribe exactly what is spoken in the original language. 
If it is spoken in Hindi, you MUST output the transcription in Devanagari script (e.g. "नमस्ते"). DO NOT use Latin/English letters for Hindi words. 
Detect the primary language. CRITICAL: Never output "Hinglish" as the language, use "Hindi" instead.
Reply ONLY with a valid JSON object in this exact format: {"text": "the transcription", "language": "detected language"}`
      ],
      config: { responseMimeType: "application/json" }
    });

    const result = safeJsonParse(response.text);

    console.log(`🎙️ Voice Detected Language: ${result.language}`);
    console.log(`🎙️ Voice Transcript: ${result.text}`);

    res.json({
      success: true,
      text: result.text,
      language: result.language || 'unknown'
    });
  } catch (error) {
    console.error("Error transcribing audio with Gemini:", error.message || error);
    res.status(500).json({ error: "Failed to transcribe audio." });
  }
};

module.exports = {
  handleChatRequest,
  getChatHistory,
  transcribeAudio
};
