import express from 'express';
import { 
    upload,
    uploadFile,
    importData,
    getImportedData,
    deleteRow ,
    exportToExcel
  } from '../controller/controller.js';

import { errorHandler, validateId } from "../middleware/middleware.js"

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);
router.post('/import', importData);
router.get('/data', getImportedData);
router.delete("/:id", validateId, deleteRow);
router.get('/export', exportToExcel);
router.use(errorHandler);

export default router

