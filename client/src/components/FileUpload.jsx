import React, { useState, useCallback, useRef } from "react";
import { CloudUpload, CheckCircle, Loader2, FileSpreadsheet, AlertCircle, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const FileUpload = ({ onUploadSuccess, onUploadError = (error) => console.error(error) }) => {

  const BACKEND_URL = "http://localhost:3000";

  const { theme } = useTheme();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [validData, setValidData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);


  const validDataRef = useRef(null);
  const errorsRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (!validTypes.includes(file.type)) {
      return "Please upload only .xlsx files";
    }
    if (file.size > 2 * 1024 * 1024) {
      return "File size should be less than 2MB";
    }
    return null;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const error = validateFile(droppedFile);
      if (error) {
        setErrors([{ sheet: "Upload Error", errors: [{ row: 1, errors: [error] }] }]);
        return;
      }
      setFile(droppedFile);
      setUploadStatus(null);
      setValidData([]);
      setErrors([]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setErrors([{ sheet: "Upload Error", errors: [{ row: 1, errors: [error] }] }]);
        return;
      }
      setFile(selectedFile);
      setUploadStatus(null);
      setValidData([]);
      setErrors([]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setUploadStatus("success");
      setValidData(data.validData);
      setErrors(data.errors);
      onUploadSuccess(data);
    } catch (error) {
      setUploadStatus("error");
      setErrors([{ sheet: "Upload Error", errors: [{ row: 1, errors: [error.message] }] }]);
      onUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };


  const scrollToValidData = () => {
    validDataRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const scrollToErrors = () => {
    errorsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={`p-8 rounded-xl shadow-xl transition-colors duration-300
        ${theme === 'dark'
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-100'}`}>


        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden group cursor-pointer
            ${isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : theme === 'dark'
                ? 'border-gray-600 hover:border-blue-400 bg-gray-700/50'
                : 'border-gray-200 hover:border-blue-400 bg-gray-50'}
            border-2 border-dashed rounded-xl p-8 transition-all duration-300`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ scale: isDragging ? 1.1 : 1 }}
              className={`p-4 rounded-full shadow-md
                ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}
            >
              <FileSpreadsheet size={40} className="text-blue-500" />
            </motion.div>
            <div className="space-y-2 text-center">
              <h3 className={`text-xl font-semibold
                ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                {file ? file.name : "Drop your Excel file here"}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                Accepts .xlsx files up to 2MB
              </p>
            </div>
          </div>


          <motion.div
            className={`absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100
              ${theme === 'dark'
                ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30'
                : 'bg-gradient-to-r from-blue-100/50 to-purple-100/50'}`}
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>


        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 font-medium
            transition-all duration-300 border rounded-lg
            ${theme === 'dark'
              ? 'text-blue-400 border-blue-500/50 hover:bg-blue-500/10'
              : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          Select File Manually
        </button>


        <motion.button
          onClick={uploadFile}
          disabled={!file || isUploading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`mt-6 w-full py-3 px-4 rounded-lg font-medium text-white
            flex items-center justify-center gap-2 transition-all duration-300
            ${file && !isUploading
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg'
              : theme === 'dark' ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CloudUpload className="w-5 h-5" />
          )}
          {isUploading ? "Uploading..." : "Upload Excel File"}
        </motion.button>


        <div className="flex gap-4 mt-4">
          <button
            onClick={scrollToValidData}
            className={`flex items-center gap-2 transition-colors
              ${theme === 'dark'
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'}`}
          >
            <ArrowDown className="w-4 h-4" />
            Scroll to Valid Data
          </button>
          <button
            onClick={scrollToErrors}
            className={`flex items-center gap-2 transition-colors
              ${theme === 'dark'
                ? 'text-red-400 hover:text-red-300'
                : 'text-red-600 hover:text-red-700'}`}
          >
            <ArrowDown className="w-4 h-4" />
            Scroll to Errors
          </button>
        </div>


        <AnimatePresence>
          {uploadStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <div className={`flex items-center gap-2 p-4 rounded-lg border ${uploadStatus === "success"
                  ? theme === 'dark'
                    ? 'bg-green-900/20 border-green-700 text-green-400'
                    : 'bg-green-50 border-green-200 text-green-700'
                  : theme === 'dark'
                    ? 'bg-red-900/20 border-red-700 text-red-400'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                {uploadStatus === "success" ? (
                  <CheckCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
                ) : (
                  <AlertCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
                )}
                <p className="text-sm font-medium">
                  {uploadStatus === "success"
                    ? "File uploaded successfully!"
                    : "Upload failed. Please try again."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <div ref={errorsRef}>
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className={`p-4 rounded-lg border ${theme === 'dark'
                    ? 'bg-red-900/20 border-red-700'
                    : 'bg-red-50 border-red-200'
                  }`}>
                  <h3 className={`mb-2 font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-700'
                    }`}>Validation Errors:</h3>
                  {errors.map((sheetError, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="mb-3 last:mb-0"
                    >
                      <p className={`font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                        }`}>Sheet: {sheetError.sheet}</p>
                      <ul className={`mt-1 space-y-1 list-disc list-inside ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                        }`}>
                        {sheetError.errors.map((rowError, rowIndex) => (
                          <li key={rowIndex} className="text-sm">
                            Row {rowError.row}: {rowError.errors.join(", ")}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        <div ref={validDataRef}>
          <AnimatePresence>
            {validData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div className={`p-4 rounded-lg border ${theme === 'dark'
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-green-50 border-green-200'
                  }`}>
                  <h3 className={`mb-4 font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'
                    }`}>Valid Entries</h3>
                  <div className="space-y-3">
                    {validData.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                          }`}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Sheet:</span> {entry.sheetName}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Name:</span> {entry.name}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Amount:</span> ₹{entry.amount.toLocaleString("en-IN")}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Date:</span> {new Date(entry.date).toLocaleDateString("en-GB")}
                          </p>
                          {entry.verified && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Verified:</span> {entry.verified}
                            </p>
                          )}
                          {entry.invoiceDate && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Invoice Date:</span> {new Date(entry.invoiceDate).toLocaleDateString("en-GB")}
                            </p>
                          )}
                          {entry.status && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Status:</span> {entry.status}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;