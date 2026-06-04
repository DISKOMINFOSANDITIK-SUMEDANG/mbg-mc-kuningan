"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  IconMenu2,
  IconX,
  IconChevronDown,
  IconDatabase,
  IconLogin,
} from "@tabler/icons-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Update active section based on scroll position
      const sections = ["home", "search", "about", "contact"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDataDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDataDropdown = () => {
    setIsDataDropdownOpen(!isDataDropdownOpen);
  };

  const handleDataMenuClick = (option: string) => {
    console.log("Selected data option:", option);
    setIsDataDropdownOpen(false);
    setIsMenuOpen(false);
    
    // Navigate to the appropriate data page
    const routes: Record<string, string> = {
      "Progress": "/data/progress",
      "SPPG": "/data/sppg",
      "Sudah Melaksanakan": "/data/sudah-melaksanakan",
      "Belum Melaksanakan": "/data/belum-melaksanakan",
      "Target SPPG": "/data/target-sppg",
      "Peredaran Uang": "/data/peredaran-uang"
    };
    
    const route = routes[option];
    if (route) {
      window.location.href = route;
    }
  };

  return (
    <header
      className={`z-50 transition-all duration-300 ${
        isHomePage
          ? isScrolled
            ? "sticky top-0 bg-white shadow-lg"
            : "absolute top-0 left-0 right-0 bg-transparent"
          : "sticky top-0 bg-white shadow-lg"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img
                src="/images/logo-kuningan.png"
                alt="Logo Kabupaten Kuningan"
                className="h-12 w-auto"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Makan Bergizi Gratis
              </h1>
              <p className="text-xs text-gray-600">Kabupaten Kuningan</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("home")}
              className={`font-medium transition-colors ${
                activeSection === "home"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : isHomePage && !isScrolled
                  ? "text-gray-800 hover:text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => scrollToSection("search")}
              className={`font-medium transition-colors ${
                activeSection === "search"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : isHomePage && !isScrolled
                  ? "text-gray-800 hover:text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Cari Sekolah
            </button>

            {/* Data Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDataDropdown}
                className={`font-medium transition-colors flex items-center space-x-1 ${
                  isHomePage && !isScrolled
                    ? "text-gray-800 hover:text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <IconDatabase className="h-4 w-4" />
                <span>Data</span>
                <IconChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isDataDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDataDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleDataMenuClick("Progress")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Progress
                  </button>
                  <button
                    onClick={() => handleDataMenuClick("SPPG")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    SPPG
                  </button>
                  <button
                    onClick={() => handleDataMenuClick("Sudah Melaksanakan")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Sudah Melaksanakan
                  </button>
                  <button
                    onClick={() => handleDataMenuClick("Belum Melaksanakan")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Belum Melaksanakan
                  </button>
                  <button
                    onClick={() => handleDataMenuClick("Target SPPG")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Target SPPG
                  </button>
                  <button
                    onClick={() => handleDataMenuClick("Peredaran Uang")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Peredaran Uang
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => scrollToSection("about")}
              className={`font-medium transition-colors ${
                activeSection === "about"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : isHomePage && !isScrolled
                  ? "text-gray-800 hover:text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Tentang Program
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className={`font-medium transition-colors ${
                activeSection === "contact"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : isHomePage && !isScrolled
                  ? "text-gray-800 hover:text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Kontak
            </button>
          </nav>

          {/* CMS Login Button (Desktop) */}
          <div className="hidden lg:flex items-center">
            <a
              href="/cms/auth/login"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <IconLogin className="h-4 w-4" />
              <span>Masuk</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`transition-colors ${
                isHomePage && !isScrolled
                  ? "text-gray-800 hover:text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {isMenuOpen ? (
                <IconX className="h-6 w-6" />
              ) : (
                <IconMenu2 className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div
              className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 rounded-lg mt-2 ${
                isHomePage && !isScrolled
                  ? "bg-white/10 backdrop-blur-sm"
                  : "bg-gray-50"
              }`}
            >
              <button
                onClick={() => scrollToSection("home")}
                className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === "home"
                    ? "text-blue-600 bg-blue-50"
                    : isHomePage && !isScrolled
                    ? "text-gray-800 hover:text-blue-600 hover:bg-white/20"
                    : "text-gray-700 hover:text-blue-600 hover:bg-white"
                }`}
              >
                Beranda
              </button>
              <button
                onClick={() => scrollToSection("search")}
                className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === "search"
                    ? "text-blue-600 bg-blue-50"
                    : isHomePage && !isScrolled
                    ? "text-gray-800 hover:text-blue-600 hover:bg-white/20"
                    : "text-gray-700 hover:text-blue-600 hover:bg-white"
                }`}
              >
                Cari Sekolah
              </button>

              {/* Mobile Data Menu */}
              <div className="space-y-1">
                <button
                  onClick={toggleDataDropdown}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-md font-medium transition-colors ${
                    isHomePage && !isScrolled
                      ? "text-gray-800 hover:text-blue-600 hover:bg-white/20"
                      : "text-gray-700 hover:text-blue-600 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconDatabase className="h-4 w-4" />
                    <span>Data</span>
                  </div>
                  <IconChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isDataDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDataDropdownOpen && (
                  <div className="ml-6 space-y-1">
                    <button
                      onClick={() => handleDataMenuClick("Progress")}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isHomePage && !isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-white/20"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white"
                      }`}
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => handleDataMenuClick("SPPG")}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isHomePage && !isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-white/20"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white"
                      }`}
                    >
                      SPPG
                    </button>
                    <button
                      onClick={() => handleDataMenuClick("Sudah Melaksanakan")}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isHomePage && !isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-white/20"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white"
                      }`}
                    >
                      Sudah Melaksanakan
                    </button>
                    {/* <button
                      onClick={() => handleDataMenuClick("Belum Melaksanakan")}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isHomePage && !isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-white/20"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white"
                      }`}
                    >
                      Belum Melaksanakan
                    </button> */}
                    <button
                      onClick={() => handleDataMenuClick("Target SPPG")}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isHomePage && !isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-white/20"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white"
                      }`}
                    >
                      Target SPPG
                    </button>
                    <button
                      onClick={() => handleDataMenuClick("Peredaran Uang")}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isHomePage && !isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-white/20"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white"
                      }`}
                    >
                      Peredaran Uang
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => scrollToSection("about")}
                className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === "about"
                    ? "text-blue-600 bg-blue-50"
                    : isHomePage && !isScrolled
                    ? "text-gray-800 hover:text-blue-600 hover:bg-white/20"
                    : "text-gray-700 hover:text-blue-600 hover:bg-white"
                }`}
              >
                Tentang Program
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === "contact"
                    ? "text-blue-600 bg-blue-50"
                    : isHomePage && !isScrolled
                    ? "text-gray-800 hover:text-blue-600 hover:bg-white/20"
                    : "text-gray-700 hover:text-blue-600 hover:bg-white"
                }`}
              >
                Kontak
              </button>
              <div className="px-3 py-2">
                <a
                  href="/cms/auth/login"
                  className="inline-flex items-center justify-center w-full gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <IconLogin className="h-4 w-4" />
                  <span>Masuk</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
