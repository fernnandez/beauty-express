import { DatesProvider } from "@mantine/dates";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import { LoginThemeProvider } from "./components/LoginThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import { AuthProvider } from "./contexts/AuthContext";
import { BackofficeApp } from "./backoffice/BackofficeApp";
import { Login } from "./pages/Login";
import { OperationalEntry } from "./OperationalEntry";

const rootTheme = createTheme({
  primaryColor: "gray",
  defaultRadius: "md",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={rootTheme}>
        <DatesProvider
          settings={{
            locale: "pt-br",
            firstDayOfWeek: 0,
          }}
        >
          <Notifications />
          <PwaInstallPrompt />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <LoginThemeProvider>
                      <Login />
                    </LoginThemeProvider>
                  }
                />
                <Route path="/backoffice/*" element={<BackofficeApp />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <OperationalEntry />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
