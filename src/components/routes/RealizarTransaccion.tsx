import React, { useState, useEffect } from "react";
import MetaMask from "../../utils/MetaMask";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { parseEther } from "@ethersproject/units";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import Web3 from "web3";
import { getNexCoinContract } from "../../contracts/NexCoinContract";
import translationsES from "../translate/Español";
import translationsEN from "../translate/Ingles";
import { useTheme } from "../context/useTheme";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface RealizarTransaccionProps {
  account: string;
  onNewTransaction: (transaction: Transaccion) => void;
}

interface Transaccion {
  recipient: string;
  amount: string;
  date: string;
  hash: string;
}

const RealizarTransaccion: React.FC<RealizarTransaccionProps> = ({
  onNewTransaction,
}) => {
  const { theme } = useTheme();
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [showNextButton, setShowNextButton] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const lang = localStorage.getItem("language") || "es";
      setCurrentLanguage(lang);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const translations =
    currentLanguage === "en" ? translationsEN : translationsES;
  const predefinedAmounts = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const products = [
    { name: "Cerveza", price: 1 },
    { name: "Refresco", price: 0.5 },
    { name: "Agua", price: 0.2 },
    { name: "Manzana", price: 0.3 },
    { name: "Banana", price: 0.4 },
    { name: "Naranja", price: 0.6 },
    { name: "Pan", price: 0.2 },
    { name: "Leche", price: 0.8 },
    { name: "Arroz", price: 1.2 },
    { name: "Azúcar", price: 1.0 },
    { name: "Sal", price: 0.1 },
    { name: "Aceite", price: 1.5 },
    { name: "Fideos", price: 0.9 },
    { name: "Café", price: 1.3 },
    { name: "Té", price: 1.0 },
    { name: "Galletas", price: 0.5 },
    { name: "Snacks", price: 0.7 },
    { name: "Chocolate", price: 1.0 },
  ];

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRecipientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName("Usuario Privado");
    setPublicAddress(recipient);
    setShowNextButton(true);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.ethereum) {
      setSnackbarMessage("MetaMask no está instalado");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    if (!recipient) {
      setSnackbarMessage("Por favor ingresa la dirección del contrato.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    console.log("Obteniendo instancia del contrato NexCoin...");
    const nexCoinContract = getNexCoinContract(web3, account, recipient);
    console.log("Instancia del contrato NexCoin obtenida:", nexCoinContract);

    try {
      const parsedAmount = web3.utils.toWei(totalAmount.toString(), "ether");
      setIsLoading(true);

      console.log("Iniciando transacción con el contrato...");
      const tx = await nexCoinContract.methods.initiatePayment(false).send({
        value: parsedAmount,
      });

      console.log("Transacción completada. Hash:", tx.transactionHash);

      const newTransaction: Transaccion = {
        recipient,
        amount: totalAmount.toString(),
        date: new Date().toLocaleString(),
        hash: tx.transactionHash,
      };

      onNewTransaction(newTransaction);

      setSnackbarMessage(translations.snackbar_transaction_success);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setRecipient("");
      setAmount("");
      setTotalAmount(0);
      setStep(1);
      setShowNextButton(false);
      setUserName(null);
      setPublicAddress(null);
      setSelectedProducts([]);
    } catch (error) {
      console.error("Error al realizar la transacción:", error);
      setSnackbarMessage(translations.snackbar_transaction_error);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.ethereum) {
      setSnackbarMessage("MetaMask no está instalado");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      if (!recipient) {
        setSnackbarMessage("Por favor ingresa la dirección del contrato.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      console.log("Obteniendo instancia del contrato NexCoin...");
      const nexCoinContract = getNexCoinContract(web3, account, recipient);
      console.log("Instancia del contrato NexCoin obtenida:", nexCoinContract);

      const parsedAmount = parseEther(amount);
      setIsLoading(true);

      const transactionParameters = {
        to: recipient,
        from: account,
        value: parsedAmount._hex,
        gas: "21000",
      };

      console.log(
        "Iniciando transferencia manual con los parámetros:",
        transactionParameters
      );

      const txHash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      })) as string;

      console.log("Transacción manual completada. Hash:", txHash);

      const newTransaction: Transaccion = {
        recipient,
        amount: amount,
        date: new Date().toLocaleString(),
        hash: txHash,
      };

      onNewTransaction(newTransaction);

      setSnackbarMessage("Transacción exitosa!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setRecipient("");
      setAmount("");
      setTotalAmount(0);
      setStep(1);
      setShowNextButton(false);
      setUserName(null);
      setPublicAddress(null);
      setSelectedProducts([]);
    } catch (error) {
      console.error("Error al realizar la transacción:", error);
      setSnackbarMessage("Error al realizar la transacción");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredefinedAmountClick = (amt: string) => {
    setAmount(amt);
  };

  const handleBackToRecipient = () => {
    setStep(1);
    setShowNextButton(false);
    setUserName(null);
    setPublicAddress(null);
    setTotalAmount(0);
    setSelectedProducts([]);
    setAmount("");
  };

  const handleNextStep = (type: string) => {
    setStep(type === "catalog" ? 2 : 3);
  };

  const handleProductSelect = (product: { name: string; price: number }) => {
    if (selectedProducts.includes(product.name)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== product.name));
      setTotalAmount((prevTotal) => prevTotal - product.price);
    } else {
      setSelectedProducts([...selectedProducts, product.name]);
      setTotalAmount((prevTotal) => prevTotal + product.price);
    }
  };

  return (
    <div className="flex-1 p-6 ml-64 relative flex flex-col">
      <h1 className="text-3xl font-bold mb-4">
        {translations.perform_transaction}
      </h1>

      <div className="flex flex-row">
        <div className="flex-1 space-y-4">
          {step === 1 && (
            <form onSubmit={handleRecipientSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recipient"
                  className={`block text-sm font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {translations.recipient_address}
                </label>

                <input
                  id="recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className={`mt-1 block w-full p-2 border rounded-md transition duration-300 ${
                    theme === "light"
                      ? "border-gray-300 bg-white text-black"
                      : "border-gray-600 bg-gray-800 text-white"
                  }`}
                  required
                  disabled={userName !== null}
                />
              </div>

              {userName && (
                <div
                  className={`p-4 border rounded-md ${
                    theme === "light" ? "border-gray-300" : "border-gray-600"
                  }`}
                >
                  <div className="flex items-center">
                    <AccountCircleIcon className="mr-2" />
                    <p
                      className={`font-bold ${
                        theme === "light" ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {userName}
                    </p>
                  </div>
                  <div className="flex items-center mt-2">
                    <AccountBalanceWalletIcon className="mr-2" />
                    <p
                      className={`${
                        theme === "light" ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      {publicAddress}
                    </p>
                  </div>
                </div>
              )}

              {!showNextButton && (
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                  {translations.next} <ArrowForwardIcon className="ml-2" />
                </button>
              )}

              {showNextButton && (
                <div className="flex space-x-4">
                  <div
                    className={`border rounded-md p-4 flex-1 transition flex flex-col items-center ${
                      theme === "light"
                        ? "border-gray-300 hover:bg-blue-100"
                        : "border-gray-600 hover:bg-gray-700"
                    }`}
                    onClick={() => handleNextStep("catalog")}
                  >
                    <StorefrontIcon style={{ fontSize: 50 }} />
                    <h2
                      className={`text-center font-bold mt-2 ${
                        theme === "light" ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {translations.product_catalog}
                    </h2>
                  </div>
                  <div
                    className={`border rounded-md p-4 flex-1 transition flex flex-col items-center ${
                      theme === "light"
                        ? "border-gray-300 hover:bg-blue-100"
                        : "border-gray-600 hover:bg-gray-700"
                    }`}
                    onClick={() => handleNextStep("manual")}
                  >
                    <MonetizationOnIcon style={{ fontSize: 50 }} />
                    <h2
                      className={`text-center font-bold mt-2 ${
                        theme === "light" ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {translations.manual_transfer}
                    </h2>
                  </div>
                </div>
              )}

              {showNextButton && (
                <button
                  type="button"
                  onClick={handleBackToRecipient}
                  className={`mt-2 ${
                    theme === "light"
                      ? "bg-gray-300 hover:bg-gray-200 text-black"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  } font-bold py-2 px-4 rounded flex items-center`}
                >
                  <ArrowBackIcon className="mr-2" />
                  {translations.go_back_to_recipient}
                </button>
              )}
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p
                className={`text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {translations.select_products}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.name}
                    className={`flex justify-between border p-2 rounded-md transition ${
                      selectedProducts.includes(product.name)
                        ? theme === "light"
                          ? "border-gray-400 bg-gray-200"
                          : "border-gray-500 bg-gray-700"
                        : theme === "light"
                        ? "border-gray-300 bg-white hover:bg-gray-100"
                        : "border-gray-600 bg-gray-800 hover:bg-gray-700"
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <span
                      className={`${
                        theme === "light" ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {product.name}
                    </span>
                    <span
                      className={`${
                        theme === "light" ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {product.price} ETH
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>
                  {totalAmount === 0
                    ? translations.no_orders
                    : translations.total.replace(
                        "{{total}}",
                        totalAmount.toFixed(2)
                      )}
                </span>
              </div>

              <button
                type="button"
                onClick={handleTransactionSubmit}
                className={`bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded flex items-center ${
                  isLoading || totalAmount === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading || totalAmount === 0}
              >
                {isLoading ? (
                  translations.loading
                ) : (
                  <>
                    {translations.send_transaction}{" "}
                    <ArrowForwardIcon className="ml-2" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToRecipient}
                className={`mt-4 ${
                  theme === "light"
                    ? "bg-gray-300 hover:bg-gray-200 text-black"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                } font-bold py-2 px-4 rounded flex items-center`}
              >
                <ArrowBackIcon className="mr-2" />
                {translations.addressee}
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleManualTransferSubmit} className="space-y-4">
              <p
                className={`text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {translations.amount_to_transfer}
              </p>
              <div className="flex space-x-4 mt-2">
                {predefinedAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`font-bold py-2 px-4 rounded transition ${
                      theme === "light"
                        ? "bg-gray-200 hover:bg-gray-300 text-black"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                    onClick={() => handlePredefinedAmountClick(amt)}
                  >
                    {amt} ETH
                  </button>
                ))}
              </div>
              <label
                htmlFor="amount"
                className={`block text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                } mt-4`}
              >
                {translations.manual_amount}
              </label>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1"
                className={`mt-1 block w-full p-2 border rounded-md ${
                  theme === "light"
                    ? "border-gray-300 bg-white text-black"
                    : "border-gray-600 bg-gray-800 text-white"
                }`}
                required
              />
              <button
                type="submit"
                className={`bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded flex items-center ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Enviando..."
                ) : (
                  <>
                    {translations.send_transaction}{" "}
                    <ArrowForwardIcon className="ml-2" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleBackToRecipient}
                className={`mt-2 ${
                  theme === "light"
                    ? "bg-gray-300 hover:bg-gray-200 text-black"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                } font-bold py-2 px-4 rounded flex items-center`}
              >
                <ArrowBackIcon className="mr-2" />
                {translations.addressee}
              </button>
            </form>
          )}
        </div>

        <div className="flex-shrink-0 ml-12 mt-0">
          <MetaMask />
        </div>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RealizarTransaccion;
