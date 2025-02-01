import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FileUpload from "./components/FileUpload.jsx";
import DataManager from "./components/DataManager.jsx";
import { Navbar, Footer } from "./components/Navbar.jsx";
import './index.css';
import { useTheme } from './context/ThemeContext.jsx';
import NotFound from './components/NotFound.jsx';


const App = () => {
  const { theme, toggleTheme } = useTheme();

  const handleUploadSuccess = (data) => {
    console.log("Upload successful:", data);
  };

  const handleUploadError = (error) => {
    console.error("Upload error:", error);
  };

  return (
    <Router>
      <div className={`min-h-screen flex flex-col ${theme}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />

        <main className="flex-grow flex items-center justify-center pt-16">
          <div className="w-full max-w-4xl px-8 sm:px-12 lg:px-16 py-12">
            <Routes>
              <Route
                path="/"
                element={
                  <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                  />
                }
              />
              <Route
                path="/validation"
                element={
                  <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                  />
                }
              />
              <Route path="/import" element={<DataManager />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
