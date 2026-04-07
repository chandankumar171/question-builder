// import axios from 'axios';

// const API = axios.create({ baseURL: '/api' });

// export const questionAPI = {
//   getAll: () => API.get('/questions'),
//   getOne: (id) => API.get(`/questions/${id}`),
//   create: (data) => API.post('/questions', data),
//   update: (id, data) => API.put(`/questions/${id}`, data),
//   delete: (id) => API.delete(`/questions/${id}`),
// };

// export const excelAPI = {
//   downloadTemplate: (type) => {
//     window.open(`/api/excel/template/${type}`, '_blank');
//   },
//   parseFile: (file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return API.post('/excel/parse', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
// };


// import axios from 'axios';

// const API = axios.create({ baseURL: '/api' });

// export const questionAPI = {
//   getAll: () => API.get('/questions'),
//   getOne: (id) => API.get(`/questions/${id}`),
//   create: (data) => API.post('/questions', data),
//   update: (id, data) => API.put(`/questions/${id}`, data),
//   delete: (id) => API.delete(`/questions/${id}`),
// };

// export const excelAPI = {
//   downloadTemplate: async () => {
//     try {
//       const response = await API.get('/excel/template', { responseType: 'blob' });
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', 'questions_template.xlsx');
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error('Download failed:', err);
//       throw err;
//     }
//   },
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

export const questionAPI = {
  getAll: () => API.get('/questions'),
  getOne: (id) => API.get(`/questions/${id}`),
  create: (data) => API.post('/questions', data),
  update: (id, data) => API.put(`/questions/${id}`, data),
  delete: (id) => API.delete(`/questions/${id}`),
};

// Helper: trigger a blob download from an axios response
const triggerDownload = async (request, filename) => {
  const response = await request;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const excelAPI = {
  // Download Excel template
  downloadTemplate: () =>
    triggerDownload(
      API.get('/excel/template', { responseType: 'blob' }),
      'questions_template.xlsx'
    ),

  // Download Word format guide (.txt)
  downloadWordTemplate: () =>
    triggerDownload(
      API.get('/excel/word-template', { responseType: 'blob' }),
      'word_question_format.txt'
    ),

  // Parse Excel OR Word file
  parseFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/excel/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};