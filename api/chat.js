// api/chat.js - Vercel Edge Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Pesan diperlukan' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key tidak tersedia' });
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

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://integrated-multi-agentic-ai.vercel.app',
        'X-Title': 'Integrated Multi-Agentic AI'
      },
      body: JSON.stringify({
        model: "qwen/qwen-max", // Model tercanggih Qwen (gratis di OpenRouter)
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

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error('OpenRouter error:', error);
    res.status(500).json({ error: 'Gagal menghubungi AI backend' });
  }
}

export const config = {
  runtime: 'edge',
};
