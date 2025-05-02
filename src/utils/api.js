import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',  // Update with your backend URL/port
  timeout: 5000,                         // Request timeout (optional)
  headers: { 
    'Content-Type': 'application/json',
  },
});

// Optionally, you can add interceptors here to manage requests globally

export default api;
