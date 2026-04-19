require('dotenv').config();
const { SuperDappAgent } = require('@superdapp/agents');
const axios = require('axios');
const express = require('express');

const API_TOKEN = process.env.SUPERDAPP_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const BACKEND_URL = process.env.BACKEND_URL || 'https://ethv.onrender.com';
const PORT = process.env.BRIDGE_PORT || 3004;
const MAX_TOOL_ROUNDS = 5;

console.log('[ETHV] TOKEN:', API_TOKEN ? 'OK' : 'FALTA');
console.log('[ETHV] GROQ:', GROQ_API_KEY ? 'OK' : 'FALTA');

const agent = new SuperDappAgent({ apiToken: API_TOKEN, baseUrl: 'https://api.superdapp.ai' });
const app = express();
app.use(express.json());

// ─── Memoria por sesión ───────────────────────────────────────────────────────
// sessions[roomId] = { cvData, history: [{role, content}], quizState }
const sessions = new Map();

function getSession(roomId) {
  if (!sessions.has(roomId)) {
    sessions.set(roomId, { cvData: null, history: [], quizState: null });
  }
  return sessions.get(roomId);
}

// ─── Tools disponibles para el LLM ───────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'analyze_cv',
      description: 'Descarga y analiza un CV desde una URL (Google Drive, Dropbox, link directo a PDF/DOCX). Devuelve nombre, skills, score, roles sugeridos, fortalezas y mejoras.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL del archivo CV (PDF o DOCX)' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'optimize_cv',
      description: 'Genera un CV optimizado para ATS basado en el CV previamente analizado del usuario.',
      parameters: {
        type: 'object',
        properties: {
          lang: { type: 'string', description: 'Idioma del CV: es o en', enum: ['es', 'en'] }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_cover_letter',
      description: 'Genera una carta de presentación profesional basada en el CV del usuario.',
      parameters: {
        type: 'object',
        properties: {
          job_title: { type: 'string', description: 'Puesto al que aplica (opcional)' },
          company: { type: 'string', description: 'Empresa destino (opcional)' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'start_skill_quiz',
      description: 'Inicia un quiz de validación de un skill técnico específico.',
      parameters: {
        type: 'object',
        properties: {
          skill: { type: 'string', description: 'Nombre del skill a evaluar (ej: SolidWorks, Solidity, React)' },
          level: { type: 'string', description: 'Nivel del quiz', enum: ['junior', 'mid', 'senior'], default: 'mid' }
        },
        required: ['skill']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_user_profile',
      description: 'Obtiene el perfil y datos del CV del usuario actual si fue analizado previamente.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// ─── Implementación de las tools ──────────────────────────────────────────────
async function convertDriveLink(url) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/uc?export=download&confirm=t&id=' + match[1];
  return url;
}

async function downloadFile(url) {
  const directUrl = await convertDriveLink(url);
  const response = await axios.get(directUrl, {
    responseType: 'arraybuffer',
    timeout: 20000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const buffer = Buffer.from(response.data);
  const filename = url.includes('drive.google') ? 'cv.pdf' : (url.split('/').pop().split('?')[0] || 'cv.pdf');
  return { file: buffer.toString('base64'), filename };
}

async function wakeBackend() {
  try {
    await axios.get(BACKEND_URL + '/health', { timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });
  } catch(e) {
    await new Promise(function(r) { setTimeout(r, 3000); });
  }
}

async function callBackend(endpoint, body) {
  const response = await axios.post(BACKEND_URL + endpoint, body, { timeout: 90000 });
  return response.data;
}

async function executeTool(toolName, args, session) {
  console.log('[TOOL]', toolName, JSON.stringify(args));

  if (toolName === 'analyze_cv') {
    await wakeBackend();
    const dl = await downloadFile(args.url);
    const result = await callBackend('/api/analyze-cv', { file: dl.file, filename: dl.filename });
    session.cvData = result;
    return JSON.stringify({
      name: result.name,
      location: result.location,
      current_position: result.current_position,
      company: result.company,
      skills: result.skills,
      experience_years: result.experience_years,
      score: result.overall_score,
      level: result.level,
      suggested_roles: result.suggested_roles,
      strengths: result.strengths,
      improvements: result.improvements,
      web3_relevance: result.web3_relevance
    });
  }

  if (toolName === 'optimize_cv') {
    if (!session.cvData) return JSON.stringify({ error: 'No hay CV analizado. Primero analiza tu CV.' });
    const result = await callBackend('/api/improve-cv', { cvData: session.cvData, lang: args.lang || 'es' });
    return JSON.stringify({
      ats_score: result.ats_score,
      professional_summary: result.professional_summary || result.summary,
      optimized_skills: result.skills,
      improvements_applied: result.improvements_applied
    });
  }

  if (toolName === 'generate_cover_letter') {
    if (!session.cvData) return JSON.stringify({ error: 'No hay CV analizado. Primero analiza tu CV.' });
    const cv = session.cvData;
    const target = args.job_title ? ' para el puesto de ' + args.job_title : '';
    const company = args.company ? ' en ' + args.company : '';
    const prompt = 'Genera una carta de presentacion profesional en espanol' + target + company + ' para ' + (cv.name || 'el candidato') + ', ' + (cv.current_position || 'profesional') + ' con ' + (cv.experience_years || '') + ' años de experiencia. Skills principales: ' + (cv.skills || []).slice(0, 5).join(', ') + '. Ubicacion: ' + (cv.location || 'Peru') + '. La carta debe ser formal, de 3 parrafos, lista para enviar a un reclutador. Solo devuelve la carta, sin explicaciones.';
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 600 },
      { headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json' } }
    );
    return JSON.stringify({ cover_letter: response.data.choices[0].message.content });
  }

  if (toolName === 'start_skill_quiz') {
    const result = await callBackend('/api/generate-quiz', { skill: args.skill, level: args.level || 'mid', lang: 'es' });
    const questions = result.questions || [];
    if (!questions.length) return JSON.stringify({ error: 'No se pudo generar el quiz.' });
    session.quizState = { skill: args.skill, questions, current: 0, answers: [] };
    const q = questions[0];
    return JSON.stringify({
      quiz_started: true,
      skill: args.skill,
      total_questions: questions.length,
      first_question: q.question,
      options: q.options || null
    });
  }

  if (toolName === 'get_user_profile') {
    if (!session.cvData) return JSON.stringify({ error: 'No hay CV analizado aún.' });
    return JSON.stringify(session.cvData);
  }

  return JSON.stringify({ error: 'Tool desconocida: ' + toolName });
}

// ─── Loop del agente (ReAct) ─────────────────────────────────────────────────
async function runAgent(userMessage, session) {
  // Actualizar historial
  session.history.push({ role: 'user', content: userMessage });

  // Limitar historial a últimas 10 turns para no saturar el contexto
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }

  const systemPrompt = 'Eres ETHV, un agente inteligente de validacion de talento Web3. Ayudas a profesionales a analizar su CV, validar sus skills y encontrar oportunidades en el ecosistema blockchain/Web3.\n\nTienes acceso a herramientas reales. Cuando el usuario te pida algo que requiera una herramienta, USALA en lugar de inventar respuestas.\n\nReglas:\n- Si el usuario manda un link que parece un CV (Google Drive, PDF, DOCX), llama analyze_cv automaticamente.\n- Si el usuario pide optimizar su CV, llama optimize_cv.\n- Si el usuario pide carta de presentacion, llama generate_cover_letter.\n- Si el usuario quiere validar un skill, llama start_skill_quiz.\n- Responde siempre en español, de forma breve y util.\n- Cuando devuelvas resultados de tools, presendalos de forma clara y estructurada.';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.history
  ];

  let rounds = 0;
  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        max_tokens: 800
      },
      { headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json' } }
    );

    const choice = response.data.choices[0];
    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    // Si el LLM no pide tools → respuesta final
    if (choice.finish_reason !== 'tool_calls' || !assistantMsg.tool_calls) {
      const finalText = assistantMsg.content || 'Listo!';
      session.history.push({ role: 'assistant', content: finalText });
      return finalText;
    }

    // Ejecutar cada tool que pidió el LLM
    for (const toolCall of assistantMsg.tool_calls) {
      const toolName = toolCall.function.name;
      let args = {};
      try { args = JSON.parse(toolCall.function.arguments); } catch(e) {}

      let toolResult;
      try {
        toolResult = await executeTool(toolName, args, session);
      } catch(e) {
        console.error('[TOOL ERROR]', toolName, e.message);
        toolResult = JSON.stringify({ error: e.message });
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult
      });
    }
    // Siguiente iteración: el LLM ve los resultados y decide si necesita más tools o responde
  }

  return 'Lo siento, no pude completar la acción. Intenta de nuevo.';
}

// ─── Procesamiento de mensajes ────────────────────────────────────────────────
function extractText(payload) {
  try {
    const p = JSON.parse(payload.body);
    const i = JSON.parse(decodeURIComponent(p.m));
    return i.body || '';
  } catch(e) { return ''; }
}

async function send(isChannel, roomId, chatId, msg) {
  if (isChannel) {
    await agent.sendChannelMessage(roomId, msg);
  } else {
    await agent.sendConnectionMessage(chatId || roomId, msg);
  }
}

app.post('/webhook', async function(req, res) {
  res.status(200).send('OK');
  try {
    const payload = req.body;
    if (payload && payload.challenge) return;

    const text = extractText(payload);
    const isBot = payload && payload.isBot;
    const isChannel = payload && payload.__typename === 'ChannelMessage';
    const roomId = payload && payload.roomId;
    const chatId = payload && payload.chatId;

    console.log('[ETHV] msg:', text ? text.substring(0, 80) : '', '| channel:', isChannel, '| room:', roomId);

    if (!text || isBot) return;

    const session = getSession(roomId);

    // Si hay un quiz activo, procesar respuesta
    if (session.quizState && !text.startsWith('/')) {
      const quiz = session.quizState;
      quiz.answers.push(text.trim());
      quiz.current++;

      if (quiz.current < quiz.questions.length) {
        const q = quiz.questions[quiz.current];
        let msg = 'Pregunta ' + (quiz.current + 1) + '/' + quiz.questions.length + '\n\n' + q.question;
        if (q.options) msg += '\n\n' + q.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('\n');
        await send(isChannel, roomId, chatId, msg);
      } else {
        // Quiz terminado — el agente evalúa las respuestas
        const quizSummary = 'El usuario completó el quiz de ' + quiz.skill + '. Preguntas: ' + JSON.stringify(quiz.questions.map(function(q) { return q.question; })) + '. Respuestas del usuario: ' + JSON.stringify(quiz.answers) + '. Evalúa su nivel, qué sabe bien y qué debe mejorar.';
        session.quizState = null;
        const evaluation = await runAgent(quizSummary, session);
        await send(isChannel, roomId, chatId, 'Quiz completado!\n\n' + evaluation);
      }
      return;
    }

    // Agente maneja el mensaje con tool calling
    const reply = await runAgent(text, session);
    await send(isChannel, roomId, chatId, reply);

    // Si el agente inició un quiz, enviar la primera pregunta
    if (session.quizState && session.quizState.current === 0) {
      const q = session.quizState.questions[0];
      let msg = 'Pregunta 1/' + session.quizState.questions.length + '\n\n' + q.question;
      if (q.options) msg += '\n\n' + q.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('\n');
      await send(isChannel, roomId, chatId, msg);
    }

  } catch(e) {
    console.error('[ETHV] Webhook error:', e.message);
  }
});

app.get('/health', function(req, res) {
  res.json({ status: 'ok', version: 'agent-v1', sessions: sessions.size });
});

// Keep-alive del backend en Render
setInterval(function() {
  axios.get(BACKEND_URL + '/health').catch(function() {});
}, 14 * 60 * 1000);

app.listen(PORT, function() { console.log('[ETHV] Agente listo en puerto', PORT); });
