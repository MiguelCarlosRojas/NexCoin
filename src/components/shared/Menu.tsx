import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faUsers,
  faBook,
  faCalendar,
  faExchange,
  faChevronDown,
  faChevronRight,
  faRocket,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import translationsES from "../translate/Español";
import translationsEN from "../translate/Ingles";
import { useTheme } from "../context/useTheme";

interface MenuProps {
  onDisconnect: () => void;
  account: string;
}

const Menu: React.FC<MenuProps> = ({ onDisconnect, account }) => {
  const [showTransaccionesContent, setShowTransaccionesContent] =
    useState(false);
  const [showInformesContent, setShowInformesContent] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "es"
  );
  const { theme } = useTheme();
  const location = useLocation();

  const toggleTransacciones = () =>
    setShowTransaccionesContent(!showTransaccionesContent);
  const toggleInformes = () => setShowInformesContent(!showInformesContent);
  const isActive = (path: string) =>
    location.pathname === path ? "bg-gray-600" : "";
  const translations =
    currentLanguage === "en" ? translationsEN : translationsES;

  useEffect(() => {
    const lang = localStorage.getItem("language") || "es";
    setCurrentLanguage(lang);

    const handleStorageChange = () => {
      const newLang = localStorage.getItem("language") || "es";
      setCurrentLanguage(newLang);
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="flex">
      <nav
        className={`w-64 h-screen fixed top-0 left-0 shadow-lg transition-width duration-300 z-50 p-6 
        ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-900 text-white"
        }`}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <FontAwesomeIcon icon={faRocket} className="mr-2" />{" "}
            {translations.nexcoin}
          </h1>
          <p className="text-sm italic">{translations.cryptocurrency_app}</p>
        </div>
        <ul className="mt-4 space-y-2">
          <li>
            <Link
              to="/"
              className={`flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors ${isActive(
                "/"
              )}`}
            >
              <FontAwesomeIcon icon={faHome} className="mr-3" />{" "}
              {translations.home}
            </Link>
          </li>
          <li>
            <a
              onClick={toggleTransacciones}
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors "
            >
              <FontAwesomeIcon icon={faExchange} className="mr-3" />
              {translations.transactions}
              <FontAwesomeIcon
                icon={showTransaccionesContent ? faChevronDown : faChevronRight}
                className="ml-auto"
              />
            </a>
            <ul
              className={`ml-4 space-y-2 ${
                showTransaccionesContent ? "block" : "hidden"
              }`}
            >
              <li>
                <Link
                  to="/transacciones/realizar"
                  className={`flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors ${isActive(
                    "/transacciones/realizar"
                  )}`}
                >
                  <FontAwesomeIcon icon={faUsers} className="mr-3" />{" "}
                  {translations.perform_transaction}
                </Link>
              </li>
              <li>
                <Link
                  to="/transacciones/historial"
                  className={`flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors ${isActive(
                    "/transacciones/historial"
                  )}`}
                >
                  <FontAwesomeIcon icon={faBook} className="mr-3" />{" "}
                  {translations.transaction_history}
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <a
              onClick={toggleInformes}
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors "
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-3" />{" "}
              {translations.information}
              <FontAwesomeIcon
                icon={showInformesContent ? faChevronDown : faChevronRight}
                className="ml-auto"
              />
            </a>
            <ul
              className={`ml-4 space-y-2 ${
                showInformesContent ? "block" : "hidden"
              }`}
            >
              <li>
                <Link
                  to="/informes/estadisticas"
                  className={`flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors ${isActive(
                    "/informes/estadisticas"
                  )}`}
                >
                  <FontAwesomeIcon icon={faCalendar} className="mr-3" />{" "}
                  {translations.statistics}
                </Link>
              </li>
              <li>
                <Link
                  to="/informes/reportes"
                  className={`flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors ${isActive(
                    "/informes/reportes"
                  )}`}
                >
                  <FontAwesomeIcon icon={faBook} className="mr-3" />{" "}
                  {translations.reportes}
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link
              to="/configuracion"
              className={`flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors ${isActive(
                "/configuracion"
              )}`}
            >
              <FontAwesomeIcon icon={faCog} className="mr-3" />{" "}
              {translations.configuration}
            </Link>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-6 ml-64">
        <Navbar onDisconnect={onDisconnect} account={account} />
        {/* Aquí puedes agregar más contenido dependiendo de la ruta actual */}
      </main>
    </div>
  );
};

export default Menu;
