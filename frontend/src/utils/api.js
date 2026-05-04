// import axios from 'axios';

// // const API = axios.create({ baseURL: '/api' });
// // const API = axios.create({
// //   baseURL: process.env.REACT_APP_API_URL + '/api',
// // });
// const API = axios.create({
//   baseURL: process.env.REACT_APP_API_URL
//     ? process.env.REACT_APP_API_URL + '/api'
//     : 'http://localhost:5000/api',
// });

// export const questionAPI = {
//   getAll: () => API.get('/questions'),
//   getOne: (id) => API.get(`/questions/${id}`),
//   create: (data) => API.post('/questions', data),
//   update: (id, data) => API.put(`/questions/${id}`, data),
//   delete: (id) => API.delete(`/questions/${id}`),
// };

// // Helper: trigger a blob download from an axios response
// const triggerDownload = async (request, filename) => {
//   const response = await request;
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', filename);
//   document.body.appendChild(link);
//   link.click();
//   link.parentNode.removeChild(link);
//   window.URL.revokeObjectURL(url);
// };

// export const excelAPI = {
//   // Download Excel template
//   downloadTemplate: () =>
//     triggerDownload(
//       API.get('/excel/template', { responseType: 'blob' }),
//       'questions_template.xlsx'
//     ),

//   // Download Word format guide (.txt)
//   downloadWordTemplate: () =>
//     triggerDownload(
//       API.get('/excel/word-template', { responseType: 'blob' }),
//       'word_question_format.txt'
//     ),

//   // Parse Excel OR Word file
//   parseFile: (file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return API.post('/excel/parse', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
// };






import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// ── Question sets ─────────────────────────────────────────────────────────────
export const questionAPI = {
  getAll:  ()         => API.get('/questions'),
  getOne:  (id)       => API.get(`/questions/${id}`),
  create:  (data)     => API.post('/questions', data),
  update:  (id, data) => API.put(`/questions/${id}`, data),
  delete:  (id)       => API.delete(`/questions/${id}`),
};

// ── Images (Cloudinary via backend) ──────────────────────────────────────────
export const imageAPI = {
  // Upload a File object → returns { url, publicId }
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    return API.post('/images/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
        : undefined,
    });
  },

  // Delete by publicId — fire-and-forget is fine for UX but we return the promise
  // so callers can await if needed
  delete: (publicId) => {
    if (!publicId) return Promise.resolve();
    // publicId may contain '/' (e.g. question-builder/abc123)
    // encode each segment but keep slashes so the route wildcard works
    const encoded = publicId.split('/').map(encodeURIComponent).join('/');
    return API.delete(`/images/${encoded}`);
  },
};

// ── Excel / Word ──────────────────────────────────────────────────────────────
const triggerDownload = async (request, filename) => {
  const response = await request;
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const excelAPI = {
  downloadTemplate:     () => triggerDownload(API.get('/excel/template',      { responseType: 'blob' }), 'questions_template.xlsx'),
  downloadWordTemplate: () => triggerDownload(API.get('/excel/word-template', { responseType: 'blob' }), 'word_question_format.txt'),
  parseFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('/excel/parse', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};