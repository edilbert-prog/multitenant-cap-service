import { QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './utils/helpers/AppRoutes';
import SidebarLayout from './utils/SidebarNav/SidebarLayout';
import { Toaster } from 'sonner';
import { queryClient } from './api/validation/queryClient';
import './assets/styles/applies.css';
import "./assets/styles/ag-theme-shadcn.css";
import './assets/styles/validation.css';
import { storeEncryptedData } from './utils/helpers/storageHelper';
import { useEffect, useState } from 'react';
import { initCsrf } from './utils/csrf';

export default function App() {

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        console.log("🔥 Initializing CSRF...");

        await initCsrf();

        console.log("✅ CSRF ready");

        storeEncryptedData(
          "UserSession",
          JSON.stringify({
            username: "admin",
            email: "admin@cognitoai.com",
            first_name: "Admin",
            last_name: "User",
            roles: [],
            permissions: [],
            ClientId: "CLID-4",
            Email: "admin@cognitoai.com",
            FirstName: "Admin",
            LastName: "User"
          })
        );

        setIsReady(true);

      } catch (err) {
        console.error("❌ Init failed:", err);
        setIsReady(true); // prevent freeze
      }
    };

    setup();
  }, []);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full">
        <Toaster position="top-right" richColors closeButton />

        <SidebarLayout>
          <AppRoutes />
        </SidebarLayout>
      </div>
    </QueryClientProvider>
  );
}