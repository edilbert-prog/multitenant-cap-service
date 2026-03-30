import {useEffect, useReducer, useRef, useState} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import {storeEncryptedData} from "@/utils/helpers/storageHelper";
import {apiRequest} from "@/utils/helpers/ApiHelper";
import axios from "axios";

/** Safely decode JWT payload (no verification) */
const decodeJwt = (token: string): any | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(
        decodeURIComponent(
            Array.from(json)
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        )
    );
  } catch {
    return null;
  }
};


interface StateShape {
  ClientObj: any;
}

const AuthCallback = () => {
  console.log("AuthCallback component mounted!");


  const initialState: StateShape = {
    ClientObj: {
      ClientId:""
    }
  };

  const [state, setState] = useReducer(
      (prev: StateShape, update: Partial<StateShape>): StateShape => ({ ...prev, ...update }),
      initialState
  );


  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const apiBase = window.location.origin;
  // const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5200' : 'https://sirobilt.ai';
  const hasRunRef = useRef(false); // Prevent multiple runs
  const [error, setError] = useState<string | null>(null);

  // Helpers
  const buildCallbackUrl = (base: string, search: string) => `${base}/api/auth/callback${search}`;
  const isJsonResponse = (resp: Response) => resp.headers.get("content-type")?.includes("application/json");
  const isNetworkFetchError = (e: unknown): boolean =>
      e instanceof TypeError && String((e as Error).message ?? "").includes("Failed to fetch");


  const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
      const resp: any = await apiRequest("/clients/GetClientsMasterPaginationFilterSearch", {
        "PageNo": PageNo,
        "StartDate": "",
        "EndDate": "",
        "SearchString": SearchQuery
      });
      if (resp.ResponseData && resp.ResponseData.length > 0) {
        let ClientObj={
          ClientId:resp.ResponseData[0].ClientId
        }
        setState({ ClientObj});
      }
      return ClientId
  };




  const fetchAuth = async (url: string) => {
    console.log("Making fetch request...");
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log(" Response received:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    console.log(" Response body:", response);


    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response error:", errorText);
      throw new Error(`HTTP ${response.status} - ${errorText}`);
    }

    if (!isJsonResponse(response)) {
      const text = await response.text();
      console.error(" Content type error:", response.headers.get("content-type"), text);
      throw new Error(`Expected JSON but got: ${text.substring(0, 120)}...`);
    }

    return response.json();
  };

  const validateAuthData = (data: any) => {
    const { access_token, expires_in, user } = data ?? {};
    if (!access_token || !expires_in || !user) {
      throw new Error("Missing required login data.");
    }
    return { access_token, expires_in, user } as {
      access_token: string;
      expires_in: number;
      user: any;
    };
  };

  const commitAuth = async (access_token: string, expires_in: number, user: any) => {
    // console.log(" Starting commitAuth...");

    sessionStorage.setItem("access_token", access_token);

    let resp=await axios.post("/cognito/api/GetClientsMasterPaginationFilterSearch", {},{
      headers: { 'Content-Type': 'application/json', "authentication": access_token, }});
    let ClientId=""
    if (resp.data.ResponseData.length>0){
      ClientId=resp.data.ResponseData[0].ClientId
    }
    user.ClientId=ClientId
    user.Email=user.email
    user.FirstName=user.first_name
    user.LastName=user.last_name
    user.RoleName=user.role_name
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token_expires_in", expires_in.toString());
    storeEncryptedData("UserSession", JSON.stringify(user));
    // Decode & persist Keycloak user id (sub)
    const claims = decodeJwt(access_token);
    const kcUserId = claims?.sub ?? null;
    console.log("🔑 Keycloak User ID (sub):", kcUserId ?? "(missing)");
    if (kcUserId) sessionStorage.setItem("KC_SUB", kcUserId);

    // Update auth context state
    login(access_token, expires_in, user);

    console.log(" Authentication successful, navigating to main app");
    console.log(" Current location:", window.location.href);
    console.log(" Navigating to dashboard");

    navigate("/", { replace: true });
  };

  useEffect(() => {
    const completeLogin = async () => {
      if (hasRunRef.current) {
        console.log("Already processing authentication, skipping...");
        return; // Skip if already run
      }
      hasRunRef.current = true;

      console.log(" Starting auth callback...");
      console.log(" Current URL:", window.location.href);
      console.log(" Search params:", location.search);

      // Check if we have the auth code in URL params
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');

      console.log("urlParams code ===>",code)
      if (!code) {
        console.error(" No authorization code found in URL");
        sessionStorage.clear();
        // Environment-aware redirect
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}/api/auth/login`;
        return;
      }

      // console.log("Authorization code found:", code);
      // console.log(" State:", state);

      try {
        // Call the backend callback endpoint to exchange code for token
        const callbackUrl = buildCallbackUrl(apiBase, location.search);
        console.log(" Calling backend callback:", callbackUrl);

        const data = await fetchAuth(callbackUrl);
        // console.log(" Auth Response:", data);

        if (!data) {
          throw new Error("No data received from auth endpoint");
        }

        const { access_token, expires_in, user } = validateAuthData(data);
        // console.log(" Auth data validated successfully");

        commitAuth(access_token, expires_in, user);
        return;
      } catch (err) {
        // console.error(" Auth failed with fetch:", err);
        // console.error(" Full error details:", {
        //   message: err instanceof Error ? err.message : String(err),
        //   stack: err instanceof Error ? err.stack : undefined,
        //   url: window.location.href
        // });

        // console.error(" Network Error Details:");
        // console.error("- Check if nginx is running on port 5200");
        // console.error("- Verify nginx configuration");
        // console.error("- Check if backend is accessible");

        // Clear any partial auth data
        sessionStorage.clear();

        // Show error message instead of redirecting immediately
        console.error(" Authentication failed. Please try logging in again.");
        console.error(" This usually means the authorization code has expired.");
        console.error(" Click here to retry: http://localhost:5200/api/auth/login");

        // Set error state to show user-friendly message
        setError("Authentication failed. The authorization code may have expired. Please try logging in again.");

        // Don't auto-redirect to prevent loops - let user manually retry
      }
    };

    completeLogin();
  }, [location.search, navigate, apiBase]);

  console.log(" AuthCallback component rendering...");
  console.log(" Current URL:", window.location.href);
  console.log(" Current pathname:", window.location.pathname);
  console.log(" Search params:", window.location.search);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-white to-gray-100 text-gray-700">
          <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-600">Authentication Failed</h2>
            <p className="text-sm text-gray-600 text-center">{error}</p>
            <a
                href={`${window.location.origin}/api/auth/login`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </a>
          </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-white to-gray-100 text-gray-700">
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center space-y-4">
          <svg
              className="animate-spin h-10 w-10 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <h2 className="text-lg font-semibold">🔐 Processing Keycloak Authentication...</h2>
          <p className="text-sm text-gray-500 text-center">Please wait while we exchange your auth code for tokens</p>
          <p className="text-xs text-gray-400 text-center">Current URL: {window.location.pathname}</p>
          <p className="text-xs text-gray-400 text-center">Check browser console for detailed logs</p>
        </div>
      </div>
  );
};

export default AuthCallback;