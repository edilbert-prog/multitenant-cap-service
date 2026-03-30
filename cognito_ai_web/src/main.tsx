import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './Redux/store';
import { Provider } from 'react-redux';
import { AuthProvider } from './utils/AuthContext';

const container = document.getElementById('root') as HTMLElement;

createRoot(container).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                {/* <AuthProvider> */}
                    <App />
                {/* </AuthProvider> */}
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
