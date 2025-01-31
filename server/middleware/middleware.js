import cors from 'cors';
import mongoose from 'mongoose';


export const errorHandler = (err, req, res, next) => {

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: 'The provided ID is not valid'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: 'Validation Failed',
      details: err.message
    });
  }


  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      details: 'Maximum file size is 2MB'
    });
  }


  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};


// export const corsMiddleware = cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   methods: ['GET', 'POST', 'DELETE', 'PUT'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// });


export const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      error: 'Invalid ID',
      details: 'The provided ID is not in correct format'
    });
  }
  next();
};