const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const fs = require('fs');
const ChatHistory = require('../models/ChatHistory');

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

const handleChatRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const textMessage = req.body.message;
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
    const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;
    
    let imageUrl = null;
    let finalEnglishQuery = '';
    let originalLanguage = 'English'; 

    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile.buffer);
    }

    if (audioFile) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: audioFile.buffer.toString("base64"), mimeType: audioFile.mimetype } },
              { text: "Transcribe this audio, translate it to English, and reply ONLY with a JSON object in this format: {\"translated_text\": \"...\", \"original_language\": \"...\"}" }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text);
      finalEnglishQuery = result.translated_text;
      originalLanguage = result.original_language;

    } else if (textMessage) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `Translate the following text to English, and reply ONLY with a JSON object in this format: {"translated_text": "...", "original_language": "..."}\n\nText: ${textMessage}`,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text);
      finalEnglishQuery = result.translated_text;
      originalLanguage = result.original_language;
    } else {
      return res.status(400).json({ error: "No text or audio message provided." });
    }

    // 3. Send query, imageUrl, and userId to FastAPI agent
    const fastApiPayload = {
      user_query: finalEnglishQuery,
      image_urls: imageUrl ? [imageUrl] : null,
      thread_id: userId // Use MongoDB ObjectId as thread_id
    };

    const fastApiResponse = await axios.post('http://localhost:8000/ask', fastApiPayload);
    const agentResponseText = fastApiResponse.data.final_advice;
    const stateDetails = fastApiResponse.data.state_details;

    // 4. Translate response back
    let translatedResponse = agentResponseText;
    if (originalLanguage && originalLanguage.toLowerCase() !== 'english') {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are an expert agricultural AI. Translate the following English response into ${originalLanguage}. Make sure it sounds natural and retains agricultural terminology context.\n\nText: ${agentResponseText}`
      });
      translatedResponse = response.text;
    }

    // 5. Save to MongoDB ChatHistory
    let history = await ChatHistory.findOne({ userId });
    if (!history) {
      history = new ChatHistory({ userId, messages: [] });
    }
    
    // Add user message
    history.messages.push({
      role: 'user',
      text: textMessage || "Audio Message",
      image: imageUrl,
      hasAudio: !!audioFile
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

module.exports = {
  handleChatRequest,
  getChatHistory
};
