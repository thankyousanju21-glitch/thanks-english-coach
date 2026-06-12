import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocketServer } from "ws";
import * as http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      
      const rawPersonality = url.searchParams.get("personality");
      const isMaleTutor = rawPersonality === "Mr. Sanju" || rawPersonality === "Charon";
      const tutorName = isMaleTutor ? "Mr. Sanju" : "Ms. Pratigy";
      const personality = isMaleTutor ? "Charon" : "Kore";
      
      const mode = url.searchParams.get("mode") || "Conversation";
      const pace = url.searchParams.get("pace") || "Normal";
      const language = url.searchParams.get("language") || "English";
      const replyLength = url.searchParams.get("replyLength") || "Medium";
      const historyContext = url.searchParams.get("historyContext") || "";
      const userApiKey = url.searchParams.get("apiKey");
      const userName = url.searchParams.get("userName") || "User";
      const userGender = url.searchParams.get("userGender") || "";
      const grammarCorrection = url.searchParams.get("grammarCorrection") !== "false";
      const thinkingLanguage = url.searchParams.get("thinkingLanguage") || "Hindi";
      
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      
      let replyConstraint = "Keep responses natural, around 3-4 sentences.";
      if (replyLength === "Short") {
         replyConstraint = "Your spoken responses must be hyper-concise, conversational, and restricted to 1-2 short sentences maximum.";
      } else if (replyLength === "Long") {
         replyConstraint = "Provide detailed corrections and step-by-step vocabulary explanations.";
      }

      const grammarCorrectionInstruction = grammarCorrection 
        ? "CRITICAL RULE FOR EVERY RESPONSE: 1) First, reply naturally to what the user said to continue the conversation. 2) SECOND, explicitly correct any grammatical mistakes the user made in their previous turn. Always clearly separate the conversational reply from the grammar feedback."
        : "Do not correct grammatical mistakes.";

      const codeSwitchingInstruction = `You are aware that the user's secondary language is ${thinkingLanguage}. Actively monitor the user's incoming streaming text transcripts for code-switching behavior, where they accidentally slide phrases from their native language into an English sentence because they are stuck.\nThe moment you detect a native language phrase slip mid-sentence, gently interrupt them conversationally. Do not scold them. State clearly what word or phrase they used in their native language, provide the natural English professional translation alternative, and instruct them to try repeating that specific sentence again in full English before moving forward.`;

      let modeInstruction = `Start by greeting the student by their name, introducing yourself as ${tutorName} in ${language}, and kick off the conversation based on the ${mode} mode. Do NOT list out or read the historical summaries to the user. Start the conversation natively as a fresh greeting for the day (e.g., 'Hello ${userName}! Ready for today's practice?'). Use the background data silently to guide your vocabulary and grammar feedback loop.`;
      let initialPrompt = `System Instruction: The user has just connected. You must speak first. Greet the user by their name (${userName}), introduce yourself as ${tutorName}, and start the ${language} language practice in the ${mode} scenario now.`;

      if (mode === "Pronunciation") {
        modeInstruction = `Start by greeting the student by their name and introducing yourself as ${tutorName}. Explain that today's focus is on Pronunciation. Give the user a short, simple sentence in ${language} and ask them to repeat it back to you out loud. 
When they reply, evaluate their pronunciation based on the audio you hear. Give them constructive feedback on their pronunciation, then provide a new sentence for them to try. Keep sentences short. Do not ask conversational questions. Only give sentences to pronounce.`;
        initialPrompt = `System Instruction: The user has just connected. You must speak first. Greet the user by their name (${userName}), introduce yourself as ${tutorName}, and give them their first short ${language} sentence to pronounce.`;
      }

      const ai = new GoogleGenAI({ apiKey });
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            console.log("LiveServerMessage:", JSON.stringify(message).substring(0, 200));
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({ text: part.text }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: personality } },
          },
          systemInstruction: `You are a friendly and professional language tutor with an Indian accent, named ${tutorName}.
We are practicing the language: ${language}, in the context mode: ${mode}. The user wants to speak at a ${pace} pace.
The student you are teaching is named ${userName}${userGender ? ` (Gender: ${userGender})` : ''}.

${modeInstruction}

Here is the 14-day background data of previous chats (for silent guiding only):
${historyContext}

${replyConstraint}

${grammarCorrectionInstruction}

${codeSwitchingInstruction}

CRITICAL INSTRUCTION: Your core focus is solely on language learning. If the user tries to talk about unrelated or off-topic subjects (for example, if they selected "Interview" but start talking about the Milky Way, or ask for general facts outside the scenario), you MUST gently remind them that they are here to practice ${language} in a ${mode} context, and steer the conversation back on track. Do not answer off-topic questions.`,
        },
      });

      // Send auto-start message so the AI begins talking first
      try {
         session.sendClientContent({ turns: [{ role: "user", parts: [{ text: initialPrompt }] }] });
      } catch (e) {
         try {
           session.send(initialPrompt);
         } catch(e2) {
           console.warn("Could not send initial prompt", e2);
         }
      }

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Parse error on message:", e);
        }
      });

      clientWs.on("close", () => {
        // Use a background cleanup instead of blocking
        try {
          session.sendRealtimeInput({}); // No explicit close on session in SDK, but good practice if existed
        } catch (e) { }
      });
      
    } catch (e) {
      console.error("Live connection fail:", e);
      clientWs.close();
    }
  });

  // API routes FIRST
  app.use(express.json());

  // Allow Cross-Origin requests (CORS) from Capacitor's localhost
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.post("/api/generate-report", async (req, res) => {
    try {
      const { logs, settings } = req.body;
      const apiKey = settings?.apiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(401).json({ error: "Missing API Key" });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const transcriptData = logs && logs.length > 0 
        ? logs.join("\n") 
        : "(Transcript not available for this session due to mobile platform limitations. The session was conducted via voice. Please generate a general encouraging report for the student based on the fact that they successfully completed a voice practice session.)";

      const prompt = `Based on the following AI responses during an English language tutoring session, generate a structured progress report for the student (${settings?.userName || 'the student'}). Ensure the report is extremely plain text formatted, avoiding heavy markdown since it will be exported directly. Do NOT include greetings, just output the facts under exactly these four headers:

[USER PERFORMANCE SUMMARY]
(Brief overview of how the session went)

[STRONG POINTS]
(2-3 bullet points of what they did well)

[WEAK POINTS & GRAMMAR FLAGS]
(2-3 bullet points of areas needing improvement)

[TOMORROW'S FOCUS AREAS]
(Actionable goals for the next session)

Session Transcript Data:
${transcriptData}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      res.json({ report: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate report" });
    }
  });

  app.get("/api/version", (req, res) => {
    res.json({
      latest_version_code: 4,
      apk_url: "https://drive.google.com/file/d/1kAHMBq4rvJ98wUX_TwMMhzMRluKd1HSS/view?usp=sharing"
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
