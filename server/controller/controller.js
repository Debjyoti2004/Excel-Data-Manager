import multer from 'multer';
import ExcelJS from 'exceljs';
import DataModel from '../model/dbmodel.js';
import path from 'path';

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
    try {
        const data = await DataModel.find().lean();
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Exported Data");


        sheet.addRow(["Name", "Amount", "Date", "Verified"]);

        data.forEach((row) => {

            const dateObj = new Date(row.date);
            const formattedDate = [
                dateObj.getDate().toString().padStart(2, '0'),
                (dateObj.getMonth() + 1).toString().padStart(2, '0'),
                dateObj.getFullYear()
            ].join('-');


            const formattedAmount = row.amount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            sheet.addRow([
                row.name,
                formattedAmount,
                formattedDate,
                row.verified
            ]);
        });


        const filePath = path.join(__dirname, "exported_data.xlsx");
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, "exported_data.xlsx", (err) => {
            fs.unlinkSync(filePath);
            if (err) console.error('Download error:', err);
        });

    } catch (error) {
        res.status(500).json({
            error: "Export failed",
            details: error.message
        });
    }
};