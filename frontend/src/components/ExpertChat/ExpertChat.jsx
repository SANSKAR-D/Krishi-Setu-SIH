import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Camera,
  ImagePlus,
  Send,
  X,
  Loader2,
  Trash2
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ExpertChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Fetch chat history from MongoDB on mount
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/history`);
        if (response.data.success && response.data.messages) {
          setMessages(response.data.messages);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchHistory();
  }, []);
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files]);
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && selectedImages.length === 0) return;

    // Build Form Data
    const formData = new FormData();
    if (message.trim()) formData.append("message", message);
    if (selectedImages.length > 0) {
      selectedImages.forEach((img) => formData.append("image", img));
    }

    // Add user message to UI
    const newUserMsg = {
      role: "user",
      text: message,
      image: previewUrls.length > 0 ? [...previewUrls] : null,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    // Reset inputs
    setMessage("");
    setSelectedImages([]);
    setPreviewUrls([]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, formData, {
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

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => sendRequest(position.coords.latitude, position.coords.longitude),
        () => sendRequest() // fallback without location
      );
    } else {
      sendRequest();
    }
  };

  return (
    <main className="flex-1 flex flex-col relative bg-surface-bright overflow-hidden">
      <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop scroll-smooth">
        <div className="max-w-[800px] mx-auto flex flex-col gap-md">
          {/* Date separator */}
          <div className="flex justify-center items-center my-4 relative">
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full label-sm">
              Today
            </span>
          </div>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 w-full max-w-2xl mx-auto px-4">
              <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Bot className="w-8 h-8 text-on-primary-container" />
              </div>
              <h2 className="text-2xl font-semibold text-on-surface mb-2">Welcome to Krishi Setu</h2>
              <p className="text-on-surface-variant text-center mb-8 w-full max-w-[500px]">
                I can help you analyze soil conditions, diagnose crop diseases, predict weather impacts, and plan your farming schedule.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {[
                  "What is the best fertilizer for wheat in loamy soil?",
                  "Analyze this image of my tomato plant leaves for diseases.",
                  "How will next week's rainfall affect my sowing schedule?"
                ].map((suggestion, i) => (
                  <button 
                    key={i} 
                    onClick={() => setMessage(suggestion)}
                    className="p-4 bg-surface border border-outline-variant hover:border-primary hover:bg-surface-container-low rounded-xl text-left transition-colors text-sm text-on-surface shadow-sm cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
                  {msg.image && (Array.isArray(msg.image) ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.image.map((img, i) => (
                        <img key={i} src={img} alt={`User Upload ${i}`} className="max-w-full h-auto rounded-lg max-h-48 object-cover" />
                      ))}
                    </div>
                  ) : (
                    <img src={msg.image} alt="User Upload" className="max-w-full h-auto rounded-lg mb-2 max-h-48 object-cover" />
                  ))}
                  {msg.text && (
                    <div className="body-md whitespace-pre-wrap prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
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
                  <span>Krishi Setu is thinking...</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="w-full p-4 bg-surface-bright shrink-0 z-10">
        <div className="max-w-[800px] mx-auto relative bg-surface rounded-2xl border border-outline-variant shadow-lg flex flex-col p-2 focus-within:border-primary transition-all">
          
          {/* Image Previews */}
          {previewUrls.length > 0 && (
             <div className="flex items-center gap-4 mb-2 p-2 bg-surface-container-low rounded-xl overflow-x-auto">
               {previewUrls.map((url, index) => (
                 <div key={index} className="relative flex-shrink-0">
                   <img src={url} alt={`Preview ${index}`} className="w-16 h-16 object-cover rounded-lg border border-outline-variant" />
                   <button onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-1 shadow-sm hover:opacity-90">
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ))}
             </div>
          )}

          <div className="flex items-center w-full">
            <label className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low cursor-pointer">
              <Camera className="w-5 h-5" />
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
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

            <button
              className="p-2 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center disabled:opacity-50"
              onClick={handleSend}
              disabled={isLoading || (!message.trim() && selectedImages.length === 0)}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-center mt-2 max-w-[800px] mx-auto">
          <span className="label-sm text-on-surface-variant/60 text-xs">
            Krishi Setu can make mistakes. Verify critical treatments.
          </span>
        </div>
      </div>
    </main>
  );
};

export default ExpertChat;