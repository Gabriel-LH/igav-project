// src/components/layout/Header.tsx
import React from "react";
import { Bell, Search, User, Settings, LogOut } from "lucide-react";

export const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-semibold text-gray-800">SuperAdmin</span>
            </div>

            {/* Barra de búsqueda */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-64"
              />
            </div>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <p className="text-xs text-gray-500">superadmin@system.com</p>
              </div>
              <button className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white">
                <User className="w-4 h-4" />
              </button>
            </div>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
