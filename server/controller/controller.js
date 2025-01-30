import multer from 'multer';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import DataModel from '../model/dbmodel.js';

export const sheetConfig = {
    'Default': {
        columns: {
            Name: { required: true, dbField: 'name' },
            Amount: {
                required: true,
                dbField: 'amount',
                validate: (value) => !isNaN(value) && value > 0
            },
            Date: {
                required: true,
                dbField: 'date',
                validate: (value) => {
                    const current = new Date();
                    return value.getMonth() === current.getMonth() &&
                        value.getFullYear() === current.getFullYear();
                }
            },
            Verified: {
                required: true,
                dbField: 'verified',
                validate: (value) => ['Yes', 'No'].includes(value)
            }
        }
    },
    'Invoices': {
        columns: {
            Name: { required: true, dbField: 'name' },
            InvoiceDate: { required: true, dbField: 'invoiceDate' },
            Amount: {
                required: true,
                dbField: 'amount',
                validate: (value) => value > 0
            },
            Status: {
                required: true,
                dbField: 'status',
                validate: (value) => ['Paid', 'Pending'].includes(value)
            }
        }
    }
};


export const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    return new Date(utc_days * 86400 * 1000);
};

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname) !== '.xlsx') {
            return cb(new Error('Only .xlsx files allowed!'), false);
        }
        cb(null, true);
    }
});


export const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const validationErrors = [];
        const validData = [];

        workbook.eachSheet((sheet) => {
            const config = sheetConfig[sheet.name] || sheetConfig.Default;
            const sheetErrors = [];
            const sheetValidRows = [];

            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;

                const rowData = {};
                const rowErrors = [];

                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = sheet.getRow(1).getCell(colNumber).value?.trim();
                    const columnConfig = config.columns[header];

                    if (columnConfig) {
                        let value = cell.value;


                        if (header === 'Date' && cell.type === ExcelJS.ValueType.Number) {
                            value = excelDateToJSDate(value);
                        }


                        if (header === 'Verified' && typeof value === 'boolean') {
                            value = value ? 'Yes' : 'No';
                        }


                        if (columnConfig.required && (value === null || value === undefined || value === '')) {
                            rowErrors.push(`${header} is required`);
                        }


                        if (value && columnConfig.validate && !columnConfig.validate(value)) {
                            rowErrors.push(`Invalid ${header} value`);
                        }


                        if (columnConfig.dbField) {
                            rowData[columnConfig.dbField] = value;
                        }
                    }
                });

                if (rowErrors.length > 0) {
                    sheetErrors.push({ row: rowNumber, errors: rowErrors });
                } else {
                    sheetValidRows.push({
                        sheetName: sheet.name,
                        ...rowData
                    });
                }
            });

            if (sheetErrors.length > 0) {
                validationErrors.push({ sheet: sheet.name, errors: sheetErrors });
            }
            validData.push(...sheetValidRows);
        });

        res.status(200).json({
            errors: validationErrors,
            validData,
            message: validationErrors.length > 0
                ? 'Validation completed with errors'
                : 'All data validated successfully'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const importData = async (req, res) => {
    try {
        const { validData } = req.body;

        if (!validData?.length) {
            return res.status(400).json({ error: 'No valid data to import' });
        }

        const result = await DataModel.insertMany(validData);

        res.status(200).json({
            message: `Successfully imported ${result.length} rows`,
            skipped: validData.length - result.length,
            insertedIds: result.map(doc => doc._id)
        });

    } catch (error) {
        res.status(500).json({
            error: 'Import failed',
            details: error.message
        });
    }
};

export const getImportedData = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const data = await DataModel.find()
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            data,
            currentPage: Number(page),
            totalPages: Math.ceil(await DataModel.countDocuments() / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteRow = async (req, res) => {
    try {
        const { id } = req.params;
        await DataModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Row deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const exportToExcel = async (req, res) => {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);
    try {
        const data = await DataModel.find().lean();
        if (!data || data.length === 0) {
            return res.status(404).send('No data available for export');
        }

        const headers = ['Name', 'Amount', 'Date', 'Verified'];
        const headerRow = headers.join(' | ');
        const divider = headers.map(() => '--------').join('|');

        const rows = data.map(item => {
            return [
                item.name,
                item.amount,
                new Date(item.date).toLocaleDateString(),
                item.verified ? 'Yes' : 'No'
            ].join(' | ');
        });

        const table = [headerRow, divider, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/plain');
        return res.send(table);

    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({
            success: false,
            message: 'Export failed',
            error: error.message
        });
    }
};