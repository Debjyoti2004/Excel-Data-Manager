import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

const BACKEND_URL = "http://localhost:3000";


const DataManager = () => {
    const { theme } = useTheme();
    const [manualData, setManualData] = useState({
        name: "",
        amount: "",
        date: "",
        verified: "Yes",
    });
    const [previewData, setPreviewData] = useState([]);
    const [importedData, setImportedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchImportedData(currentPage);
    }, [currentPage]);

    const handleManualInputChange = (e) => {
        const { name, value } = e.target;
        setManualData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddManualData = () => {
        const { name, amount, date, verified } = manualData;

        if (!name || !amount || !date || !verified) {
            toast.error("All fields are required");
            return;
        }

        const validatedRow = validateRow({
            name,
            amount: parseFloat(amount),
            date,
            verified,
        });

        if (!validatedRow.isValid) {
            toast.error(validatedRow.errors.join(", "));
            return;
        }

        setPreviewData((prev) => [...prev, { ...validatedRow, _id: Date.now().toString() }]);
        toast.success("Data added to preview");
        setManualData({ name: "", amount: "", date: "", verified: "Yes" });
    };

    const validateRow = (row) => {
        const errors = [];
        if (!row.name) errors.push("Name is required");
        if (typeof row.amount !== "number" || isNaN(row.amount)) errors.push("Amount must be a number");

        const date = new Date(row.date);
        if (isNaN(date)) errors.push("Invalid date format");

        if (!["Yes", "No"].includes(row.verified)) errors.push("Verified must be Yes/No");

        return {
            ...row,
            date: date.toISOString(),
            isValid: errors.length === 0,
            errors,
        };
    };

    const handleImport = async () => {
        if (!previewData.length) {
            toast.error("No data to import");
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(`${BACKEND_URL}/api/import`, {
                validData: previewData.map((row) => ({
                    name: row.name,
                    amount: row.amount,
                    date: row.date,
                    verified: row.verified,
                })),
            });

            toast.success(data.message);
            setPreviewData([]);
            fetchImportedData(currentPage);
        } catch (error) {
            toast.error(error.response?.data?.error || "Import failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchImportedData = async (page) => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}/api/data?page=${page}&limit=20`);
            setImportedData(data.data || []);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            toast.error("Failed to fetch data");
            setImportedData([]);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await axios.delete(`${BACKEND_URL}/api/${id}`);
                toast.success("Row deleted successfully");
                fetchImportedData(currentPage);
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

    const handleExport = () => {
        const allData = [...previewData, ...importedData];
        const worksheet = XLSX.utils.json_to_sheet(
            allData.map((row) => ({
                Name: row.name,
                Amount: row.amount,
                Date: formatDate(row.date),
                Verified: row.verified,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");
        XLSX.writeFile(workbook, "exported_data.xlsx");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const containerClasses = theme === 'dark'
        ? 'bg-gray-800 text-gray-100'
        : 'bg-white text-gray-700';

    const inputClasses = theme === 'dark'
        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500'
        : 'bg-white border-gray-300 text-gray-700 focus:border-blue-600 focus:ring-blue-600';

    const tableHeaderClasses = theme === 'dark'
        ? 'bg-gray-700 text-gray-100'
        : 'bg-gray-50 text-gray-700';

    const tableRowClasses = theme === 'dark'
        ? 'border-gray-700 hover:bg-gray-700'
        : 'border-gray-200 hover:bg-gray-50';



    return (
        <div className={`w-full max-w-4xl p-6 rounded-lg shadow-lg transition-colors duration-200 ${containerClasses}`}>
            <div className="mb-8">
                <h2 className="mb-4 text-lg font-medium">Add Data Manually</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="name"
                        value={manualData.name}
                        onChange={handleManualInputChange}
                        placeholder="Name"
                        className={`p-2 border rounded-md transition-colors duration-200 ${inputClasses}`}
                    />
                    <input
                        type="number"
                        name="amount"
                        value={manualData.amount}
                        onChange={handleManualInputChange}
                        placeholder="Amount"
                        className={`p-2 border rounded-md transition-colors duration-200 ${inputClasses}`}
                    />
                    <input
                        type="date"
                        name="date"
                        value={manualData.date}
                        onChange={handleManualInputChange}
                        className={`p-2 border rounded-md transition-colors duration-200 ${inputClasses}`}
                    />
                    <select
                        name="verified"
                        value={manualData.verified}
                        onChange={handleManualInputChange}
                        className={`p-2 border rounded-md transition-colors duration-200 ${inputClasses}`}
                    >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>

                    </select>
                </div>
                <button
                    onClick={handleAddManualData}
                    className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Add Data
                </button>
            </div>

            {previewData.length > 0 && (
                <div className="mb-8">
                    <h2 className="mb-4 text-lg font-medium">Preview Data (Not Imported)</h2>
                    <div className="overflow-x-auto rounded-lg border border-opacity-50">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className={tableHeaderClasses}>
                                    <th className="p-3 text-left font-medium">Name</th>
                                    <th className="p-3 text-left font-medium">Amount</th>
                                    <th className="p-3 text-left font-medium">Date</th>
                                    <th className="p-3 text-left font-medium">Verified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((item) => (
                                    <tr key={item._id} className={tableRowClasses}>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3">{formatAmount(item.amount)}</td>
                                        <td className="p-3">{formatDate(item.date)}</td>
                                        <td className="p-3">{item.verified}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Imported Data</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={handleImport}
                            disabled={loading || previewData.length === 0}
                            className={`px-4 py-2 text-white rounded-md transition-colors duration-200 
                                ${loading || previewData.length === 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {loading ? "Importing..." : "Import Data"}
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors duration-200"
                        >
                            Export Data (.xlsx)
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-opacity-50">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className={tableHeaderClasses}>
                                <th className="p-3 text-left font-medium">Name</th>
                                <th className="p-3 text-left font-medium">Amount</th>
                                <th className="p-3 text-left font-medium">Date</th>
                                <th className="p-3 text-left font-medium">Verified</th>
                                <th className="p-3 text-left font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {importedData.map((item) => (
                                <tr key={item._id} className={tableRowClasses}>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{formatAmount(item.amount)}</td>
                                    <td className="p-3">{formatDate(item.date)}</td>
                                    <td className="p-3">{item.verified}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-md transition-colors duration-200 
                            ${currentPage === 1
                                ? 'opacity-50 cursor-not-allowed'
                                : theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Previous
                    </button>
                    <span className="flex items-center">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage >= totalPages}
                        className={`px-4 py-2 rounded-md transition-colors duration-200 
                            ${currentPage >= totalPages
                                ? 'opacity-50 cursor-not-allowed'
                                : theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataManager;