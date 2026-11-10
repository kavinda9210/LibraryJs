import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Set the page title
document.title = 'Library Service Board - Central Province';

// Update the favicon
const setFavicon = () => {
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = '/photos/l-logo.png';
  document.getElementsByTagName('head')[0].appendChild(link);
};

setFavicon();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();