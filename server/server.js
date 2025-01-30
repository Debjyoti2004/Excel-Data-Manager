import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import router from './routes/allRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use('/api', router);
app.get("/", (req, res) => res.send("API WORKING FINE"))


const start = async () => {
  try {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    await connectDB();
  } catch (error) {
    console.error('Server startup error:', error);
  }
};

start();