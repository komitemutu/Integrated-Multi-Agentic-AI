// api/chat.js - Vercel API Route dengan integrasi Ollama GPT-OSS-20B
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Pesan diperlukan' });
    }
    
    // Cek ketersediaan API key untuk Ollama
    const ollamaApiKey = process.env.OLLAMA_API_KEY;
    if (!ollamaApiKey) {
      console.log('Ollama API key tidak tersedia, menggunakan fallback response');
      // Fallback response jika API key tidak tersedia
      const fallbackResponse = generateFallbackResponse(message);
      return res.status(200).json({ reply: fallbackResponse });
    }
    
    // Konteks ilmiah untuk multi-agentic response
    const systemPrompt = `
Anda adalah Integrated Multi-Agentic AI yang menggabungkan empat agen utama:
1. Biofisika: Gunakan data dari Protein Data Bank (PDB), AlphaFold DB, dan jurnal seperti Biophysical Journal.
2. Nanoteknologi: Referensi dari NanoHub, Nature Nanotechnology, dan IEEE.
3. Ilmu Kelautan: Gunakan data NOAA, Ocean Networks Canada, dan Global Ocean Observing System (GOOS).
4. Physical Intelligence: Fokus pada efisiensi energi, edge computing, dan neuromorphic hardware.
Respons harus:
- Berbasis data ilmiah terbaru (2023–2025)
- Menyertakan sumber jika relevan
- Menawarkan solusi multidisiplin
- Bahasa Indonesia formal dan jelas
Contoh data terbuka:
- PDB: https://www.rcsb.org
- NOAA Ocean Data: https://data.noaa.gov
- NanoHub: https://nanohub.org
- GOOS: https://goosocean.org
`;
    
    // Request ke Ollama API untuk GPT-OSS-20B
    const ollamaResponse = await fetch('https://api.ollama.com/api/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ollamaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-oss-20b",
        prompt: `${systemPrompt}\n\nUser: ${message}\nAssistant:`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 768,
          presence_penalty: 0.3,
          frequency_penalty: 0.3
        }
      })
    });
    
    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text();
      console.error('Ollama API error:', errorData);
      
      // Coba fallback ke OpenRouter jika Ollama gagal
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey) {
        console.log('Mencoba fallback ke OpenRouter API');
        try {
          const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://integrated-multi-agentic-ai.vercel.app',
              'X-Title': 'Integrated Multi-Agentic AI'
            },
            body: JSON.stringify({
              model: "qwen/qwen-max",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
              ],
              temperature: 0.7,
              max_tokens: 768,
              presence_penalty: 0.3,
              frequency_penalty: 0.3
            })
          });
          
          if (openRouterResponse.ok) {
            const data = await openRouterResponse.json();
            const reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";
            return res.status(200).json({ reply });
          }
        } catch (fallbackError) {
          console.error('OpenRouter fallback error:', fallbackError);
        }
      }
      
      // Jika semua API gagal, gunakan fallback response
      const fallbackResponse = generateFallbackResponse(message);
      return res.status(200).json({ reply: fallbackResponse });
    }
    
    const data = await ollamaResponse.json();
    const reply = data.response || "Maaf, saya tidak dapat merespons saat ini.";
    
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Server error:', error);
    
    // Jika terjadi error, gunakan fallback response
    const fallbackResponse = generateFallbackResponse(req.body?.message || "");
    return res.status(200).json({ reply: fallbackResponse });
  }
}

// Fallback response generator jika API tidak tersedia
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Database respons berdasarkan kata kunci
  const responses = {
    "struktur protein": "Struktur protein adalah organisasi tiga dimensi dari atom-atom dalam molekul protein. Struktur ini menentukan fungsi protein dalam tubuh. Dengan menggunakan teknologi seperti AlphaFold, kita sekarang dapat memprediksi struktur protein dengan akurasi tinggi, yang membantu dalam pengembangan obat dan terapi baru. Sumber: Protein Data Bank (https://www.rcsb.org)",
    
    "sensor nano": "Sensor nano adalah perangkat yang sangat kecil (nanometer) yang dapat mendeteksi perubahan lingkungan dengan sensitivitas tinggi. Aplikasinya meliputi deteksi penyakit dini, pemantauan lingkungan, dan keamanan. Sensor nano bekerja berdasarkan perubahan sifat listrik, mekanik, atau optik saat terpapar target spesifik. Sumber: NanoHub (https://nanohub.org)",
    
    "arus laut": "Arus laut adalah pergerakan massa air laut yang dipengaruhi oleh angin, perbedaan suhu, dan gravitasi. Arus laut memainkan peran penting dalam regulasi iklim global dengan mendistribusikan panas di seluruh samudra. Arus seperti Gulf Stream mempengaruhi cuaca di berbagai belahan dunia. Sumber: NOAA Ocean Data (https://data.noaa.gov)",
    
    "ai fisik": "Physical Intelligence adalah bidang AI yang berfokus pada sistem yang dapat berinteraksi dengan dunia fisik secara efisien. Ini mencakup edge computing, neuromorphic hardware, dan AI hemat energi. Tujuannya adalah menciptakan sistem AI yang dapat beroperasi dengan konsumsi daya minimal, mirip dengan otak manusia. Sumber: Nature Energy Journal",
    
    "default": "Sebagai Integrated Multi-Agentic AI, saya mengintegrasikan pengetahuan dari Biofisika, Nanoteknologi, Ilmu Kelautan, dan Physical Intelligence. Untuk pertanyaan Anda tentang '" + message + "', saya merekomendasikan untuk berkonsultasi dengan sumber ilmiah terkini atau memberikan lebih detail sehingga saya dapat memberikan jawaban yang lebih spesifik."
  };
  
  // Cocokkan kata kunci dalam pesan
  if (lowerMessage.includes("protein")) {
    return responses["struktur protein"];
  } else if (lowerMessage.includes("nano") || lowerMessage.includes("sensor")) {
    return responses["sensor nano"];
  } else if (lowerMessage.includes("arus") || lowerMessage.includes("laut") || lowerMessage.includes("ocean")) {
    return responses["arus laut"];
  } else if (lowerMessage.includes("fisik") || lowerMessage.includes("physical") || lowerMessage.includes("energi")) {
    return responses["ai fisik"];
  } else {
    return responses["default"];
  }
}
