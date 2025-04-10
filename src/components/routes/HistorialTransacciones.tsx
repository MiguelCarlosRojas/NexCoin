import React, { useState, useEffect } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import DownloadIcon from "@mui/icons-material/CloudDownload";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SearchIcon from "@mui/icons-material/Search";
import {
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import translationsES from "../translate/Español";
import translationsEN from "../translate/Ingles";
import { useTheme } from "../context/useTheme";

interface Transaccion {
  recipient: string;
  amount: string;
  date: string;
  hash: string;
}

interface HistorialTransaccionesProps {
  transactions: Transaccion[];
}

const HistorialTransacciones: React.FC<HistorialTransaccionesProps> = ({
  transactions,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [emergencyTransactions, setEmergencyTransactions] = useState<
    Transaccion[]
  >([]);
  const [generalTransactions, setGeneralTransactions] = useState<Transaccion[]>(
    () => {
      const savedTransactions = localStorage.getItem("generalTransactions");
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    }
  );
  const [syncStatus, setSyncStatus] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "es"
  );
  const { theme } = useTheme();

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

  useEffect(() => {
    localStorage.setItem(
      "generalTransactions",
      JSON.stringify(generalTransactions)
    );
  }, [generalTransactions]);

  useEffect(() => {
    if (emergencyTransactions.length > 0) {
      const timer = setTimeout(() => {
        setGeneralTransactions((prev) => [...prev, ...emergencyTransactions]);
        setEmergencyTransactions([]);
        setSyncStatus((prev) => prev.map(() => "synchronized"));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [emergencyTransactions]);

  const formatHash = (hash: string) => {
    return hash.length > 40
      ? `${hash.slice(0, 15)}...${hash.slice(-15)}`
      : hash;
  };

  const formatRecipientDialog = (recipient: string) => {
    return recipient.length > 20 ? `${recipient.slice(0, 20)}...` : recipient;
  };

  const formatRecipientGeneral = (recipient: string) => {
    return recipient;
  };

  const filteredTransactions = generalTransactions.filter((tx) =>
    tx.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Historial de Transacciones", 10, 10);
    filteredTransactions.forEach((tx, index) => {
      doc.text(
        `Transacción ${index + 1}: Destinatario: ${tx.recipient}, Cantidad: ${
          tx.amount
        } ETH, Fecha: ${tx.date}, Hash: ${tx.hash}`,
        10,
        20 + index * 10
      );
    });
    doc.save("historial_transacciones.pdf");
    handleClose();
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, "historial_transacciones.xlsx");
    handleClose();
  };

  const downloadCSV = () => {
    const csvData = filteredTransactions.map((tx) => ({
      Destinatario: tx.recipient,
      "Cantidad (ETH)": tx.amount,
      Fecha: tx.date,
      Hash: tx.hash,
    }));
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, "historial_transacciones.csv");
    handleClose();
  };

  const openSyncDialog = () => {
    const newEmergencyTransactions = transactions.filter(
      (tx) =>
        !generalTransactions.some((generalTx) => generalTx.hash === tx.hash)
    );
    setEmergencyTransactions(newEmergencyTransactions);
    setSyncDialogOpen(true);
    setSyncStatus(newEmergencyTransactions.map(() => "pending"));

    newEmergencyTransactions.forEach((_, index) => {
      setTimeout(() => {
        setSyncStatus((prev) => {
          const updated = [...prev];
          updated[index] = "syncing";
          return updated;
        });
      }, 1000 * (index + 1));

      setTimeout(() => {
        setSyncStatus((prev) => {
          const updated = [...prev];
          updated[index] = "synchronized";
          return updated;
        });
      }, 4000 * (index + 1));
    });
  };

  const closeSyncDialog = () => {
    setSyncDialogOpen(false);
  };

  return (
    <div className="flex-1 p-6 ml-64">
      <h1 className="text-3xl font-bold mb-4">
        {translations.transaction_history}
      </h1>
      <div className="flex justify-between mb-1">
        <div
          className={`flex items-center mb-1 p-2 border rounded-md w-full transition duration-300 focus-within:border-blue-500 ${
            theme === "light"
              ? "border-gray-300 bg-white"
              : "border-gray-600 bg-gray-800"
          }`}
          style={{ maxWidth: "550px" }}
        >
          <SearchIcon
            className={`mr-2 ${
              theme === "light" ? "text-black" : "text-white"
            }`}
          />
          <input
            type="text"
            placeholder={translations.search_placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full outline-none ${
              theme === "light"
                ? "bg-white text-black"
                : "bg-gray-800 text-white"
            }`}
          />
        </div>

        <div className="flex">
          <div className="mr-2">
            <Button
              aria-controls={anchorEl ? "download-menu" : undefined}
              aria-haspopup="true"
              onClick={handleDownloadClick}
              startIcon={<DownloadIcon />}
              className="transition-all duration-300 hover:bg-blue-600 hover:text-white hover:w-24"
              style={{ width: "140px" }}
            >
              {translations.download}
            </Button>
            <Menu
              id="download-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                style: {
                  backgroundColor: theme === "light" ? "white" : "#2c2c2c",
                  color: theme === "light" ? "black" : "white",
                },
              }}
            >
              <MenuItem onClick={downloadPDF}>
                <span
                  className={`${
                    theme === "light" ? "text-black" : "text-white"
                  }`}
                >
                  PDF
                </span>
              </MenuItem>
              <MenuItem onClick={downloadExcel}>
                <span
                  className={`${
                    theme === "light" ? "text-black" : "text-white"
                  }`}
                >
                  Excel
                </span>
              </MenuItem>
              <MenuItem onClick={downloadCSV}>
                <span
                  className={`${
                    theme === "light" ? "text-black" : "text-white"
                  }`}
                >
                  CSV
                </span>
              </MenuItem>
            </Menu>
          </div>
          <div>
            <Button
              startIcon={<SyncIcon />}
              onClick={openSyncDialog}
              className="transition-all duration-300 hover:bg-green-600 hover:text-white"
              style={{ width: "140px" }}
            >
              {translations.sync}
            </Button>
          </div>
        </div>
      </div>

      {/* Ventana de sincronización */}
      <Dialog open={syncDialogOpen} onClose={closeSyncDialog} maxWidth="lg">
        <DialogTitle
          className={`${
            theme === "light" ? "bg-white text-black" : "bg-gray-800 text-white"
          } ${theme === "light" ? "border-gray-300" : "border-gray-600"}`}
        >
          {translations.syncing_transactions}
        </DialogTitle>
        <DialogContent
          className={`${
            theme === "light" ? "bg-white text-black" : "bg-gray-800 text-white"
          }`}
        >
          <div className="grid grid-cols-1 gap-4">
            <div
              className={`p-4 border rounded-md ${
                theme === "light" ? "border-gray-300" : "border-gray-600"
              }`}
            >
              <div className="flex items-center">
                <SyncIcon
                  className={`mr-2 ${
                    theme === "light" ? "text-black" : "text-white"
                  }`}
                />
                <p className="font-bold">{translations.syncing_transactions}</p>
              </div>
              <div className="flex items-center mt-2">
                <p
                  className={`${
                    theme === "light" ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {translations.please_wait}
                </p>
              </div>
            </div>
          </div>

          {/* Listado de transacciones dentro del diálogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {emergencyTransactions.length === 0 ? (
              <p
                className={`${
                  theme === "light" ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {translations.no_emergency_transactions}
              </p>
            ) : (
              emergencyTransactions.map((tx, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-md mt-2 ${
                    theme === "light"
                      ? "border-gray-300 bg-white"
                      : "border-gray-600 bg-gray-800"
                  }`}
                >
                  <div className="flex items-center">
                    <AccountCircleIcon className="mr-2" />
                    <p
                      className={`font-bold ${
                        theme === "light" ? "text-black" : "text-white"
                      }`}
                    >
                      {translations.addressee_transfer}:{" "}
                      {formatRecipientDialog(tx.recipient)}
                    </p>
                  </div>
                  <div className="flex items-center mt-2">
                    <AccountBalanceWalletIcon className="mr-2" />
                    <p
                      className={`${
                        theme === "light" ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {translations.amount}: {tx.amount} ETH
                    </p>
                  </div>
                  <div className="flex items-center mt-2">
                    <p
                      className={`${
                        theme === "light" ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {translations.date}: {tx.date}
                    </p>
                  </div>
                  <div className="flex items-center mt-2">
                    <p
                      className={`${
                        theme === "light" ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      Hash:{" "}
                      <a
                        href={`https://holesky.beaconcha.in/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-400"
                      >
                        {formatHash(tx.hash)}
                      </a>
                    </p>
                  </div>
                  <div className="flex items-center mt-2">
                    {syncStatus[index] === "pending" && (
                      <PendingIcon className="mr-2 text-yellow-500" />
                    )}
                    {syncStatus[index] === "syncing" && (
                      <HourglassEmptyIcon className="mr-2 text-blue-500" />
                    )}
                    {syncStatus[index] === "synchronized" && (
                      <div className="flex items-center mt-2">
                        <CheckCircleIcon className="mr-2 text-green-500" />
                        <p className="text-green-500">
                          {translations.synchronized_correctly}
                        </p>
                      </div>
                    )}
                    <p
                      className={`${
                        theme === "light" ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {syncStatus[index] === "pending" &&
                        translations.synchronization_pending}
                      {syncStatus[index] === "syncing" &&
                        translations.synchronizing}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
        <DialogActions
          className={`${theme === "light" ? "bg-white" : "bg-gray-800"}`}
        >
          <Button onClick={closeSyncDialog} color="primary">
            {translations.close}
          </Button>
        </DialogActions>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
        {filteredTransactions.length === 0 ? (
          <p>{translations.no_transactions}</p>
        ) : (
          filteredTransactions.map((tx, index) => (
            <div
              key={index}
              className={`p-4 border rounded-md mt-2 ${
                theme === "light" ? "border-gray-300" : "border-gray-600"
              }`}
            >
              <div className="flex items-center">
                <AccountCircleIcon className="mr-2" />
                <p
                  className={`font-bold ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {translations.addressee_transfer}:{" "}
                  {formatRecipientGeneral(tx.recipient)}
                </p>
              </div>
              <div className="flex items-center mt-2">
                <AccountBalanceWalletIcon className="mr-2" />
                <p
                  className={`${
                    theme === "light" ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {translations.amount}: {tx.amount} ETH
                </p>
              </div>
              <div className="flex items-center mt-2">
                <p
                  className={`${
                    theme === "light" ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {translations.date}: {tx.date}
                </p>
              </div>
              <div className="flex items-center mt-2">
                <p
                  className={`${
                    theme === "light" ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  Hash:{" "}
                  <a
                    href={`https://holesky.beaconcha.in/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-400"
                  >
                    {formatHash(tx.hash)}
                  </a>
                </p>
              </div>
              <div className="flex items-center mt-2">
                <CheckCircleIcon className="mr-1 text-green-500" />
                <p className="text-green-500">
                  {translations.synchronized_correctly}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorialTransacciones;
