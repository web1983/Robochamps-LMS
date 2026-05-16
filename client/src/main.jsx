import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider, useSelector } from 'react-redux';
import { appStore } from './app/store';
import { Toaster } from './components/ui/sonner';
import LoadingSpinner from './components/LoadingSpinner';

const Custom = ({ children }) => {
  const { isLoading } = useSelector(store => store.auth);
  return <>{isLoading ? <LoadingSpinner/> : children}</>;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={appStore}>
      <Custom>
        <>
          <App />
          <Toaster />
        </>
      </Custom>
    </Provider>
  </StrictMode>
);
