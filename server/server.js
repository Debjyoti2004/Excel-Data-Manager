import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import router from './routes/allRoutes.js';
import cors from "cors"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;


app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "DELETE"], 
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

app.get("/", (req, res) => res.send("API WORKING FINE"))
app.use('/api', router);



const start = async () => {
  try {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    await connectDB();
  } catch (error) {
    console.error('Server startup error:', error);
  }
};

start();