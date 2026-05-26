const net = require('net');
const { Readable } = require('stream');
const { getObjectStream } = require('./objectStorage.service');

const streamToBuffer = async (stream, maxBytes = Number(process.env.ATTACHMENT_SCAN_MAX_BYTES || 25 * 1024 * 1024)) => {
  const chunks = [];
  let total = 0;

  for await (const chunk of stream) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new Error(`Attachment exceeds scan limit of ${maxBytes} bytes`);
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

const scanWithClamAv = (buffer) => new Promise((resolve, reject) => {
  const host = process.env.CLAMAV_HOST || '127.0.0.1';
  const port = Number(process.env.CLAMAV_PORT || 3310);
  const timeoutMs = Number(process.env.CLAMAV_TIMEOUT_MS || 30000);
  const socket = net.createConnection({ host, port });
  const chunks = [];

  socket.setTimeout(timeoutMs);

  socket.on('connect', () => {
    socket.write('zINSTREAM\0');

    const stream = Readable.from(buffer, { highWaterMark: 64 * 1024 });
    stream.on('data', (chunk) => {
      const size = Buffer.alloc(4);
      size.writeUInt32BE(chunk.length, 0);
      socket.write(size);
      socket.write(chunk);
    });
    stream.on('end', () => socket.write(Buffer.alloc(4)));
    stream.on('error', reject);
  });

  socket.on('data', (chunk) => chunks.push(chunk));
  socket.on('timeout', () => {
    socket.destroy();
    reject(new Error('ClamAV scan timed out'));
  });
  socket.on('error', reject);
  socket.on('end', () => {
    const response = Buffer.concat(chunks).toString('utf8');
    const infected = response.includes('FOUND');

    resolve({
      provider: 'clamav',
      status: infected ? 'infected' : 'safe',
      raw: response,
      signature: infected ? response.replace(/^stream: /, '').replace(/ FOUND.*$/s, '') : null
    });
  });
});

const scanWithVirusTotal = async (buffer, filename) => {
  if (!process.env.VIRUSTOTAL_API_KEY) {
    throw new Error('VIRUSTOTAL_API_KEY is required when ATTACHMENT_SCAN_PROVIDER=virustotal');
  }

  const formData = new FormData();
  formData.append('file', new Blob([buffer]), filename);

  const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
    method: 'POST',
    headers: {
      'x-apikey': process.env.VIRUSTOTAL_API_KEY
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`VirusTotal upload failed with ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  const analysisId = uploadResult?.data?.id;
  if (!analysisId) throw new Error('VirusTotal did not return an analysis id');

  const maxPolls = Number(process.env.VIRUSTOTAL_MAX_POLLS || 8);
  const pollDelayMs = Number(process.env.VIRUSTOTAL_POLL_DELAY_MS || 15000);

  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, pollDelayMs));

    const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: {
        'x-apikey': process.env.VIRUSTOTAL_API_KEY
      }
    });

    if (!analysisResponse.ok) {
      throw new Error(`VirusTotal analysis lookup failed with ${analysisResponse.status}`);
    }

    const analysis = await analysisResponse.json();
    const attributes = analysis?.data?.attributes;
    if (attributes?.status !== 'completed') continue;

    const stats = attributes.stats || {};
    const infected = (stats.malicious || 0) > 0 || (stats.suspicious || 0) > 0;

    return {
      provider: 'virustotal',
      status: infected ? 'infected' : 'safe',
      raw: {
        analysisId,
        stats
      },
      signature: infected ? 'VirusTotal malicious or suspicious detection' : null
    };
  }

  throw new Error('VirusTotal analysis did not complete before timeout');
};

const scanBuffer = async ({ buffer, filename }) => {
  const provider = process.env.ATTACHMENT_SCAN_PROVIDER || 'noop';

  if (provider === 'noop') {
    return {
      provider: 'noop',
      status: 'safe',
      raw: { message: 'No scanner configured. Development-only safe result.' },
      signature: null
    };
  }

  if (provider === 'clamav') {
    return scanWithClamAv(buffer);
  }

  if (provider === 'virustotal') {
    return scanWithVirusTotal(buffer, filename);
  }

  throw new Error(`Unsupported attachment scanner provider: ${provider}`);
};

const scanStorageObject = async ({ storageKey, filename }) => {
  const stream = await getObjectStream(storageKey);
  const buffer = await streamToBuffer(stream);

  return scanBuffer({ buffer, filename });
};

module.exports = {
  scanBuffer,
  scanStorageObject,
  streamToBuffer
};
