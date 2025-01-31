import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg fixed w-full z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Data Manager
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/validation" className="hover:text-blue-500 transition-colors">Validation</Link>
            <Link to="/import" className="hover:text-blue-500 transition-colors">Data Manager</Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              to="/validation"
              className="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Validation
            </Link>
            <Link
              to="/import"
              className="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Data Manager
            </Link>
            <button
              onClick={toggleDarkMode}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-gray-800 text-white py-6 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-center md:text-left">
            © 2025 Debjyoti Shit. All rights reserved.
          </p>
        </div>
        <div className="flex space-x-6">
          <a
            href="https://www.linkedin.com/in/debjyotishit/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://x.com/DebjyotiSh27921"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            <FaTwitter size={24} />
          </a>
          <a
            href="https://github.com/Debjyoti2004"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            <FaGithub size={24} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export { Navbar, Footer };