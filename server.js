const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'audio/*', limit: '10mb' }));

const GOOGLE_API_KEY   = process.env.GOOGLE_API_KEY;
const ASSEMBLYAI_KEY   = process.env.ASSEMBLYAI_KEY;

if (!GOOGLE_API_KEY)  console.error('ERROR: GOOGLE_API_KEY is not set.');
if (!ASSEMBLYAI_KEY)  console.error('ERROR: ASSEMBLYAI_KEY is not set.');

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'Mesa proxy running',
    google: !!GOOGLE_API_KEY,
    assemblyai: !!ASSEMBLYAI_KEY
  });
});

// ── Translation (existing) ────────────────────────────────────
app.post('/translate', async (req, res) => {
  const { text, target } = req.body;
  if (!text || !target)    return res.status(400).json({ error: 'Missing text or target' });
  if (!GOOGLE_API_KEY)     return res.status(500).json({ error: 'Google key not configured' });

  try {
    const r = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target, format: 'text' })
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Translation failed' });
    res.json({ translated: data.data?.translations?.[0]?.translatedText });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Internal proxy error' });
  }
});

// ── Transcription via AssemblyAI ──────────────────────────────
//
//  Flow:
//    1. Frontend sends raw audio blob (webm/ogg) as binary POST
//    2. We upload it to AssemblyAI and get an upload_url back
//    3. We submit a transcription job (speaker_labels: true)
//    4. We poll until it's done (usually 3-8 seconds for short clips)
//    5. We return utterances: [{ speaker, text, start, end }]

app.post('/transcribe', async (req, res) => {
  if (!ASSEMBLYAI_KEY) return res.status(500).json({ error: 'AssemblyAI key not configured' });

  try {
    // 1 — Upload audio
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_KEY,
        'content-type': 'application/octet-stream'
      },
      body: req.body   // raw audio buffer
    });
    const { upload_url } = await uploadRes.json();
    if (!upload_url) return res.status(500).json({ error: 'Upload failed' });

    // 2 — Submit transcription job
    const submitRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: upload_url,
        speaker_labels: true,
        language_detection: true,

        // ── Custom vocabulary for the Archila family ──────────────
        // Nicknames, Spanglish, food, and places Whisper often mishears
        boost_param: "high",
        word_boost: [
          // Nicknames & names (+ phonetic variants for tricky ones)
          "Meches", "Mechis", "Meche", "Mèches", // grandmother — Whisper hears "Matches"
          "Cecca",
          "Neshito", "Neshito",
          "Kayak",
          "Wicho", "Wecho",                       // phonetic variants
          "Peta",
          "Archila", "Archilla",                  // common misspelling
          "Cucho",                                // the dog
          "Quico", "Kiko",                        // phonetic variant
          "Ash",
          "La Sadie", "Sadie",
          "Rejo", "Reho"                          // nickname for Regina

          // Spanish words mixed into English conversation
          "mija",
          "mijo",
          "ahorita",
          "ándale",
          "órale",
          "abuela",
          "tía",
          "frijoles",
          "postre",

          // Food
          "tamales",
          "empanadas",

          // Places
          "Charlottesville",
          "Maine"
        ]
      })
    });
    const { id } = await submitRes.json();
    if (!id) return res.status(500).json({ error: 'Transcription job failed to start' });

    // 3 — Poll for result (max 30s, every 1.5s)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const pollRes  = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { 'authorization': ASSEMBLYAI_KEY }
      });
      const result = await pollRes.json();

      if (result.status === 'completed') {
        return res.json({
          utterances: result.utterances || [],   // [{ speaker, text, start, end }]
          language:   result.language_code || 'en'
        });
      }
      if (result.status === 'error') {
        return res.status(500).json({ error: result.error || 'Transcription error' });
      }
      // status === 'processing' or 'queued' — keep polling
    }

    res.status(504).json({ error: 'Transcription timed out' });

  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Internal proxy error' });
  }
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mesa proxy listening on 0.0.0.0:${PORT}`);
});
