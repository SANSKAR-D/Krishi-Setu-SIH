import { useState, useRef } from "react";
import axios from "axios";
import {
  Bot,
  AlertTriangle,
  AlertCircle,
  ThumbsUp,
  ShoppingCart,
  Camera,
  ImagePlus,
  Mic,
  Send,
  PlusCircle,
  X,
  StopCircle,
  Loader2
} from "lucide-react";

const ExpertChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or not available", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage && !audioBlob) return;

    // Build Form Data
    const formData = new FormData();
    if (message.trim()) formData.append("message", message);
    if (selectedImage) formData.append("image", selectedImage);
    if (audioBlob) formData.append("audio", audioBlob, "voice_record.webm");

    // Add user message to UI
    const newUserMsg = {
      role: "user",
      text: message,
      image: previewUrl,
      hasAudio: !!audioBlob,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    // Reset inputs
    setMessage("");
    setSelectedImage(null);
    setPreviewUrl(null);
    setAudioBlob(null);
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const aiResponse = response.data.response;
      setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { role: "ai", text: "Sorry, there was an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative bg-surface-bright overflow-hidden">
      <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop scroll-smooth pb-32">
        <div className="max-w-[800px] mx-auto flex flex-col gap-md">
          {/* Date separator */}
          <div className="flex justify-center my-4">
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full label-sm">
              Today
            </span>
          </div>

          {messages.length === 0 && (
            <div className="text-center text-on-surface-variant mt-10">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask AgriExpert AI anything about crops, soil, or weather.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0 mt-1 mr-2">
                  <Bot className="w-[18px] h-[18px]" />
                </div>
              )}
              
              <div className={`flex flex-col gap-sm max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-sm' 
                    : 'bg-surface border border-outline-variant rounded-tl-sm text-on-surface'
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="User Upload" className="max-w-full h-auto rounded-lg mb-2 max-h-48 object-cover" />
                  )}
                  {msg.hasAudio && (
                    <div className="flex items-center gap-2 mb-2 bg-primary-container text-on-primary-container p-2 rounded-lg">
                      <Mic className="w-4 h-4" />
                      <span className="text-sm font-semibold">Voice Message Attached</span>
                    </div>
                  )}
                  {msg.text && (
                    <p className="body-md whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start w-full">
               <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0 mt-1 mr-2">
                  <Bot className="w-[18px] h-[18px]" />
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl rounded-tl-sm p-4 text-on-surface flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>AgriExpert is thinking...</span>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-surface-bright via-surface-bright to-transparent">
        <div className="max-w-[800px] mx-auto relative bg-surface rounded-2xl border border-outline-variant shadow-lg flex flex-col p-2 focus-within:border-primary transition-all">
          
          {/* Previews */}
          {(previewUrl || audioBlob) && (
             <div className="flex items-center gap-4 mb-2 p-2 bg-surface-container-low rounded-xl">
               {previewUrl && (
                 <div className="relative">
                   <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-outline-variant" />
                   <button onClick={removeImage} className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-1 shadow-sm hover:opacity-90">
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               )}
               {audioBlob && (
                 <div className="relative flex items-center gap-2 bg-primary-container text-on-primary-container px-3 py-2 rounded-lg">
                    <Mic className="w-5 h-5" />
                    <span className="text-sm font-semibold">Voice Message Ready</span>
                    <button onClick={removeAudio} className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-1 shadow-sm hover:opacity-90">
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               )}
             </div>
          )}

          <div className="flex items-center w-full">
            <label className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low cursor-pointer">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>
            
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 body-md text-on-surface placeholder:text-on-surface-variant/60 py-2 px-2"
              placeholder="Ask about crops, soil, or weather..."
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low mr-1"
                title="Record Audio"
              >
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="p-2 text-error hover:bg-error/10 transition-colors rounded-full mr-1 animate-pulse"
                title="Stop Recording"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            )}

            <button
              className="p-2 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center disabled:opacity-50"
              onClick={handleSend}
              disabled={isLoading || (!message.trim() && !selectedImage && !audioBlob)}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-center mt-2 max-w-[800px] mx-auto">
          <span className="label-sm text-on-surface-variant/60 text-xs">
            AgriExpert AI can make mistakes. Verify critical treatments.
          </span>
        </div>
      </div>
    </main>
  );
};

export default ExpertChat;