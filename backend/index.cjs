// ETHV Backend Server
require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// SWAGGER
// ============================================
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ETHV API',
      version: '1.0.0',
      description: 'API de análisis de talento Web3 — CV, LinkedIn y certificación on-chain.',
    },
    servers: [
      { url: 'https://ethv.onrender.com', description: 'Producción' },
      { url: 'http://localhost:3003', description: 'Local' },
    ],
  },
  apis: [],
});

swaggerSpec.paths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Healthcheck',
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string' } } } } } } },
    },
  },
  '/api/analyze-cv': {
    post: {
      tags: ['CV'],
      summary: 'Analizar CV',
      description: 'Recibe archivo en base64, extrae texto y analiza con OpenClaw AI. Soporta PDF, DOCX, TXT, MD.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['file', 'filename'],
              properties: {
                file: { type: 'string', description: 'Archivo en base64' },
                filename: { type: 'string', example: 'cv.pdf' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Análisis completo del CV',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  location: { type: 'string' },
                  linkedin: { type: 'string' },
                  github: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } },
                  experience_years: { type: 'integer' },
                  score: { type: 'integer', description: '0-100' },
                  ats_score: { type: 'integer', description: '0-100' },
                  level: { type: 'string', enum: ['Entry-Level', 'Junior', 'Mid-Level', 'Senior'] },
                  web3_relevance: { type: 'string', enum: ['high', 'medium', 'low'] },
                  dimensions: { type: 'object', properties: { ats: { type: 'integer' }, enfoque: { type: 'integer' }, impacto: { type: 'integer' }, claridad: { type: 'integer' }, contacto: { type: 'integer' }, legibilidad: { type: 'integer' } } },
                  suggested_roles: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, match_percentage: { type: 'integer' } } } },
                  strengths: { type: 'array', items: { type: 'string' } },
                  improvements: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        400: { description: 'No se proporcionó archivo' },
        500: { description: 'Error del servidor' },
      },
    },
  },
  '/api/linkedin-scrape': {
    post: {
      tags: ['LinkedIn'],
      summary: 'Scraping de perfil LinkedIn',
      description: 'Obtiene el perfil vía Jina AI y extrae skills y relevancia Web3.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['url'], properties: { url: { type: 'string', example: 'https://linkedin.com/in/usuario' } } },
          },
        },
      },
      responses: {
        200: { description: 'Perfil scrapeado con skills y web3_relevance' },
        400: { description: 'URL inválida' },
      },
    },
  },
  '/api/analyze-profile': {
    post: {
      tags: ['LinkedIn'],
      summary: 'Análisis de perfil con IA',
      description: 'Analiza texto de un perfil con OpenClaw AI.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', description: 'Texto crudo del perfil' } } },
          },
        },
      },
      responses: {
        200: { description: 'JSON con skills, experiencia, educación y web3_relevance' },
        400: { description: 'Contenido demasiado corto' },
      },
    },
  },
  '/v1/chat/completions': {
    post: {
      tags: ['AI'],
      summary: 'Proxy a OpenClaw AI',
      description: 'Pasa el request a OpenClaw (MiniMax-M2.5). Formato compatible con OpenAI.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['model', 'messages'],
              properties: {
                model: { type: 'string', example: 'MiniMax-M2.5' },
                messages: { type: 'array', items: { type: 'object', properties: { role: { type: 'string', enum: ['user', 'assistant', 'system'] }, content: { type: 'string' } } } },
                max_tokens: { type: 'integer', example: 2000 },
                temperature: { type: 'number', example: 0.3 },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Respuesta de OpenClaw AI' } },
    },
  },
};

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ETHV API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
}));
app.get('/swagger.json', (req, res) => res.json(swaggerSpec));

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/anthropic';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M2.5';
const JINA_URL = process.env.JINA_URL || 'https://r.jina.ai/';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

app.use((req, res, next) => {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ethv-backend' });
});

// ============================================
// SCORING FUNCTIONS
// ============================================

