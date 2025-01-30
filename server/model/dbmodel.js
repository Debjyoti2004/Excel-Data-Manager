import mongoose from 'mongoose';


const dataSchema = new mongoose.Schema(
  {
    name: String,
    amount: Number,
    date: Date,
    verified: String,
    invoiceDate: Date,
    status: String,
    
  },
  { strict: false } 
);

const DataModel = mongoose.model('Data', dataSchema);

export default DataModel;