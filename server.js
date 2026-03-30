const express = require('express') 
const cds = require('@sap/cds')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const FormData = require('form-data')
const socket = require('./socket.js')
const { SELECT, INSERT, UPDATE, DELETE } = cds.ql

cds.on('bootstrap', app => {
  console.log('✅ server.js bootstrap loaded')
////////////////////////////////////////////////////////////////////////////////////////
//tenand subscribe(tenant onbording)
app.use(express.json())
    app.put('/callback/v1.0/tenants/:tenant', async (req, res) => {

    const tenantId = req.params.tenant
    const subdomain = req.body?.subscribedSubdomain

    console.log("Subscription payload:", req.body)

    try {

      await cds.tx({ tenant: tenantId }, tx =>
        tx.run(
          INSERT.into('Tenants').entries({
            tenantId,
            subdomain,
            status: 'SUBSCRIBED',
            plan: 'FREE'
          })
        )
      )

      const tenantUrl =
        `https://${subdomain}-cap-saas-approuter.cfapps.ap10.hana.ondemand.com`

      console.log("Tenant URL:", tenantUrl)

      res.status(200).send(tenantUrl)

    } catch (error) {

      console.error("REAL ERROR:", error)
      res.status(500).send(error.message)

    }

  })
  ///////////////////////////////////////////////////////////////////////////////////

  /// tenant unsubscribe(Offbording)
    app.delete('/callback/v1.0/tenants/:tenant', async (req, res) => {

    const tenantId = req.params.tenant

    console.log(`⬅️ Unsubscribing tenant: ${tenantId}`)

    await cds.tx({ tenant: tenantId }, tx =>
  tx.run(
    DELETE.from('Tenants').where({ tenantId })
  )
)

    res.status(200).json({ status: "OK" })

  })
///////////////////////////////////////////////////
//get Dependencies

app.get('/callback/v1.0/dependencies', (req, res) => {

  console.log('📦 getDependencies callback called')

  // since your app currently has no SAP reuse services,
  // return empty array
  res.status(200).json([])

})

//retrieve the CSRF token.
app.get("/csrf-token", (req, res) => {
  res.set("X-CSRF-Token", req.csrfToken());
  res.sendStatus(200);
});


/////////////////////////////////////////////////////////////////////////////////////////////////


function tryAttachSocketIO({ retries = 100, interval = 200 } = {}) {
  let attempts = 0;
  const tryNow = () => {
    attempts++;
    const capServer = cds.app && cds.app.server;
    if (capServer) {
      try {
        const io = socket.init(capServer, {
          path: '/socket.io',
          cors: { origin: process.env.APPROUTER_ORIGIN || true, methods: ['GET', 'POST'], credentials: true }
        });
        // expose if other code expects it
        try { global.io = io; } catch (e) { }
        if (io) {
          io.on('connection', (sock) => {
            console.log('[io] client connected', sock.id);
            sock.on('disconnect', (reason) => console.log('[io] client disconnected', sock.id, reason));
          });
        }
        console.log('[server] Socket.IO attached to CAP server (attempts:', attempts, ')');
        return true;
      } catch (e) {
        console.error('[server] socket.init failed', e && e.stack ? e.stack : e);
        return false;
      }
    }

    if (attempts >= retries) {
      console.warn('[server] tryAttachSocketIO: giving up after', attempts, 'attempts — capServer still not available');
      return false;
    }

    setTimeout(tryNow, interval);
    return null;
  };

  return tryNow();
}

// Start the attach attempts (non-blocking)
tryAttachSocketIO({ retries: 100, interval: 200 });


console.log('[server] custom server.js loaded');
/** FALLBACK LOCAL TEST FILE (ONLY USED IF NO FILE IS SENT) */
const FALLBACK_FILE = '/mnt/data/652e437e-8f95-4ef3-8d54-31fc1dbdeacd.png';

/**
 * Multer configuration
 */
const USE_DISK_STORAGE = process.env.USE_DISK_STORAGE === 'true';
const TMP_UPLOAD_DIR = process.env.TMP_UPLOAD_DIR || '/tmp/uploads';

if (USE_DISK_STORAGE && !fs.existsSync(TMP_UPLOAD_DIR)) {
  fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });
}

const multerStorage = USE_DISK_STORAGE
  ? multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
  : multer.memoryStorage();

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 50 * 1024 * 1024;

// allowed mime types (for file.mimetype, NOT the whole content-type header)
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg'
].join(',')).split(',');

const ALLOWED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.pdf',
  '.docx',
  '.doc',
  '.xls',
  '.xlsx',
  '.txt'
];

// Model label – matches your curl ("label":"gpt-4o")
const MODEL_LABEL = process.env.LLM_MODEL_LABEL || 'gpt-4o';

// Multer upload config
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {

    let mimetype = (file.mimetype || '').split(';')[0].trim();

    if (mimetype && ALLOWED_MIME_TYPES.includes(mimetype)) {
      return cb(null, true);
    }

    // Fallback
    const ext =
      (file.originalname && path.extname(file.originalname).toLowerCase()) || '';

    if (ext && ALLOWED_EXTENSIONS.includes(ext)) {
      console.warn(
        '[multer] untrusted/missing mimetype, accepting based on extension:',
        mimetype,
        '->',
        ext
      );
      return cb(null, true);
    }

    return cb(
      new Error(`Unsupported file type: ${mimetype || ext || 'unknown'}`)
    );
  }
});

function getEngineDisplayName(provider) {
  const providerMap = {
    OpenAI: 'Chat GPT',
    Google: 'Gemini AI',
    Gemini: 'Gemini AI',
    Anthropic: 'Claude'
  };
  return providerMap[provider] || provider;
}

