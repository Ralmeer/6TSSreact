import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './main.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContextV2.jsx';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MantineProvider
          theme={{
            components: {
              DatePickerInput: {
                styles: {
                  calendarHeaderControl: {
                    '& svg': {
                      width: '16px',
                      height: '16px',
                    },
                  },
                },
              },
            },
          }}
        >
          <App />
        </MantineProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
