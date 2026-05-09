const CLOUD_NAME   = 'dxtilztvm';
const UPLOAD_PRESET = 'tteamdashboard';
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const TIMEOUT_MS   = 60000;

export async function uploadToCloudinary(uri) {
  if (!uri) return {success: false, url: null, error: 'NO_URI'};

  return new Promise(resolve => {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const ext      = (filename.split('.').pop() ?? 'jpg').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const form = new FormData();
    form.append('file',          {uri, name: filename, type: mimeType});
    form.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);
    xhr.timeout = TIMEOUT_MS;

    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && !result?.error) {
          resolve({success: true, url: result.secure_url ?? null, error: null});
        } else {
          resolve({success: false, url: null, error: result?.error?.message ?? `HTTP_${xhr.status}`});
        }
      } catch {
        resolve({success: false, url: null, error: 'PARSE_ERROR'});
      }
    };

    xhr.ontimeout = () => resolve({success: false, url: null, error: 'TIMEOUT'});
    xhr.onerror   = () => resolve({success: false, url: null, error: 'NETWORK_ERROR'});

    xhr.send(form);
  });
}
