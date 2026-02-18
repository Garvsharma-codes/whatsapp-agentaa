import OpenAI from 'openai';

// Your key is already included here
const OPENROUTER_API_KEY = "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"; 

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "ModelChecker",
  }
});

async function main() {
  try {
    console.log("🔍 Scanning OpenRouter for FREE models...");
    const list = await openai.models.list();
    
    // Filter for models that have 'free' in the ID
    const freeModels = list.data
        .filter(model => model.id.toLowerCase().includes("free"))
        .map(model => model.id);

    if (freeModels.length > 0) {
        console.log("\n✅ WORKABLE FREE MODELS FOUND:");
        freeModels.forEach(id => console.log(`"${id}"`));
        console.log("\n👉 Copy one of the IDs above and paste it into your bot code!");
    } else {
        console.log("❌ No models labeled 'free' were found. Listing top 5 cheap models:");
        list.data.slice(0, 5).forEach(m => console.log(m.id));
    }

  } catch (error) {
    console.error("❌ Error scanning models:", error.message);
  }
}

main();