function calculateOverallScore(data) {
  let score = 0;
  if (data.name) score += 3;
  if (data.email) score += 3;
  if (data.phone) score += 2;
  if (data.location) score += 2;
  if (data.linkedin) score += 3;
  if (data.github || data.portfolio) score += 2;
  if (data.summary && data.summary.length > 50) score += 10;
  if (data.experience_years) {
    if (data.experience_years >= 1) score += 5;
    if (data.experience_years >= 3) score += 5;
    if (data.experience_years >= 5) score += 5;
    if (data.experience_years >= 10) score += 5;
  }
  if (data.current_position) score += 10;
  if (data.skills) {
    if (data.skills.length >= 3) score += 5;
    if (data.skills.length >= 5) score += 5;
    if (data.skills.length >= 10) score += 5;
    if (data.skills.length >= 15) score += 5;
  }
  if (data.education && data.education.length > 0) score += 10;
  if (data.certifications && data.certifications.length > 0) score += 5;
  return Math.min(100, score);
}

function calculateATSScore(data) {
  let score = 40;
  if (data.name && data.email) score += 8;
  if (data.summary && data.summary.length > 30) score += 8;
  if (data.experience_years && data.experience_years > 0) score += 10;
  if (data.skills && data.skills.length > 0) score += 12;
  if (data.education && data.education.length > 0) score += 8;
  if (!data.name) score -= 10;
  if (!data.email) score -= 10;
  if (!data.skills || data.skills.length === 0) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function calculateDimensions(data) {
  const summary = data.summary || '';
  const hasContact = data.name && data.email;
  const ats = calculateATSScore(data);

  let enfoque = 50;
  if (data.current_position) enfoque += 15;
  if (summary.length > 30) enfoque += 15;
  if (data.experience_years >= 3) enfoque += 10;
  if (data.experience_years >= 5) enfoque += 10;

  let impacto = 40;
  const hasImpactWords = ['achieved', 'managed', 'increased', 'reduced', 'led'].some(w => summary.toLowerCase().includes(w));
  if (hasImpactWords) impacto += 20;
  if (data.certifications && data.certifications.length > 0) impacto += 15;
  if ((data.skills || []).length >= 5) impacto += 15;

  let claridad = 60;
  if (summary.length > 20 && summary.length < 300) claridad += 20;
  if (hasContact) claridad += 10;
  if (data.current_position) claridad += 10;

  let contacto = 20;
  if (data.name) contacto += 15;
  if (data.email) contacto += 15;
  if (data.phone) contacto += 15;
  if (data.location) contacto += 10;
  if (data.linkedin) contacto += 10;
  if (data.github || data.portfolio) contacto += 15;

  let legibilidad = 70;
  if (summary.length > 20 && summary.length < 500) legibilidad += 15;
  if (data.education && data.education.length > 0) legibilidad += 10;
  if (data.languages && data.languages.length > 0) legibilidad += 5;

  return {
    ats: Math.min(100, ats),
    enfoque: Math.min(100, enfoque),
    impacto: Math.min(100, impacto),
    claridad: Math.min(100, claridad),
    contacto: Math.min(100, contacto),
    legibilidad: Math.min(100, legibilidad)
  };
}

function suggestRoles(data) {
  const skills = (data.skills || []).map(s => s.toLowerCase());
  const position = (data.current_position || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();

  const roleTemplates = [
    { title: 'Blockchain Developer', keywords: ['solidity', 'web3', 'ethereum', 'defi', 'smart contract', 'nft'] },
    { title: 'Frontend Developer', keywords: ['react', 'javascript', 'typescript', 'css', 'html', 'vue', 'angular'] },
    { title: 'Backend Developer', keywords: ['nodejs', 'python', 'api', 'database', 'sql', 'aws', 'docker'] },
    { title: 'Full Stack Developer', keywords: ['react', 'nodejs', 'typescript', 'javascript', 'full stack'] },
    { title: 'Data Analyst', keywords: ['python', 'data', 'analytics', 'visualization', 'sql', 'tableau'] },
    { title: 'Product Manager', keywords: ['product', 'agile', 'scrum', 'roadmap', 'stakeholder'] },
    { title: 'DevOps Engineer', keywords: ['devops', 'aws', 'docker', 'kubernetes', 'ci/cd', 'terraform'] }
  ];

  return roleTemplates
    .map(role => {
      const matched = role.keywords.filter(k => skills.includes(k) || position.includes(k) || summary.includes(k));
      return {
        title: role.title,
        match_percentage: Math.round((matched.length / role.keywords.length) * 100),
        missing_skills: role.keywords.filter(k => !matched.includes(k)).slice(0, 3)
      };
    })
    .filter(r => r.match_percentage > 0)
    .sort((a, b) => b.match_percentage - a.match_percentage)
    .slice(0, 3);
}

function calculateStats(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const commonTypos = ['teh', 'thier', 'recieve', 'occured', 'seperate'];
  return {
    word_count: words.length,
    reading_time_minutes: Math.max(1, Math.ceil(words.length / 200)),
    spelling_score: commonTypos.some(t => text.toLowerCase().includes(t)) ? 85 : 100
  };
}

function generateStrengths(data) {
  const s = [];
  if (data.skills && data.skills.length >= 5) s.push(`Strong skill set with ${data.skills.length} identified skills`);
  if (data.certifications && data.certifications.length > 0) s.push(`${data.certifications.length} certifications documented`);
  if (data.experience_years >= 3) s.push(`Solid experience with ${data.experience_years} years in the field`);
  if (data.linkedin) s.push('LinkedIn profile linked');
  if (data.github) s.push('GitHub portfolio available');
  if (data.summary && data.summary.length > 100) s.push('Comprehensive professional summary');
  if (data.education && data.education.length > 0) s.push('Educational background documented');
  return s;
}

function generateImprovements(data) {
  const i = [];
  if (!data.name) i.push('Add your full name');
  if (!data.email) i.push('Include a contact email');
  if (!data.phone) i.push('Add phone number');
  if (!data.linkedin) i.push('Include LinkedIn profile URL');
  if (!data.github && !data.portfolio) i.push('Add portfolio or GitHub link');
  if (!data.summary) i.push('Write a professional summary');
  if (!data.certifications || data.certifications.length === 0) i.push('Consider adding relevant certifications');
  if (data.skills && data.skills.length < 5) i.push('Add more relevant skills');
  return i;
}

function estimateLevel(data) {
  const exp = data.experience_years || 0;
  const skills = data.skills ? data.skills.length : 0;
  if (exp >= 8 && skills >= 10) return 'Senior';
  if (exp >= 5 && skills >= 7) return 'Mid-Level';
  if (exp >= 2 && skills >= 4) return 'Junior';
  return 'Entry-Level';
}

// ============================================
// SUPABASE
// ============================================

async function saveToSupabase(data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[Supabase] Not configured, skipping save');
    return { success: false, reason: 'not configured' };
  }

  const payload = {
    email: data.email || null,
    name: data.name || null,
    phone: data.phone || null,
    location: data.location || null,
    linkedin: data.linkedin || null,
    github: data.github || null,
    portfolio: data.portfolio || null,
    current_position: data.current_position || null,
    company: data.company || null,
    experience_years: data.experience_years || 0,
    overall_score: data.score || 0,
    ats_score: data.ats_score || 0,
    estimated_level: data.level || null,
    summary: data.summary || null,
    web3_relevance: data.web3_relevance || 'low',
    skills: data.skills ? JSON.stringify(data.skills) : null,
    certifications: data.certifications ? JSON.stringify(data.certifications) : null,
    education: data.education ? JSON.stringify(data.education) : null,
    languages: data.languages ? JSON.stringify(data.languages) : null,
    raw_response: JSON.stringify(data),
    created_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cv_analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Supabase] Error:', error);
      return { success: false, error };
    }

    console.log('[Supabase] CV guardado OK');
    return { success: true };
  } catch (err) {
    console.error('[Supabase] Exception:', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================
// OCR / TEXT EXTRACTION
// ============================================

async function extractTextFromFile(fileBuffer, filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();

  // Archivos de texto plano
  if (ext === 'txt' || ext === 'md') {
    return fileBuffer.toString('utf-8');
  }

  // DOCX con mammoth
  if (ext === 'docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (result.value && result.value.trim().length > 50) {
        console.log('[OCR] Texto extraído con mammoth, chars:', result.value.length);
        return result.value;
      }
    } catch (e) {
      console.log('[OCR] mammoth falló:', e.message);
    }
  }

  // PDF: extraer texto con pdf-parse
  if (ext === 'pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(fileBuffer);
      if (result.text && result.text.trim().length > 20) {
        console.log('[OCR] pdf-parse extrajo', result.text.length, 'chars');
        return result.text;
      }
    } catch (e) {
      console.log('[OCR] pdf-parse falló:', e.message);
    }

    console.log('[OCR] No se pudo extraer texto del PDF');
    return '';
  }

  // Fallback: Tesseract OCR (solo para imágenes, NO para PDFs)
  try {
    const { createWorker } = require('tesseract.js');
    console.log('[OCR] Iniciando Tesseract...');
    const worker = await createWorker('spa+eng');
    const { data: { text } } = await worker.recognize(fileBuffer);
    await worker.terminate();
    console.log('[OCR] Tesseract extrajo', text.length, 'chars');
    return text;
  } catch (e) {
    console.log('[OCR] Tesseract falló:', e.message);
    return '';
  }
}

