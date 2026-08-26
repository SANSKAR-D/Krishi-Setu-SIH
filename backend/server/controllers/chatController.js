const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

const handleChatRequest = async (req, res) => {
  try {
    const textMessage = req.body.message;
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
    const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;
    
    let imageUrl = null;
    let finalEnglishQuery = '';
    let originalLanguage = 'English'; // default assumption

    // 1. Upload Image to Cloudinary if provided
    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile.buffer);
    }

    // 2. Handle Audio or Text
    if (audioFile) {
      // Whisper needs a file with extension, so we write the buffer to a temp file
      const tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempFilePath, audioFile.buffer);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
      });
      fs.unlinkSync(tempFilePath); // cleanup
      
      const transcribedText = transcription.text;
      
      // Translate to English and detect language
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant. Translate the following text to English, and reply ONLY with a JSON object in this format: {\"translated_text\": \"...\", \"original_language\": \"...\"}" },
          { role: "user", content: transcribedText }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      finalEnglishQuery = result.translated_text;
      originalLanguage = result.original_language;

    } else if (textMessage) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant. Translate the following text to English, and reply ONLY with a JSON object in this format: {\"translated_text\": \"...\", \"original_language\": \"...\"}" },
          { role: "user", content: textMessage }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      finalEnglishQuery = result.translated_text;
      originalLanguage = result.original_language;
    } else {
      return res.status(400).json({ error: "No text or audio message provided." });
    }

    // 3. Send query and imageUrl to FastAPI agent
    const fastApiPayload = {
      user_query: finalEnglishQuery,
      image_urls: imageUrl ? [imageUrl] : null
    };

    const fastApiResponse = await axios.post('http://localhost:8000/ask', fastApiPayload);
    const agentResponseText = fastApiResponse.data.final_advice;
    const stateDetails = fastApiResponse.data.state_details;

    // 4. Translate response back to original language if it was not English
    let translatedResponse = agentResponseText;
    if (originalLanguage && originalLanguage.toLowerCase() !== 'english') {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are an expert agricultural AI. Translate the following English response into ${originalLanguage}. Make sure it sounds natural and retains agricultural terminology context.` },
          { role: "user", content: agentResponseText }
        ],
      });
      translatedResponse = completion.choices[0].message.content;
    }

    // 5. Send final response to Frontend
    return res.json({
      success: true,
      original_query: textMessage,
      english_query: finalEnglishQuery,
      detected_language: originalLanguage,
      response: translatedResponse,
      state_details: stateDetails
    });

  } catch (error) {
    console.error("Error in chatController:", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
};

module.exports = {
  handleChatRequest
};