async function getActiveLLMConfig() {
  const base_url = (process.env.LLM_BASE_URL || process.env.LLM_API_URL || '').replace(/\/$/, '');
  const api_key = process.env.LLM_API_KEY || process.env.LLM_APIKEY || '';
  const provider = process.env.LLM_PROVIDER || 'LocalLLM';

  const connection = {
    id: 'local',
    is_active: 1,
    connection_config: { base_url },
    provider,
    description: 'Env-based LLM connection',
    status: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return { base_url, api_key, provider, connection };
}

function getFormLength(form) {
  return new Promise((resolve) => {
    try {
      form.getLength((err, length) => {
        if (err || !length) return resolve(null);
        resolve(length);
      });
    } catch (e) {
      resolve(null);
    }
  });
}
 
  console.log('[server] cds.on("bootstrap") – attaching socket.io and registering routes');
  // Multipart upload route (this is what you call from Postman / frontend)
  app.post('/llm/UploadDocumentNew', upload.single('file'), async (req, res) => {
    console.log('[server] >>> hit /llm/UploadDocumentNew');

    try {
      console.debug(
        '[LLM Proxy multipart] fields:',
        Object.keys(req.body || {}),
        'file present:',
        !!req.file
      );

      // Basic sanity checks on uploaded file
      if (req.file) {
        if (!USE_DISK_STORAGE && !req.file.buffer) {
          return res
            .status(400)
            .json({ error: 'Uploaded file buffer missing (server config)' });
        }
        if (req.file.size && req.file.size > MAX_FILE_SIZE) {
          return res
            .status(413)
            .json({ error: `File too large. Max allowed is ${MAX_FILE_SIZE} bytes` });
        }
      }

      const external = await cds.connect.to('ExternalAPI');
      const forwardForm = new FormData();

      // Forward all non-LLMConfig fields from frontend.
      // IMPORTANT: mirror behavior of working curl => objects as JSON strings.
      Object.keys(req.body || {}).forEach((k) => {
        if (k === 'LLMConfig') return;
        const v = req.body[k];

        const value =
          (typeof v === 'object' && v !== null)
            ? JSON.stringify(v)
            : (v === undefined || v === null)
              ? ''
              : String(v);

        forwardForm.append(k, value);
      });

      // Attach file or fallback
      let tempFilePath = null;
      if (req.file) {
        if (USE_DISK_STORAGE && req.file.path) {
          tempFilePath = req.file.path;
          forwardForm.append('file', fs.createReadStream(tempFilePath), {
            filename: req.file.originalname || path.basename(tempFilePath),
            contentType: req.file.mimetype || 'application/octet-stream'
          });
        } else if (req.file.buffer) {
          forwardForm.append('file', req.file.buffer, {
            filename: req.file.originalname || 'upload.bin',
            contentType: req.file.mimetype || 'application/octet-stream',
            knownLength: req.file.size
          });
        }
      } else if (
        FALLBACK_FILE &&
        fs.existsSync(FALLBACK_FILE) &&
        fs.statSync(FALLBACK_FILE).isFile()
      ) {
        forwardForm.append('file', fs.createReadStream(FALLBACK_FILE), {
          filename: path.basename(FALLBACK_FILE)
        });
        forwardForm.append('fileUrl', FALLBACK_FILE);
      }

      // Inject LLMConfig – from your .env
      const llmConfig = await getActiveLLMConfig();
      const conn = llmConfig.connection || {};
      const engineName = getEngineDisplayName(llmConfig.provider);


      const llmConfigPayload = {
        EngineName: engineName,
        label: MODEL_LABEL,
        APIKEY: llmConfig.api_key || '',
        value: conn.id,
        LLMId: conn.id,
        APIURL: llmConfig.base_url || '',
        DefaultFlag: conn.is_active ? 'Yes' : 'No',
        Description: conn.description || '',
        SortKey: 0,
        Status: conn.status || 1,
        CreatedDate: conn.created_at,
        ModifiedDate: conn.updated_at
      };
      forwardForm.append('LLMConfig', JSON.stringify(llmConfigPayload));

      // Auth header – from env or request
      const authToken =
        req.headers?.authentication ||
        req.headers?.authorization ||
        process.env.LLM_PROXY_AUTH ||
        'Bearer mock-token';

      const headers = {
        ...forwardForm.getHeaders(),
        authentication: authToken
      };

      const length = await getFormLength(forwardForm);
      if (length) headers['Content-Length'] = length;

      // Call external LLM service via destination EXT_API => http://localhost:8050
      const resp = await external.tx(req).send({
        method: 'POST',
        path: '/llm/api/UploadDocumentNew',
        data: forwardForm,
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 120000
      });

      if (tempFilePath) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.warn('[LLM Proxy multipart] cleanup failed', tempFilePath, err);
        });
      }

      if (typeof resp === 'string') {
        return res.type('application/json').status(200).send(resp);
      } else {
        const status = resp?.status || 200;
        const data = resp?.data ?? resp;
        return res.status(status).json(data);
      }
    } catch (err) {
      console.error('[LLM Proxy - multipart route] raw error:', err && err.stack ? err.stack : err);

      const status =
        err.statusCode ||
        err.status ||
        err.reason?.response?.status ||
        err.response?.status ||
        500;

      const details =
        err.reason?.response?.body ||
        err.response?.data ||
        err.message ||
        String(err);

      console.error(
        '[LLM Proxy - multipart route] remote error details:',
        typeof details === 'object' ? JSON.stringify(details, null, 2) : details
      );

      return res.status(status).json({
        error: 'Failed to forward multipart upload to LLM service',
        details
      });
    }
  });

})