// ============================================
// ANÁLISIS CON MINIMAX (Anthropic Messages API)
// ============================================

function callMiniMax(prompt, maxTokens = 4096, prefillAssistant = null) {

  console.log('[MiniMax] Prompt length:', prompt.length);
  console.log('[MiniMax] prompt:', prompt);

  return new Promise((resolve, reject) => {
    const messages = [{ role: 'user', content: prompt }];
    // Prefill forces model to continue from this string — skips thinking preamble
    if (prefillAssistant) {
      messages.push({ role: 'assistant', content: prefillAssistant });
    }
    const payload = { model: MINIMAX_MODEL, max_tokens: maxTokens, messages };
    const body = JSON.stringify(payload);

    const url = new URL(MINIMAX_BASE_URL + '/v1/messages');

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'x-api-key': MINIMAX_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('[MiniMax] HTTP status:', res.statusCode);
        console.log('[MiniMax] Raw response:', data.slice(0, 500));
        try {
          const parsed = JSON.parse(data);
          const textBlock = (parsed?.content || []).find(c => c.type === 'text');
          let text = textBlock?.text || '';
          // If we used prefill, prepend it back since model continues from there
          if (prefillAssistant && !text.trimStart().startsWith(prefillAssistant)) {
            text = prefillAssistant + text;
          }
          console.log('[MiniMax] Text length:', text.length, '| preview:', text.slice(0, 80));
          resolve({ choices: [{ message: { content: text } }] });
        } catch (e) {
          reject(new Error('MiniMax parse error: ' + e.message + ' | raw: ' + data.slice(0, 300)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ============================================
// EXTRACCIÓN POR REGEX (fallback sin IA)
// ============================================

function extractContactByRegex(text) {
  const result = {};

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/);
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/)([\w-]+)/i);
  if (linkedinMatch) result.linkedin = 'https://linkedin.com/in/' + linkedinMatch[1];

  const githubMatch = text.match(/(?:github\.com\/)([\w-]+)/i);
  if (githubMatch) result.github = 'https://github.com/' + githubMatch[1];

  const portfolioMatch = text.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.[a-zA-Z]{2,}(?:\/[\w./-]*)?/i);
  if (portfolioMatch) result.portfolio = portfolioMatch[0];

  // Nombre: primera línea que parezca nombre (Title Case o ALL CAPS, 2-4 palabras, solo letras)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines.slice(0, 15)) {
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && /^[A-ZÁÉÍÓÚÜÑ]/.test(line) && !/[@:|\/\d]/.test(line)) {
      const allCaps = words.every(w => w === w.toUpperCase() && w.length >= 2);
      const titleCase = words.every(w => /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+$/.test(w));
      if (allCaps || titleCase) {
        result.name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
  }

  return result;
}

// ============================================
// ENDPOINT PRINCIPAL: ANALIZAR CV
// ============================================

app.post('/api/analyze-cv', async (req, res) => {
  try {
    const { file, filename } = req.body;

    if (!file) return res.status(400).json({ error: 'No file provided' });

    const fileBuffer = Buffer.from(file, 'base64');

    // 1. Extraer texto
    console.log('[CV] Extrayendo texto de:', filename);
    const extractedText = await extractTextFromFile(fileBuffer, filename);
    console.log('[CV] Texto extraído:', extractedText.length, 'chars');

    // 2. Construir prompt y llamar a OpenClaw
    const prompt = `Eres ETHV, agente de validación de talento Web3. Analiza este CV y extrae SOLO un JSON con estos campos exactos:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "current_position": "",
  "company": "",
  "experience_years": 0,
  "skills": [],
  "certifications": [],
  "languages": [],
  "education": [],
  "summary": "",
  "web3_relevance": "low"
}

Texto del CV:
${extractedText.substring(0, 6000)}

Responde SOLO el JSON, sin texto adicional.`;

    let cvData = { skills: [], experience_years: 0, web3_relevance: 'low' };

    try {
      console.log('[CV] Enviando a MiniMax...');
      const aiResult = await callMiniMax(prompt);
      const raw = aiResult?.choices?.[0]?.message?.content || '';
      const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cvData = JSON.parse(jsonMatch[0]);
        console.log('[CV] JSON extraído correctamente, skills:', cvData.skills?.length);
      } else {
        console.log('[CV] No JSON found. Preview:', raw.slice(0, 200));
      }
    } catch (e) {
      console.error('[CV] MiniMax error:', e.message);
    }

    // Fallback regex: rellenar campos de contacto que la IA no extrajo
    const regexData = extractContactByRegex(extractedText);
    if (!cvData.email && regexData.email) cvData.email = regexData.email;
    if (!cvData.phone && regexData.phone) cvData.phone = regexData.phone;
    if (!cvData.linkedin && regexData.linkedin) cvData.linkedin = regexData.linkedin;
    if (!cvData.github && regexData.github) cvData.github = regexData.github;
    if (!cvData.portfolio && regexData.portfolio) cvData.portfolio = regexData.portfolio;
    if (!cvData.name && regexData.name) cvData.name = regexData.name;
    console.log('[CV] Contacto extraído:', { name: cvData.name, email: cvData.email, phone: cvData.phone });

    // 3. Calcular scores y enriquecer resultado
    const fullResult = {
      ...cvData,
      score: calculateOverallScore(cvData),
      ats_score: calculateATSScore(cvData),
      level: estimateLevel(cvData),
      dimensions: calculateDimensions(cvData),
      suggested_roles: suggestRoles(cvData),
      strengths: generateStrengths(cvData),
      improvements: generateImprovements(cvData),
      stats: calculateStats(extractedText),
      analyzed_at: new Date().toISOString()
    };

    // 4. Guardar en Supabase (sin bloquear la respuesta)
    saveToSupabase(fullResult).then(r => console.log('[Supabase] Resultado:', JSON.stringify(r))).catch(e => console.error('[Supabase] Error async:', e.message));

    // 5. Responder al frontend
    res.json(fullResult);

  } catch (error) {
    console.error('[CV] Error general:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PROXY MINIMAX (compatibilidad OpenAI → Anthropic)
// ============================================

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, max_tokens } = req.body;
    const body = JSON.stringify({
      model: MINIMAX_MODEL,
      max_tokens: max_tokens || 2000,
      messages
    });

    const url = new URL(MINIMAX_BASE_URL + '/v1/messages');
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'x-api-key': MINIMAX_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Devolver en formato OpenAI para compatibilidad con el frontend
          const text = parsed?.content?.[0]?.text || '';
          res.json({ choices: [{ message: { role: 'assistant', content: text } }] });
        } catch { res.send(data); }
      });
    });

    proxyReq.on('error', (err) => {
      res.status(500).json({ error: 'Failed to call MiniMax', details: err.message });
    });

    proxyReq.write(body);
    proxyReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LINKEDIN
