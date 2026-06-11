"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  IconMenu2,
  IconX,
  IconChevronDown,
  IconDatabase,
  IconLogin,
  IconHome,
  IconSchool,
  IconUsers,
  IconBuildingStore,
  IconLeaf,
  IconInfoCircle,
  IconPhone,
} from "@tabler/icons-react";

// Desktop Navigation Link Component
interface NavLinkProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ onClick, active, icon, children }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "text-blue-600 bg-blue-50 shadow-sm"
          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

// Dropdown Item Component
interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
}

function DropdownItem({ onClick, children }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-all duration-200"
    >
      {children}
    </button>
  );
}

// Mobile Navigation Link Component
interface MobileNavLinkProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function MobileNavLink({ onClick, active, icon, children }: MobileNavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "text-blue-600 bg-blue-50 shadow-sm"
          : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

// Mobile Dropdown Item Component
interface MobileDropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
}

function MobileDropdownItem({ onClick, children }: MobileDropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
    >
      {children}
    </button>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDataDropdownOpen(false);
      }
    };

    if (isHomePage) {
      window.addEventListener("scroll", handleScroll);
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (isHomePage) {
        window.removeEventListener("scroll", handleScroll);
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHomePage]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close dropdown when closing menu
    if (isMenuOpen) {
      setIsDataDropdownOpen(false);
    }
  };

  const navigateToPage = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
    setIsDataDropdownOpen(false);
  };

  const toggleDataDropdown = () => {
    setIsDataDropdownOpen(!isDataDropdownOpen);
  };

  const handleDataMenuClick = (option: string) => {
    setIsDataDropdownOpen(false);
    setIsMenuOpen(false);

    // Navigate to respective pages
    switch (option) {
      case "Progress":
        router.push("/data/progress");
        break;
      case "SPPG":
        router.push("/data/sppg");
        break;
      case "Sudah Melaksanakan":
        router.push("/data/sudah-melaksanakan");
        break;
      case "Target SPPG":
        router.push("/data/target-sppg");
        break;
      case "Peredaran Uang":
        router.push("/data/peredaran-uang");
        break;
      default:
        break;
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
        isHomePage
          ? isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-gray-200"
            : "bg-white/90 backdrop-blur-sm shadow-sm border-transparent"
          : "bg-white/95 backdrop-blur-md shadow-lg border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
          {/* Logo Section - Improved */}
          <button
            onClick={() => navigateToPage("/")}
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer -ml-1"
          >
            <div className="relative flex-shrink-0">
              <Image
                src="/images/logo-kuningan.png"
                alt="Logo Kabupaten Kuningan"
                width={44}
                height={44}
                className="h-9 sm:h-10 lg:h-11 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                Makan Bergizi Gratis
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-600 font-medium">
                Kabupaten Kuningan
              </p>
            </div>
          </button>

          {/* Desktop Navigation - Improved */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <NavLink
              onClick={() => navigateToPage("/")}
              active={pathname === "/"}
              icon={<IconHome className="h-4 w-4" />}
            >
              Beranda
            </NavLink>
            <NavLink
              onClick={() => navigateToPage("/search")}
              active={pathname === "/search"}
              icon={<IconSchool className="h-4 w-4" />}
            >
              Sekolah
            </NavLink>
            {/* <NavLink
              onClick={() => navigateToPage("/groups")}
              active={pathname === "/groups" || pathname.startsWith("/groups/")}
              icon={<IconUsers className="h-4 w-4" />}
            >
              Kelompok
            </NavLink> */}
            <NavLink
              onClick={() => navigateToPage("/sppg-search")}
              active={pathname === "/sppg-search"}
              icon={<IconBuildingStore className="h-4 w-4" />}
            >
              SPPG
            </NavLink>
            <NavLink
              onClick={() => navigateToPage("/bahan-baku")}
              active={pathname === "/bahan-baku" || pathname.startsWith("/bahan-baku/")}
              icon={<IconLeaf className="h-4 w-4" />}
            >
              Bahan Baku
            </NavLink>

            {/* Data Dropdown - Improved */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDataDropdown}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith("/data")
                    ? "text-blue-600 bg-blue-50 shadow-sm"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"
                }`}
              >
                <IconDatabase className="h-4 w-4" />
                <span>Data</span>
                <IconChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDataDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDataDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                  <DropdownItem onClick={() => handleDataMenuClick("Progress")}>
                    Progress
                  </DropdownItem>
                  <DropdownItem onClick={() => handleDataMenuClick("SPPG")}>
                    SPPG
                  </DropdownItem>
                  <DropdownItem onClick={() => handleDataMenuClick("Sudah Melaksanakan")}>
                    Sudah Melaksanakan
                  </DropdownItem>
                  <DropdownItem onClick={() => handleDataMenuClick("Target SPPG")}>
                    Target SPPG
                  </DropdownItem>
                  <DropdownItem onClick={() => handleDataMenuClick("Peredaran Uang")}>
                    Peredaran Uang
                  </DropdownItem>
                </div>
              )}
            </div>

            <NavLink
              onClick={() => navigateToPage("/about")}
              active={pathname === "/about"}
              icon={<IconInfoCircle className="h-4 w-4" />}
            >
              Tentang
            </NavLink>
            <NavLink
              onClick={() => navigateToPage("/contact")}
              active={pathname === "/contact"}
              icon={<IconPhone className="h-4 w-4" />}
            >
              Kontak/Pengaduan
            </NavLink>
          </nav>

          {/* CMS Login Button - Improved */}
          <div className="hidden lg:flex items-center ml-1">
            <a
              href="/cms/auth/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <IconLogin className="h-4 w-4" />
              <span>Masuk</span>
            </a>
          </div>

          {/* Mobile menu button - Improved */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <IconX className="h-6 w-6" />
              ) : (
                <IconMenu2 className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Improved */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="py-3 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <MobileNavLink
                onClick={() => navigateToPage("/")}
                active={pathname === "/"}
                icon={<IconHome className="h-5 w-5" />}
              >
                Beranda
              </MobileNavLink>
              <MobileNavLink
                onClick={() => navigateToPage("/search")}
                active={pathname === "/search"}
                icon={<IconSchool className="h-5 w-5" />}
              >
                Sekolah
              </MobileNavLink>
              {/* <MobileNavLink
                onClick={() => navigateToPage("/groups")}
                active={pathname === "/groups" || pathname.startsWith("/groups/")}
                icon={<IconUsers className="h-5 w-5" />}
              >
                Kelompok
              </MobileNavLink> */}
              <MobileNavLink
                onClick={() => navigateToPage("/sppg-search")}
                active={pathname === "/sppg-search"}
                icon={<IconBuildingStore className="h-5 w-5" />}
              >
                SPPG
              </MobileNavLink>
              <MobileNavLink
                onClick={() => navigateToPage("/bahan-baku")}
                active={pathname === "/bahan-baku" || pathname.startsWith("/bahan-baku/")}
                icon={<IconLeaf className="h-5 w-5" />}
              >
                Bahan Baku
              </MobileNavLink>

              {/* Mobile Data Dropdown */}
              <div className="space-y-1">
                <button
                  onClick={toggleDataDropdown}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname.startsWith("/data")
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconDatabase className="h-5 w-5" />
                    <span>Data</span>
                  </div>
                  <IconChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDataDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDataDropdownOpen && (
                  <div className="ml-8 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <MobileDropdownItem onClick={() => handleDataMenuClick("Progress")}>
                      Progress
                    </MobileDropdownItem>
                    <MobileDropdownItem onClick={() => handleDataMenuClick("SPPG")}>
                      SPPG
                    </MobileDropdownItem>
                    <MobileDropdownItem onClick={() => handleDataMenuClick("Sudah Melaksanakan")}>
                      Sudah Melaksanakan
                    </MobileDropdownItem>
                    <MobileDropdownItem onClick={() => handleDataMenuClick("Target SPPG")}>
                      Target SPPG
                    </MobileDropdownItem>
                    <MobileDropdownItem onClick={() => handleDataMenuClick("Peredaran Uang")}>
                      Peredaran Uang
                    </MobileDropdownItem>
                  </div>
                )}
              </div>

              <MobileNavLink
                onClick={() => navigateToPage("/about")}
                active={pathname === "/about"}
                icon={<IconInfoCircle className="h-5 w-5" />}
              >
                Tentang
              </MobileNavLink>
              <MobileNavLink
                onClick={() => navigateToPage("/contact")}
                active={pathname === "/contact"}
                icon={<IconPhone className="h-5 w-5" />}
              >
                Kontak/Pengaduan
              </MobileNavLink>

              {/* Mobile Login Button */}
              <div className="pt-4 px-4 pb-2">
                <a
                  href="/cms/auth/login"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md active:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <IconLogin className="h-5 w-5" />
                  <span>Masuk ke CMS</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
