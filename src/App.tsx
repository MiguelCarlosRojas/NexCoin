import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Menu from "./components/shared/Menu";
import Configuracion from "./components/routes/Configuracion";
import Inicio from "./components/routes/Inicio";
import Estadisticas from "./components/routes/Estadisticas";
import Reportes from "./components/routes/Reportes";
import HistorialTransacciones from "./components/routes/HistorialTransacciones";
import RealizarTransaccion from "./components/routes/RealizarTransaccion";
import AuthLogin from "./auth/AuthLogin";
import ThemeProvider from "./components/context/ThemeProvider";
import { useTheme } from "./components/context/useTheme";

interface Transaccion {
  recipient: string;
  amount: string;
  date: string;
  hash: string;
}

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const connected = localStorage.getItem("isConnected") === "true";
    const storedAccount = localStorage.getItem("account");
    setIsConnected(connected);
    if (storedAccount) {
      setAccount(storedAccount);
    }

    const storedTransactions = localStorage.getItem("transactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  }, []);

  const handleConnect = (account: string) => {
    setIsConnected(true);
    setAccount(account);
    localStorage.setItem("isConnected", "true");
    localStorage.setItem("account", account);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccount("");
    localStorage.removeItem("isConnected");
    localStorage.removeItem("account");
  };

  const handleNewTransaction = (newTransaction: Transaccion) => {
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      <Router>
        {isConnected ? (
          <>
            <Menu onDisconnect={handleDisconnect} account={account} />
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/informes/estadisticas" element={<Estadisticas />} />
              <Route path="/informes/reportes" element={<Reportes />} />
              <Route
                path="/transacciones/historial"
                element={<HistorialTransacciones transactions={transactions} />}
              />
              <Route
                path="/transacciones/realizar"
                element={
                  <RealizarTransaccion
                    account={account}
                    onNewTransaction={handleNewTransaction}
                  />
                }
              />
            </Routes>
          </>
        ) : (
          <AuthLogin onConnect={handleConnect} />
        )}
      </Router>
    </div>
  );
};

const AppWrapper: React.FC = () => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

export default AppWrapper;
