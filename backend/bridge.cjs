cat > /workspaces/ETHV/backend/bridge.cjs << 'BRIDGE'
require('dotenv').config();
const { SuperDappAgent } = require('@superdapp/agents');
const axios = require('axios');
const express = require('express');

const API_TOKEN = process.env.SUPERDAPP_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const BACKEND_URL = process.env.BACKEND_URL || 'https://ethv-1.onrender.com';
const PORT = process.env.BRIDGE_PORT || 3004;

console.log('[ETHV] TOKEN:', API_TOKEN ? 'OK' : 'FALTA');
console.log('[ETHV] GROQ:', GROQ_API_KEY ? 'OK' : 'FALTA');

const agent = new SuperDappAgent({ apiToken: API_TOKEN, baseUrl: 'https://api.superdapp.ai' });
const app = express();
app.use(express.json());

// Detecta si el mensaje contiene un link de CV
function extractLink(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

// Descarga el archivo y lo convierte a base64
async function downloadFile(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  const filename = url.split('/').pop().split('?')[0] || 'cv.pdf';
  return { file: buffer.toString('base64'), filename };
}

// Llama al backend de análisis
async function analyzeCV(file, filename) {
  const response = await axios.post(`${BACKEND_URL}/api/analyze-cv`, { file, filename });
  return response.data;
}

// Formatea el resultado para el chat
function formatResult(data) {
  const skills = data.skills?.slice(0, 8).join(', ') || 'No detectados';
  const score = data.overall_score || '—';
  const level = data.level || '—';
  const roles = data.suggested_roles?.map(r => r.title || r).slice(0, 3).join(', ') || '—';

  return `📄 *Análisis de CV completado*

👤 ${data.name || 'Nombre no detectado'}
⭐ Score: ${score}/100 — Nivel: ${level}
💼 Roles sugeridos: ${roles}
🛠 Skills: ${skills}

Para más detalles visita: https://ethv-1.onrender.com`;
}

async function askGroq(message) {
  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'Eres ETHV, asistente de validacion de talento Web3. Responde en espanol, breve y util.' }, { role: 'user', content: message }], max_tokens: 500 },
      { headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json' } }
    );
    return r.data.choices[0].message.content;
  } catch(e) { return 'Error al procesar con IA.'; }
}

function extractText(payload) {
  try {
    const p = JSON.parse(payload.body);
    const i = JSON.parse(decodeURIComponent(p.m));
    return i.body || '';
  } catch(e) { return ''; }
}

agent.addCommand('/start', async ({ roomId }) => {
  await agent.sendConnectionMessage(roomId, '👋 Hola! Soy ETHV, tu asistente de validación de talento.\n\nEnvíame el link de tu CV (PDF) y lo analizo al instante.\n\nEjemplo: https://drive.google.com/tu-cv.pdf');
});

agent.addCommand('/hola', async ({ roomId }) => {
  await agent.sendConnectionMessage(roomId, '👋 Hola! Mándame el link de tu CV y te doy un análisis completo.');
});

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');
  try {
    const payload = req.body;
    if (payload?.challenge) return;

    const text = extractText(payload);
    const isBot = payload?.isBot || false;
    const isChannel = payload?.__typename === 'ChannelMessage';
    const roomId = payload?.roomId;

    console.log('[ETHV] msg:', text, 'channel:', isChannel, 'room:', roomId);

    if (!text || isBot) return;

    if (text.startsWith('/')) {
      await agent.processRequest(payload);
      return;
    }

    const send = async (msg) => {
      if (isChannel) await agent.sendChannelMessage(roomId, msg);
      else await agent.sendConnectionMessage(roomId, msg);
    };

    // Detecta link de CV
    const link = extractLink(text);
    if (link && (link.includes('.pdf') || link.includes('drive.google') || link.includes('dropbox') || text.toLowerCase().includes('cv') || text.toLowerCase().includes('analiz'))) {
      await send('⏳ Descargando y analizando tu CV... espera un momento.');
      try {
        const { file, filename } = await downloadFile(link);
        const result = await analyzeCV(file, filename);
        await send(formatResult(result));
      } catch(e) {
        console.error('[ETHV] CV error:', e.message);
        await send('❌ No pude analizar ese archivo. Asegúrate que el link sea público y sea PDF, DOCX o TXT.');
      }
      return;
    }

    // Respuesta general con Groq
    const reply = await askGroq(text);
    await send(reply);

  } catch(e) {
    console.error('[ETHV] Error:', e.message);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', version: 'cv-analysis' }));
app.listen(PORT, () => console.log('[ETHV] Puerto', PORT, 'listo'));
BRIDGE