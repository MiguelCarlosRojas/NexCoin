import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import translationsES from "../translate/Español";
import translationsEN from "../translate/Ingles";

interface NavbarProps {
  onDisconnect: () => void;
  account: string;
}

const Navbar: React.FC<NavbarProps> = ({ onDisconnect, account }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showObjectivesMenu, setShowObjectivesMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const navigate = useNavigate();
  const location = useLocation();

  const toggleProfileMenu = () => setShowProfileMenu((prev) => !prev);
  const toggleObjectivesMenu = () => setShowObjectivesMenu((prev) => !prev);

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

  const handleLogout = () => {
    onDisconnect();
    navigate("/");
  };

  const truncatedAccount =
    account.length > 8 ? `${account.slice(0, 8)}...` : account;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".profile-menu") &&
        !target.closest(".profile-icon")
      ) {
        setShowProfileMenu(false);
      }
      if (!target.closest(".objectives-menu")) {
        setShowObjectivesMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isHomePage = location.pathname === "/";

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="p-4 flex items-center justify-between rounded-lg shadow-lg bg-gray-800 text-white">
      <h1 className="text-xl font-bold">NexCoin</h1>

      {isHomePage && (
        <div className="flex items-center ml-auto space-x-4 mr-4">
          <button
            onClick={() => scrollToSection("descripcion")}
            className="hover:text-gray-300"
          >
            {translations.tittle_description}
          </button>
          <div className="relative">
            <button
              onClick={toggleObjectivesMenu}
              className="hover:text-gray-300"
            >
              {translations.details}
            </button>
            {showObjectivesMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-2 objectives-menu z-50 bg-gray-700 text-white">
                <button
                  onClick={() => scrollToSection("objetivos")}
                  className="w-full text-left hover:bg-gray-600 rounded p-1"
                >
                  {translations.objectives}
                </button>
                <button
                  onClick={() => scrollToSection("beneficios")}
                  className="w-full text-left hover:bg-gray-600 rounded p-1"
                >
                  {translations.benefits}
                </button>
                <button
                  onClick={() => scrollToSection("caracteristicas")}
                  className="w-full text-left hover:bg-gray-600 rounded p-1"
                >
                  {translations.features}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => scrollToSection("equipo")}
            className="hover:text-gray-300"
          >
            {translations.team_members}
          </button>
          <button
            onClick={() => scrollToSection("conclusiones")}
            className="hover:text-gray-300"
          >
            {translations.conclusions_tittle}
          </button>
        </div>
      )}

      <div className="relative">
        <FontAwesomeIcon
          icon={faUser}
          className="text-2xl cursor-pointer profile-icon"
          onClick={toggleProfileMenu}
        />
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-4 profile-menu z-50 bg-gray-700 text-white">
            <div className="flex flex-col items-center mb-2">
              <FontAwesomeIcon icon={faUser} className="text-3xl mb-2" />
              <h2 className="text-lg font-bold">
                {translations.profile}: {truncatedAccount}
              </h2>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full text-left transition-all duration-300 transform hover:bg-red-500 hover:text-white hover:scale-105 rounded-lg p-2"
            >
              <FontAwesomeIcon icon={faSignOut} className="mr-2" />{" "}
              {translations.logout}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
