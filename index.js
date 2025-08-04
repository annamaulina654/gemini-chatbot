import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

const modelMapper = {
  flash: "gemini-2.5-flash",
  "flash-lite": "gemini-2.5-flash-lite",
  pro: "gemini-2.5-pro",
};

const determineGeminiModel = (key) => {
  return modelMapper[key] ?? GEMINI_MODEL;
};

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

function extractGeneratedText(data) {
  try {
    const text =
      data?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Error extracting text:", err);
    return JSON.stringify(data, null, 2);
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    if (!req.body) {
      return res.json(400, "Invalid request body!");
    }

    const { messages } = req.body;

    if (!messages) {
      return res.json(400, "Pesannya masih kosong nih!");
    }

    const payload = messages.map((msg) => {
      return {
        role: msg.role,
        parts: [{ text: msg.content }],
      };
    });

    const aiResponse = await ai.models.generateContent({
      model: determineGeminiModel("pro"),
      contents: payload,
      config: {
        systemInstruction:
          "Anda adalah asisten AI yang cerdas, andal, dan selalu siap memberikan informasi terbaik.",
      },
    });

    res.json({ reply: extractGeneratedText(aiResponse) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
