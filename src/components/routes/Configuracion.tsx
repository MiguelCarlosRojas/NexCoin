import React, { useState, useEffect } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { formatEther } from "@ethersproject/units";
import { hexValue } from "@ethersproject/bytes";
import {
  ExclamationCircleIcon,
  ArrowsRightLeftIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/20/solid";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import translationsES from "../translate/Español";
import translationsEN from "../translate/Ingles";
import { useTheme } from "../context/useTheme";
import esIcon from "../../assets/icons/es.svg";
import enIcon from "../../assets/icons/en.svg";

const NETWORKS = {
  holesky: 17000,
  sepolia: 11155111,
};

interface SnackbarMessage {
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

const Configuracion: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [snackbarMessages, setSnackbarMessages] = useState<SnackbarMessage[]>(
    []
  );
  const [language, setLanguage] = useState<"en" | "es">("en");
  const translations = language === "en" ? translationsEN : translationsES;

  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as "en" | "es";
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }

    const setupProvider = async () => {
      if (window.ethereum) {
        const newProvider = new Web3Provider(window.ethereum);
        setProvider(newProvider);
        await updateAccountAndBalance(newProvider);

        newProvider.on("network", async (newNetwork) => {
          if (
            newNetwork.chainId === NETWORKS.holesky ||
            newNetwork.chainId === NETWORKS.sepolia
          ) {
            await updateAccountAndBalance(newProvider);
          }
        });

        const handleChainChanged = async (chainId: string) => {
          const newChainId = parseInt(chainId, 16);
          if (
            newChainId === NETWORKS.holesky ||
            newChainId === NETWORKS.sepolia
          ) {
            await updateAccountAndBalance(newProvider);
          }
        };

        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
          newProvider.removeAllListeners("network");
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
      }
    };

    setupProvider();
  }, []);

  const updateAccountAndBalance = async (provider: Web3Provider) => {
    const signer = provider.getSigner();
    const accountAddress = await signer.getAddress();
    const network = await provider.getNetwork();
    const balance = await signer.getBalance();

    setAccount(accountAddress);
    setNetwork(
      network.chainId === NETWORKS.holesky
        ? "Ethereum Holesky"
        : network.chainId === NETWORKS.sepolia
        ? "Sepolia"
        : "Desconocida"
    );
    setBalance(formatEther(balance));
  };

  const switchNetwork = async (networkId: number) => {
    if (provider) {
      const currentNetwork =
        networkId === NETWORKS.holesky ? "Ethereum Holesky" : "Sepolia";
      if (network === currentNetwork) {
        addSnackbarMessage(
          translations.snackbar_already_on_network.replace(
            "{{currentNetwork}}",
            currentNetwork
          ),
          "info"
        );
        return;
      }

      try {
        await provider.send("wallet_switchEthereumChain", [
          { chainId: hexValue(networkId) },
        ]);
        const newProvider = new Web3Provider(window.ethereum);
        setProvider(newProvider);
        await updateAccountAndBalance(newProvider);

        addSnackbarMessage(
          translations.snackbar_network_change_success.replace(
            "{{currentNetwork}}",
            currentNetwork
          ),
          "success"
        );
      } catch (error) {
        addSnackbarMessage(translations.snackbar_network_change_error, "error");
        console.error("Error switching network:", error);
      }
    }
  };

  const addSnackbarMessage = (
    message: string,
    severity: SnackbarMessage["severity"]
  ) => {
    setSnackbarMessages((prevMessages) => [
      ...prevMessages,
      { message, severity },
    ]);
  };

  const handleSnackbarClose = (messageToRemove: SnackbarMessage) => {
    setSnackbarMessages((prevMessages) =>
      prevMessages.filter((message) => message !== messageToRemove)
    );
  };

  const formatBalance = (balance: string | null, network: string | null) => {
    if (!balance) return "0.0000";

    const parsedBalance = parseFloat(balance);
    if (network === "Sepolia") {
      return `${parsedBalance.toFixed(4)} SepoliaETH`;
    } else if (network === "Ethereum Holesky") {
      return `${parsedBalance.toFixed(4)} ETH`;
    }
    return `${parsedBalance.toFixed(4)} ETH`;
  };

  const changeLanguage = (lang: "en" | "es") => {
    localStorage.setItem("language", lang);
    setLanguage(lang);
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [setTheme]);

  return (
    <div
      className={`flex-1 p-6 ml-64 ${
        theme === "light" ? "bg-gray-50" : "bg-gray-900 text-white"
      }`}
    >
      <h1 className="text-3xl font-bold mb-4">{translations.configuration}</h1>
      <p className="mb-6">{translations.adjust_settings}</p>

      {account && (
        <>
          <div
            className={`mb-6 p-4 border ${
              theme === "light"
                ? "border-gray-300 bg-white"
                : "border-gray-700 bg-gray-800"
            } rounded-lg shadow-md`}
          >
            <h2
              className={`text-xl font-semibold mb-2 flex items-center ${
                theme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
            >
              <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-2" />
              {translations.account_details}
            </h2>
            <p
              className={`${
                theme === "light" ? "text-gray-800" : "text-gray-300"
              }`}
            >
              {translations.network}: {network}
            </p>
            <p
              className={`${
                theme === "light" ? "text-gray-800" : "text-gray-300"
              }`}
            >
              {translations.balance}: {formatBalance(balance, network)}
            </p>
          </div>

          {/* Cambio de Red */}
          <div
            className={`p-4 border rounded-lg shadow-md mb-6 ${
              theme === "light"
                ? "border-gray-300 bg-white"
                : "border-gray-700 bg-gray-800"
            }`}
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <ArrowsRightLeftIcon className="h-6 w-6 text-blue-500 mr-2" />
              {translations.change_network}
            </h2>
            <p
              className={`mb-4 ${
                theme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
            >
              {translations.select_network}
            </p>
            <div className="flex space-x-4">
              <button
                className={`flex flex-col items-center justify-center w-full py-8 font-semibold border rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105 ${
                  theme === "light"
                    ? "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                    : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                }`}
                onClick={() => switchNetwork(NETWORKS.holesky)}
              >
                <img
                  src="https://revoke.cash/assets/images/vendor/chains/ethereum.svg"
                  alt="Holesky"
                  className="h-16 w-16 mb-2"
                />
                Ethereum Holesky
              </button>
              <button
                className={`flex flex-col items-center justify-center w-full py-8 font-semibold border rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105 ${
                  theme === "light"
                    ? "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                    : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                }`}
                onClick={() => switchNetwork(NETWORKS.sepolia)}
              >
                <img
                  src="https://revoke.cash/assets/images/vendor/chains/base.svg"
                  alt="Sepolia"
                  className="h-16 w-16 mb-2"
                />
                Sepolia
              </button>
            </div>
          </div>

          {/* Idioma */}
          <div
            className={`p-6 border ${
              theme === "light"
                ? "border-gray-300 bg-white"
                : "border-gray-700 bg-gray-800"
            } rounded-lg shadow-md`}
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <GlobeAltIcon className="h-6 w-6 text-green-500 mr-2" />
              {translations.language}
            </h2>
            <p className="mb-4">{translations.select_language}</p>
            <div className="flex space-x-4">
              <button
                className={`py-2 px-4 rounded transition-all duration-300 ${
                  language === "es"
                    ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95"
                }`}
                onClick={() => changeLanguage("es")}
              >
                <img
                  src={esIcon}
                  alt="Español"
                  className="inline-block h-5 w-5 mr-2"
                />
                {translations.switch_to_spanish}
              </button>
              <button
                className={`py-2 px-4 rounded transition-all duration-300 ${
                  language === "en"
                    ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95"
                }`}
                onClick={() => changeLanguage("en")}
              >
                <img
                  src={enIcon}
                  alt="English"
                  className="inline-block h-5 w-5 mr-2"
                />
                {translations.switch_to_english}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tema */}
      <div
        className={`p-6 border ${
          theme === "light"
            ? "border-gray-300 bg-white"
            : "border-gray-700 bg-gray-800"
        } rounded-lg shadow-md mt-6`}
      >
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          {theme === "light" ? (
            <SunIcon className="h-6 w-6 text-yellow-500 mr-2" />
          ) : (
            <MoonIcon className="h-6 w-6 text-blue-500 mr-2" />
          )}
          {translations.theme}
        </h2>
        <p className="mb-4">{translations.select_theme}</p>
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 rounded transition-all duration-300 ${
              theme === "light"
                ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95"
            }`}
            onClick={() => {
              setTheme("light");
              localStorage.setItem("theme", "light");
            }}
          >
            {translations.light_mode}
          </button>
          <button
            className={`py-2 px-4 rounded transition-all duration-300 ${
              theme === "dark"
                ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95"
            }`}
            onClick={() => {
              setTheme("dark");
              localStorage.setItem("theme", "dark");
            }}
          >
            {translations.dark_mode}
          </button>
        </div>
      </div>

      {/* Snackbar para notificaciones */}
      {snackbarMessages.map((snackbarMessage, index) => (
        <Snackbar
          key={index}
          open={true}
          autoHideDuration={6000}
          onClose={() => handleSnackbarClose(snackbarMessage)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => handleSnackbarClose(snackbarMessage)}
            severity={snackbarMessage.severity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage.message}
          </Alert>
        </Snackbar>
      ))}
    </div>
  );
};

export default Configuracion;
