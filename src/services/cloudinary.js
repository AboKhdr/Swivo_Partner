const CLOUD_NAME = 'dxtilztvm';
const UPLOAD_PRESET = 'tteamdashboard';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const TIMEOUT_MS = 30000;

/**
 * Upload an image to Cloudinary directly from React Native.
 * @param {string} uri - Local file URI from react-native-image-picker
 * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
 */
export async function uploadToCloudinary(uri) {
  if (!uri) return {success: false, url: null, error: 'NO_URI'};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const form = new FormData();
    form.append('file', {uri, name: filename, type: mimeType});
    form.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const result = await res.json();

    if (!res.ok || result?.error) {
      return {
        success: false,
        url: null,
        error: result?.error?.message ?? `HTTP_${res.status}`,
      };
    }

    return {success: true, url: result.secure_url ?? null, error: null};
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return {success: false, url: null, error: 'TIMEOUT'};
    }
    return {success: false, url: null, error: 'NETWORK_ERROR'};
  }
}
