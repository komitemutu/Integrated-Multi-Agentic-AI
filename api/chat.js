// api/chat.js
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

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-vercel-app.vercel.app', // Ganti dengan URL Anda
        'X-Title': 'Multi-Agentic AI Integrator'
      },
      body: JSON.stringify({
        model: "qwen/qwen-32b", // Model Qwen terbaik, bisa diganti "qwen/qwen-max" jika tersedia gratis
        messages: [
          {
            role: "system",
            content: `Anda adalah Integrated Multi-Agentic AI yang menggabungkan keahlian Biofisika, Nanoteknologi, Ilmu Kelautan Terapan, dan Physical Intelligence. Berikan jawaban yang mendalam, inovatif, dan multidisipliner.`
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error('OpenRouter error:', error);
    res.status(500).json({ error: 'Gagal menghubungi AI' });
  }
}

export const config = {
  runtime: 'edge',
};
