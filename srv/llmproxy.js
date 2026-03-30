// srv/llmproxy.js
const cds = require('@sap/cds');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');


const FALLBACK_FILE = '/mnt/data/652e437e-8f95-4ef3-8d54-31fc1dbdeacd.png';

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

// CAP service implementation (no cds.on('bootstrap') here!)
module.exports = cds.service.impl(async function () {
  console.log('[llmproxy] >>> impl file loaded');

  const external = await cds.connect.to('ExternalAPI');



 // test emit
this.on('testEmit', async (req) => {
  const io = global.io;
if (io) {
  try {
    // print connected socket ids
    const ids = Array.from(io.of("/").sockets.keys ? io.of("/").sockets.keys() : Object.keys(io.sockets.sockets));
    console.log("[llmproxy] connected socket ids:", ids);
  } catch(e) {
    console.log("[llmproxy] could not list sockets:", e);
  }

  io.emit('test-message', { msg: 'hello from CAP', time: new Date().toISOString() });
  console.log('[llmproxy] emitted test-message');
}
});

  //UploadDocumentNew
  this.on('UploadDocumentNew', async (req) => {
    const payload = req.data || {};

    try {
      const llmConfig = await getActiveLLMConfig();
      const authToken = req.headers?.authentication || req.headers?.authorization || process.env.LLM_PROXY_AUTH;

      const form = new FormData();

      // forward input params (except any incoming LLMConfig)
      Object.keys(payload).forEach((k) => {
        if (k === 'LLMConfig') return;
        const v = payload[k];
        form.append(
          k,
          (typeof v === 'object' && v !== null)
            ? JSON.stringify(v)
            : (v === undefined || v === null)
              ? ''
              : String(v)
        );
      });

      
      const fileUrl = payload.fileUrl || payload.FileUrl;
      if (fileUrl) {
        try {
          if (fs.existsSync(fileUrl) && fs.statSync(fileUrl).isFile()) {
            form.append('file', fs.createReadStream(fileUrl), {
              filename: path.basename(fileUrl)
            });
            form.append('fileUrl', fileUrl);
          } else {
            form.append('fileUrl', fileUrl);
          }
        } catch (e) {
          form.append('fileUrl', fileUrl);
        }
      } else if (FALLBACK_FILE && fs.existsSync(FALLBACK_FILE)) {
        form.append('file', fs.createReadStream(FALLBACK_FILE), {
          filename: path.basename(FALLBACK_FILE)
        });
        form.append('fileUrl', FALLBACK_FILE);
      }

      // Inject LLMConfig (server-controlled)
      const conn = llmConfig.connection || {};
      const engineName = getEngineDisplayName(llmConfig.provider);
      const llmConfigPayload = {
        EngineName: engineName,
        label: process.env.LLM_MODEL_LABEL || 'gpt-4o',
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
      form.append('LLMConfig', JSON.stringify(llmConfigPayload));

      const headers = {
        ...form.getHeaders(),
        ...(authToken ? { authentication: authToken } : {})
      };
      const len = await getFormLength(form);
      if (len) headers['Content-Length'] = len;

      
      const resp = await external.tx(req).send({
        method: 'POST',
        path: '/llm/api/UploadDocumentNew',
        data: form,
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 120000
      });

      return typeof resp === 'string' ? resp : resp;
    } catch (err) {
      console.error('[LLMProxy] UploadDocumentNew error:', err && err.stack ? err.stack : err);
      const status = (err && err.status) || err.response?.status || 500;
      const message = err.response?.data || err.message || String(err);
      return req.reject(status, message);
    }
  });

  
  this.on('GenerateDataByExistingMDFile', async (req) => {
    const payload = { ...(req.data || {}) };

    try {
      const llmConfig = await getActiveLLMConfig();
      const authToken = req.headers?.authentication || req.headers?.authorization || process.env.LLM_PROXY_AUTH;

      // Replace incoming LLMConfig with server-side one
      delete payload.LLMConfig;
      const conn = llmConfig.connection || {};
      const engineName = getEngineDisplayName(llmConfig.provider);
      payload.LLMConfig = {
        EngineName: engineName,
        label: process.env.LLM_MODEL_LABEL || 'gpt-4o',
        APIKEY: llmConfig.api_key || '',
        value: conn.id,
        LLMId: conn.id,
        APIURL: conn.connection_config?.base_url || llmConfig.base_url || '',
        DefaultFlag: conn.is_active ? 'Yes' : 'No',
        Description: conn.description || '',
        SortKey: 0,
        Status: conn.status || 1,
        CreatedDate: conn.created_at,
        ModifiedDate: conn.updated_at
      };

      const resp = await external.tx(req).send({
        method: 'POST',
        path: '/llm/api/GenerateDataByExistingMDFile', 
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { authentication: authToken } : {})
        },
        timeout: 120000
      });

      return typeof resp === 'string' ? resp : resp;
    } catch (err) {
      console.error('[LLMProxy] GenerateDataByExistingMDFile error:', err && err.stack ? err.stack : err);
      const status = (err && err.status) || err.response?.status || 500;
      const message = err.response?.data || err.message || String(err);
      return req.reject(status, message);
    }
  });
});
