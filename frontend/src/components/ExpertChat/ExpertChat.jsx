import { useState } from "react";
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
} from "lucide-react";

const symptoms = [
  "Yellowing angular lesions",
  "Purplish-gray fuzz on underside",
  "Rapid spread in humid conditions",
];

const treatmentSteps = [
  {
    title: "Improve air circulation:",
    text: "Space plants properly and prune affected leaves immediately to reduce humidity around the canopy.",
  },
  {
    title: "Apply organic copper fungicide:",
    text: "Spray early in the morning, ensuring coverage on the undersides of leaves where spores develop.",
  },
  {
    title: "Avoid overhead watering:",
    text: "Use drip irrigation to keep foliage dry, as wet leaves encourage fungal spread.",
  },
];

const ExpertChat = () => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    // wire up send-message logic here
    setMessage("");
  };

  return (
    <main className="flex-1 flex flex-col relative bg-surface-bright overflow-hidden">
      <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop scroll-smooth">
        <div className="max-w-[800px] mx-auto flex flex-col gap-md pb-xl">
          {/* Date separator */}
          <div className="flex justify-center my-4">
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full label-sm">
              Today
            </span>
          </div>

          {/* User message */}
          <div className="flex flex-col gap-sm items-end w-full">
            <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm p-4 max-w-[85%] shadow-sm relative">
              <p className="body-md">
                Hello, my cucumber plant leaves are starting to turn yellow with some fuzzy
                patches underneath. What could be the issue?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-sm w-full max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0 mt-1">
              <Bot className="w-[18px] h-[18px]" />
            </div>
            <div className="flex flex-col gap-md">
              <div className="bg-surface rounded-2xl rounded-tl-sm p-5 border border-outline-variant shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-tertiary-container"></div>
                <div className="flex items-start justify-between mb-sm pl-2">
                  <h3 className="title-md text-on-surface flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-tertiary-container" />
                    Diagnosis: Downy Mildew
                  </h3>
                  <span className="bg-error-container text-on-error-container px-2 py-1 rounded-md label-sm flex items-center gap-1">
                    <AlertCircle className="w-[14px] h-[14px]" /> High Alert
                  </span>
                </div>

                <div className="pl-2">
                  <p className="body-md text-on-surface-variant mb-4">
                    Based on your description of yellowing leaves with fuzzy patches
                    underneath, this is highly likely Downy Mildew, a common fungal disease
                    affecting cucurbits.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="rounded-lg overflow-hidden border border-outline-variant">
                      <img
                        className="w-full h-32 object-cover"
                        alt="Cucumber leaf showing angular yellow patches typical of downy mildew"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5Et86O3GNVKSCy3YW2C47dJSeJRQtR-ECWJ2sDcwCHF0LTq_ItVlSv2kTHyO61K-R7DfUiPGA7gZdlX6M4J-WkfpIrLRSqeDRq1mRbCsoq2KqTqt2BwygAm1ed0K9B9Y3OuNk-_F-u_pv39cf5oJtN42S5Oif-D0-qNcwvM_oQsth7wZsZdVzCiLbGuM1JPMH3HWp2Rf3bsdEhisn-SJZB2xJwHXDglte_6AAiF7BeLOqpgRN5chSJQ"
                      />
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-center">
                      <p className="label-sm text-on-surface mb-1 font-semibold">
                        Key Symptoms Identified:
                      </p>
                      <ul className="body-md text-on-surface-variant list-disc pl-4 space-y-1">
                        {symptoms.map((symptom) => (
                          <li key={symptom}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-md border-t border-outline-variant pt-4">
                    <h4 className="label-sm text-on-surface font-semibold mb-2">
                      Recommended Treatment Plan:
                    </h4>
                    <ol className="body-md text-on-surface-variant space-y-3">
                      {treatmentSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            {idx + 1}
                          </div>
                          <span>
                            <strong>{step.title}</strong> {step.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pl-2">
                <button className="px-3 py-1.5 border border-outline-variant rounded-full label-sm text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" /> Helpful
                </button>
                <button className="px-3 py-1.5 border border-outline-variant rounded-full label-sm text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" /> Buy Fungicide
                </button>
                <button className="px-3 py-1.5 border border-outline-variant rounded-full label-sm text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                  <ImagePlus className="w-4 h-4" /> Upload Photo to Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-surface-bright via-surface-bright to-transparent pt-12">
        <div className="max-w-[800px] mx-auto relative">
          <div className="bg-surface flex items-center rounded-2xl border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low">
              <PlusCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low">
              <Camera className="w-5 h-5" />
            </button>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 body-md text-on-surface placeholder:text-on-surface-variant/60 py-2 px-2"
              placeholder="Ask about your crops, soil, or weather..."
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low mr-1">
              <Mic className="w-5 h-5" />
            </button>
            <button
              className="p-2 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center"
              onClick={handleSend}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="label-sm text-on-surface-variant/60 text-xs">
              AgriExpert AI can make mistakes. Verify critical treatments.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExpertChat;