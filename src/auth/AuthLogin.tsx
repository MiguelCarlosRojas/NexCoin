import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Grid,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import "../styles/AuthLogin.css";

interface AuthLoginProps {
  onConnect: (account: string) => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onConnect }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const getInitialInfoMessage = () => (
    <>
      <Typography
        variant="h6"
        style={{
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
          fontSize: "1rem",
        }}
      >
        ¿Qué es una billetera?
      </Typography>
      <Box display="flex" justifyContent="center" mt={2}>
        <img
          src="../../src/assets/icons/wallet.svg"
          alt="Un hogar para tus Activos Digitales"
          style={{ width: "40px", marginRight: "10px" }}
        />
        <Box>
          <Typography
            style={{
              color: "white",
              textAlign: "left",
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            Un hogar para tus Activos Digitales
          </Typography>
          <Typography
            style={{
              color: "#A8A8A8",
              textAlign: "left",
              fontSize: "0.7rem",
            }}
          >
            Las carteras se utilizan para enviar, recibir, almacenar y mostrar
            activos digitales como Ethereum y NFTs.
          </Typography>
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" mt={2}>
        <img
          src="../../src/assets/icons/connect.svg"
          alt="Una nueva forma de iniciar sesión"
          style={{ width: "40px", marginRight: "10px" }}
        />
        <Box>
          <Typography
            style={{
              color: "white",
              textAlign: "left",
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            Una nueva forma de iniciar sesión
          </Typography>
          <Typography
            style={{
              color: "#A8A8A8",
              textAlign: "left",
              fontSize: "0.7rem",
            }}
          >
            En lugar de crear nuevas cuentas y contraseñas en cada sitio web,
            simplemente conecta tu cartera.
          </Typography>
        </Box>
      </Box>
      <Box textAlign="center" marginTop={2}>
        <Button
          variant="contained"
          color="primary"
          style={{
            margin: "4px",
            fontSize: "0.6rem",
            textTransform: "none",
            backgroundColor: "#6200ea",
          }}
        >
          Obtener una billetera
        </Button>
        <Button
          variant="text"
          color="primary"
          style={{
            margin: "4px",
            fontSize: "0.6rem",
            textTransform: "none",
            color: "#4A90E2",
          }}
          onClick={() =>
            window.open(
              "https://learn.rainbow.me/understanding-web3?utm_source=rainbowkit&utm_campaign=learnmore",
              "_blank"
            )
          }
        >
          Obtener más información
        </Button>
      </Box>
    </>
  );

  const [infoMessage, setInfoMessage] = useState<JSX.Element>(
    getInitialInfoMessage()
  );

  const handleWalletSelect = async (walletName: string) => {
    if (walletName === "MetaMask") {
      if (typeof window.ethereum === "undefined") {
        setSnackbarMessage(
          "MetaMask no está instalada o habilitada en este navegador."
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      setLoading(true);

      setInfoMessage(
        <Box display="flex" flexDirection="column" alignItems="center">
          <img
            src={walletImages["MetaMask"]}
            alt="MetaMask"
            style={{
              width: "50px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          />
          <Typography
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            Abriendo MetaMask...
          </Typography>
          <Typography
            style={{
              color: "#A8A8A8",
              textAlign: "center",
              fontSize: "0.8rem",
            }}
          >
            Confirma la conexión en la extensión
          </Typography>

          <div className="loader" style={{ marginTop: "20px" }}></div>
        </Box>
      );

      try {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts.length === 0) {
          throw new Error("No se seleccionó ninguna cuenta.");
        }

        onConnect(accounts[0]);
        setSnackbarMessage(`Conectado a ${walletName}`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setDialogOpen(false);
      } catch (error) {
        console.error("Error al conectar a MetaMask:", error);

        if ((error as { code: number }).code === 4001) {
          setSnackbarMessage("Conexión rechazada por el usuario.");
          setSnackbarSeverity("error");
        } else if ((error as { code: number }).code === -32002) {
          setSnackbarMessage(
            "MetaMask ya está esperando una conexión. Revisa la extensión."
          );
          setSnackbarSeverity("info");
        } else {
          setSnackbarMessage(
            "Error al conectar a MetaMask. Asegúrate de que MetaMask esté abierto."
          );
          setSnackbarSeverity("error");
        }

        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setInfoMessage(
        <Box display="flex" flexDirection="column" alignItems="center">
          <img
            src={walletImages[walletName]}
            alt={walletName}
            style={{
              width: "50px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          />
          <Typography
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            {walletName} - Actualmente no disponible
          </Typography>
          <Typography
            style={{
              color: "#A8A8A8",
              textAlign: "center",
              fontSize: "0.8rem",
            }}
          >
            Por favor, selecciona MetaMask para conectarte.
          </Typography>
        </Box>
      );
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setLoading(false);
    setInfoMessage(getInitialInfoMessage());
  };

  const handleConnectClick = () => {
    setDialogOpen(true);
  };

  const walletImages: { [key: string]: string } = {
    Rainbow: "../../src/assets/icons/rainbow.svg",
    "Coinbase Wallet": "../../src/assets/icons/coinbase.svg",
    MetaMask: "../../src/assets/icons/metamask.svg",
    WalletConnect: "../../src/assets/icons/walletconnect.svg",
    Frame: "../../src/assets/icons/frame.svg",
    "Rabby Wallet": "../../src/assets/icons/rabby.svg",
    Ledger: "../../src/assets/icons/ledger.svg",
    "Trust Wallet": "../../src/assets/icons/trustwallet.svg",
    Argent: "../../src/assets/icons/argent.svg",
    Zerion: "../../src/assets/icons/zerion.svg",
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-800 to-black text-white">
      <h1 className="text-5xl font-bold mb-4">Bienvenido a NexCoin</h1>
      <p className="mb-8 text-lg">
        Inicia sesión con WalletConnect para continuar.
      </p>
      <Button
        onClick={handleConnectClick}
        variant="contained"
        color="primary"
        disabled={loading}
        style={{
          backgroundColor: "#6200ea",
          borderRadius: "25px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "bold",
          textTransform: "none",
        }}
      >
        {loading ? "Cargando..." : "Conectar con WalletConnect"}
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          style: {
            borderRadius: "8px",
          },
        }}
      >
        <DialogContent
          style={{
            backgroundColor: "#000",
            color: "white",
            padding: "5px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            maxHeight: "500px",
          }}
        >
          <Grid container>
            <Grid
              item
              xs={5}
              style={{ padding: "13px", borderRight: "1px solid #A8A8A8" }}
            >
              <Typography
                variant="h6"
                style={{
                  color: "white",
                  textAlign: "left",
                  marginBottom: "16px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
              >
                Conectar una billetera
              </Typography>

              <Box
                style={{
                  maxHeight: "365px",
                  overflowY: "auto",
                  padding: "5px",
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    color: "#A8A8A8",
                    textAlign: "left",
                    marginBottom: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  Popular
                </Typography>

                {[
                  "Rainbow",
                  "Coinbase Wallet",
                  "MetaMask",
                  "WalletConnect",
                ].map((wallet) => (
                  <Button
                    key={wallet}
                    onClick={() => handleWalletSelect(wallet)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      justifyContent: "flex-start",
                      marginBottom: "8px",
                      color: "white",
                      textTransform: "none",
                      backgroundColor: "transparent",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgb(20, 20, 20)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <img
                      src={walletImages[wallet]}
                      alt={wallet}
                      style={{
                        width: "24px",
                        marginRight: "10px",
                        borderRadius: "4px",
                      }}
                    />
                    <Typography
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      {wallet}
                    </Typography>
                  </Button>
                ))}
                <Typography
                  variant="h6"
                  style={{
                    color: "#A8A8A8",
                    textAlign: "left",
                    marginBottom: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  Otro
                </Typography>

                {[
                  "Frame",
                  "Rabby Wallet",
                  "Ledger",
                  "Trust Wallet",
                  "Argent",
                  "Zerion",
                ].map((wallet) => (
                  <Button
                    key={wallet}
                    onClick={() => handleWalletSelect(wallet)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      justifyContent: "flex-start",
                      marginBottom: "8px",
                      color: "white",
                      textTransform: "none",
                      backgroundColor: "transparent",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgb(20, 20, 20)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <img
                      src={walletImages[wallet]}
                      alt={wallet}
                      style={{
                        width: "24px",
                        marginRight: "10px",
                        borderRadius: "4px",
                      }}
                    />
                    <Typography
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      {wallet}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </Grid>
            <Grid
              item
              xs={7}
              container
              justifyContent="center"
              alignItems="center"
              style={{ padding: "36px" }}
            >
              {infoMessage}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
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

export default AuthLogin;