// ============================================

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeWithJina(url) {
  try {
    const text = await httpGet(JINA_URL + encodeURIComponent(url));
    return { success: true, text, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function extractLinkedInData(text) {
  const data = { raw: text.substring(0, 5000) };

  const namePatterns = [/^([A-Z][a-z]+ [A-Z][a-z]+)/m, /<h1[^>]*>([^<]+)<\/h1>/];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) { data.name = match[1] || match[0]; break; }
  }

  const skillKeywords = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MongoDB', 'Web3', 'Blockchain', 'Ethereum', 'Solidity', 'DeFi'];
  const lowerText = text.toLowerCase();
  data.skills = [...new Set(skillKeywords.filter(s => lowerText.includes(s.toLowerCase())))];

  const web3Keywords = ['web3', 'blockchain', 'ethereum', 'solidity', 'defi', 'crypto', 'nft', 'dao', 'smart contract'];
  const web3Count = web3Keywords.filter(kw => lowerText.includes(kw)).length;
  data.web3_relevance = web3Count > 3 ? 'high' : web3Count > 0 ? 'medium' : 'low';
  data.experience_years = Math.max(1, Math.min(20, Math.floor(text.length / 3000)));

  return data;
}

app.post('/api/linkedin-scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('linkedin.com')) {
      return res.status(400).json({ error: 'Invalid LinkedIn URL' });
    }
    console.log('Scraping:', url);
    const result = await scrapeWithJina(url);
    if (result.success) {
      const parsed = extractLinkedInData(result.text);
      return res.json({ success: true, method: 'jina-ai', url, ...parsed, scrapedAt: new Date().toISOString() });
    }
    res.json({ success: false, error: result.error });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-profile', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Profile content too short' });
    }

    const prompt = 'Eres ETHV. Analiza este perfil y devuelve JSON con: skills (array), experience_years (number), education (array), certifications (array), summary (string), headline (string), location (string), web3_relevance (high/medium/low). Perfil: ' + content.slice(0, 10000) + '. Responde SOLO JSON.';

    try {
      const aiResult = await callMiniMax(prompt);
      const raw = aiResult?.choices?.[0]?.message?.content || '';
      const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json({ success: true, ...JSON.parse(jsonMatch[0]) });
      }
      return res.json({ success: true, summary: raw.slice(0, 500) });
    } catch (e) {
      return res.status(500).json({ error: 'AI failed', details: e.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GENERATE QUIZ WITH AI
// ============================================

// In-memory quiz sessions: quizId → { questions (full), expiresAt }
const quizSessions = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of quizSessions) {
    if (session.expiresAt < now) quizSessions.delete(id);
  }
}, 10 * 60 * 1000);

