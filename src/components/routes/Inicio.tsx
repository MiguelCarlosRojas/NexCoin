import React, { useState, useEffect } from "react";
import "../../styles/Inicio.css";
import photo1 from "../../assets/img/photo1.jpeg";
import photo2 from "../../assets/img/photo2.jpeg";
import photo3 from "../../assets/img/photo3.jpeg";
import translationsES from "../translate/Español";
import translationsEN from "../translate/Ingles";
import { useTheme } from "../context/useTheme";

const Inicio: React.FC = () => {
  const { theme } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "es"
  );
  const translations =
    currentLanguage === "en" ? translationsEN : translationsES;

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

  return (
    <div className="flex-1 p-6 ml-64">
      <div className="space-y-8">
        <section id="descripcion">
          <h2 className="text-2xl font-bold mb-2">
            {translations.tittle_description}
          </h2>
          <p>{translations.description}</p>
        </section>

        <section
          id="objetivos"
          className="relative flex items-center justify-between"
        >
          <div className="objectives-list">
            <h2 className="text-2xl font-bold mb-2">
              {translations.objectives}
            </h2>
            <ul className="list-disc pl-5">
              <li>{translations.objective_list1}</li>
              <li>{translations.objective_list2}</li>
              <li>{translations.objective_list3}</li>
              <li>{translations.objective_list4}</li>
              <li>{translations.objective_list5}</li>
              <li>{translations.objective_list6}</li>
              <li>{translations.objective_list7}</li>
            </ul>
          </div>
          <div className="floating-objective-animation">
            <div className="floating-content">🚀</div>
          </div>
        </section>

        <section
          id="beneficios"
          className="relative flex items-center justify-between"
        >
          <div className="benefits-list">
            <h2 className="text-2xl font-bold mb-2">{translations.benefits}</h2>
            <ul className="list-disc pl-5">
              <li>{translations.benefit_list1}</li>
              <li>{translations.benefit_list2}</li>
              <li>{translations.benefit_list3}</li>
              <li>{translations.benefit_list4}</li>
              <li>{translations.benefit_list5}</li>
              <li>{translations.benefit_list6}</li>
              <li>{translations.benefit_list7}</li>
              <li>{translations.benefit_list8}</li>
              <li>{translations.benefit_list9}</li>
              <li>{translations.benefit_list10}</li>
              <li>{translations.benefit_list11}</li>
              <li>{translations.benefit_list12}</li>
            </ul>
          </div>
          <div className="floating-benefit-animation">
            <div className="floating-content">🛒</div>
          </div>
        </section>

        <section
          id="caracteristicas"
          className="relative flex items-center justify-between"
        >
          <div className="features-list">
            <h2 className="text-2xl font-bold mb-2">{translations.features}</h2>
            <ul className="list-disc pl-5">
              <li>{translations.features_list1}</li>
              <li>{translations.features_list2}</li>
              <li>{translations.features_list3}</li>
              <li>{translations.features_list4}</li>
              <li>{translations.features_list5}</li>
              <li>{translations.features_list6}</li>
              <li>{translations.features_list7}</li>
              <li>{translations.features_list8}</li>
              <li>{translations.features_list9}</li>
              <li>{translations.features_list10}</li>
            </ul>
          </div>
          <div className="floating-feature-animation">
            <div className="floating-content">🔄</div>
          </div>
        </section>

        <section id="equipo">
          <h2 className="text-2xl font-bold mb-2">
            {translations.team_members}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Miembro 1 */}
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
              }`}
            >
              <img
                src={photo1}
                alt="Jhanmarco Godoy"
                className="rounded-full w-32 h-32 mx-auto"
              />
              <h3 className="text-xl font-semibold text-center mt-4">
                Jhanmarco Godoy
              </h3>
              <p className="text-center">Desarrollador Backend</p>
              <div className="flex justify-center space-x-4 mt-4">
                <a
                  href="https://github.com/JhanmarcoGodoyLevano"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-glyphs/30/github.png"
                    alt="GitHub"
                  />
                </a>
                <a
                  href="https://gitlab.com/jhanmarco.godoy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-filled/30/gitlab.png"
                    alt="GitLab"
                  />
                </a>
                <a
                  href="https://www.linkedin.com/in/jhanmarco-godoy-levano-50b620240/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-glyphs/30/linkedin.png"
                    alt="LinkedIn"
                  />
                </a>
              </div>
            </div>

            {/* Miembro 2 */}
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
              }`}
            >
              <img
                src={photo2}
                alt="Miguel Carlos"
                className="rounded-full w-32 h-32 mx-auto"
              />
              <h3 className="text-xl font-semibold text-center mt-4">
                Miguel Carlos
              </h3>
              <p className="text-center">Desarrollador Frontend</p>
              <div className="flex justify-center space-x-4 mt-4">
                <a
                  href="https://github.com/MiguelCarlosRojas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-glyphs/30/github.png"
                    alt="GitHub"
                  />
                </a>
                <a
                  href="https://gitlab.com/MiguelCarlosRojas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-filled/30/gitlab.png"
                    alt="GitLab"
                  />
                </a>
                <a
                  href="https://www.linkedin.com/in/miguelacarlos/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-glyphs/30/linkedin.png"
                    alt="LinkedIn"
                  />
                </a>
              </div>
            </div>

            {/* Miembro 3 */}
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
              }`}
            >
              <img
                src={photo3}
                alt="Toshiro Inami"
                className="rounded-full w-32 h-32 mx-auto"
              />
              <h3 className="text-xl font-semibold text-center mt-4">
                Toshiro Inami
              </h3>
              <p className="text-center">Diseñador UI/UX</p>
              <div className="flex justify-center space-x-4 mt-4">
                <a
                  href="https://github.com/ToshiroInami"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-glyphs/30/github.png"
                    alt="GitHub"
                  />
                </a>
                <a
                  href="https://gitlab.com/toshiro.inami"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-filled/30/gitlab.png"
                    alt="GitLab"
                  />
                </a>
                <a
                  href="https://www.linkedin.com/in/toshiro-cesar-inami-armas-aa0997238/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://img.icons8.com/ios-glyphs/30/linkedin.png"
                    alt="LinkedIn"
                  />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="conclusiones">
          <h2 className="text-2xl font-bold mb-2">
            {translations.conclusions_tittle}
          </h2>
          <p>{translations.conclusions}</p>
        </section>
      </div>

      <footer className="bg-gray-800 text-white p-4 rounded-lg mt-8 text-center">
        <p>&copy; {translations.copy}</p>
        <p>{translations.copy_detail}</p>
      </footer>
    </div>
  );
};

export default Inicio;
