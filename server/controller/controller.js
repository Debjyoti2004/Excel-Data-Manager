import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import DataModel from '../model/dbmodel.js';

const excelDateToJSDate = (serial) => {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  };
  
  const sheetConfig = {
    Default: {
      columns: {
        Name: { dbField: 'name', required: true },
        Amount: { dbField: 'amount', required: true, validate: (v) => typeof v === 'number' },
        Date: {
          dbField: 'date',
          required: true, 
          validate: (v) => v instanceof Date && !isNaN(v.getTime())
        },
        Verified: {
          dbField: 'verified',
          required: true, 
          validate: (v) => ['Yes', 'No'].includes(v)
        }
      }
    },
    Invoices: {
      columns: {
        Name: { dbField: 'name', required: true },
        InvoiceDate: {
          dbField: 'invoiceDate',
          required: true,
          validate: (v) => v instanceof Date && !isNaN(v.getTime())
        },
        Amount: { dbField: 'amount', required: true, validate: (v) => typeof v === 'number' },
        Status: {
          dbField: 'status',
          required: true,
          validate: (v) => ['Paid', 'Pending'].includes(v)
        }
      }
    }
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
  
              if (header === 'Date' || header === 'InvoiceDate') {
                if (cell.type === ExcelJS.ValueType.Number) {
                  value = excelDateToJSDate(value);
                } else if (typeof value === 'string') {
                  value = new Date(value.replace(' ', 'T') + 'Z');
                  if (isNaN(value.getTime())) {
                    rowErrors.push(`Invalid ${header} value`);
                  }
                }
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
  
              if (columnConfig.dbField && rowErrors.length === 0) {
                rowData[columnConfig.dbField] = value instanceof Date ? value.toISOString() : value;
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