function parseQuizJSON(raw) {
  const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');

  // Find the LAST occurrence of `[{` — the actual JSON array comes after any thinking preamble
  let lastStart = -1;
  const re = /\[\s*\{/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) lastStart = m.index;

  const searchFrom = lastStart !== -1 ? cleaned.slice(lastStart) : cleaned;

  // Use balanced bracket matching to extract the full array
  let depth = 0, start = -1, end = -1;
  for (let i = 0; i < searchFrom.length; i++) {
    if (searchFrom[i] === '[') { if (depth === 0) start = i; depth++; }
    else if (searchFrom[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }

  if (start !== -1 && end !== -1) {
    try {
      const parsed = JSON.parse(searchFrom.slice(start, end + 1));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.log('[Quiz] Balanced parse failed:', e.message);
    }
  }
  return null;
}

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { skill, level = 'mid', lang = 'en' } = req.body;
    if (!skill) return res.status(400).json({ error: 'skill required' });

    const langLabel = lang === 'es' ? 'Spanish' : 'English';
    const langNote  = lang === 'es' ? 'Escribe TODO en español.' : 'Write everything in English.';

    console.log('[Quiz] Generating for:', skill, level, lang);

    const prompt = `You are ETHV, a talent validator. Generate a quiz with 8 questions to validate REAL proficiency in "${skill}" at ${level} level. ${langNote}

Mix these types (distribute them across the 8 questions):
- "multiple_choice": 4 options, one correct. Good for concepts and best-practices.
- "code_trace": show a short code snippet, ask what it outputs or what is wrong. Use "multiple_choice" format with options.
- "open": a practical/logical reasoning question. No options. The candidate writes a free-text answer.

Anti-AI rules:
- Avoid questions that can be answered by simply googling a definition.
- Prefer "given this real situation, what would you do and why?" scenarios.
- For code_trace, use non-trivial logic (closures, async, edge cases, type coercion, etc.).
- Open questions must require reasoning, not just reciting facts.

Respond ONLY with a valid JSON array, no markdown:
[
  {
    "type": "multiple_choice",
    "question": "...",
    "options": ["A","B","C","D"],
    "correct": 0,
    "explanation": "..."
  },
  {
    "type": "code_trace",
    "question": "What does this code output?",
    "code": "// short snippet here",
    "options": ["A","B","C","D"],
    "correct": 2,
    "explanation": "..."
  },
  {
    "type": "open",
    "question": "Practical/logical question here...",
    "model_answer": "A strong answer should mention: ...",
    "explanation": "..."
  }
]`;

    const aiResult = await callMiniMax(prompt, 8000, '[');
    const raw = aiResult?.choices?.[0]?.message?.content || '';
    console.log('[Quiz] Raw length:', raw.length);

    const questions = parseQuizJSON(raw);
    if (!questions || questions.length === 0) {
      console.error('[Quiz] Parse failed.');
      console.error('[Quiz] First 400:', raw.slice(0, 400));
      console.error('[Quiz] Last 400:', raw.slice(-400));
      return res.status(500).json({ error: 'AI did not return valid quiz format' });
    }

    const quizId = require('crypto').randomUUID();
    quizSessions.set(quizId, {
      skill, level, lang, questions,
      expiresAt: Date.now() + 30 * 60 * 1000
    });

    console.log('[Quiz] Generated', questions.length, 'questions |', quizId);

    // Send sanitized — no correct index or model_answer
    const sanitized = questions.map(q => ({
      type: q.type,
      question: q.question,
      code: q.code || null,
      options: q.options || null
    }));

    res.json({ quizId, skill, level, lang, questions: sanitized });

  } catch (error) {
    console.error('[Quiz] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Evaluate a single open answer with AI
async function evaluateOpenAnswer(question, modelAnswer, userAnswer, lang) {
  const prompt = `You are a strict technical evaluator. Evaluate this quiz answer.
Question: "${question}"
Expected answer covers: "${modelAnswer}"
Candidate's answer: "${userAnswer}"

Evaluate on: accuracy, completeness, practical understanding.
Ignore grammar/spelling. A passing score is 60+.
Respond ONLY with JSON: {"score": 75, "feedback": "one sentence feedback in ${lang === 'es' ? 'Spanish' : 'English'}"}`;

  try {
    const result = await callMiniMax(prompt, 512, '{');
    const raw = result?.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { score: parsed.score || 0, feedback: parsed.feedback || '' };
    }
  } catch (e) {
    console.error('[Quiz] Open eval error:', e.message);
  }
  return { score: 0, feedback: 'Could not evaluate answer' };
}

// Submit answers — backend validates (MC instantly, open questions via AI)
app.post('/api/submit-quiz', async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quizId and answers required' });
    }

    const session = quizSessions.get(quizId);
    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found or expired' });
    }

    const { questions, skill, level, lang } = session;

    // Evaluate each question
    const results = await Promise.all(questions.map(async (q, i) => {
      const userAnswer = answers[i];

      if (q.type === 'open') {
        const { score, feedback } = await evaluateOpenAnswer(
          q.question, q.model_answer, userAnswer || '', lang
        );
        return {
          type: 'open',
          question: q.question,
          yourAnswer: userAnswer || '',
          isCorrect: score >= 60,
          openScore: score,
          feedback,
          explanation: q.explanation
        };
      }

      // multiple_choice or code_trace
      const isCorrect = userAnswer === q.correct;
      return {
        type: q.type || 'multiple_choice',
        question: q.question,
        code: q.code || null,
        options: q.options,
        yourAnswer: userAnswer ?? -1,
        correct: q.correct,
        isCorrect,
        explanation: q.explanation
      };
    }));

    const correctCount = results.filter(r => r.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 70;

    quizSessions.delete(quizId);
    console.log('[Quiz] Submit:', skill, '| score:', score, '| passed:', passed);

    res.json({ skill, level, lang, score, passed, correctCount, total: questions.length, results });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('ETHV Backend running on http://localhost:' + PORT);
  console.log('Supabase URL:', SUPABASE_URL || 'NO configurado');
});

module.exports = app;
