import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middleware.js";
const app = express();

app.use(express.json());

app.get("/health",(req,res)=>{
    res.status(200).json({success:true, message:"server is running"});
});

app.use(globalErrorHandler);

export default app;