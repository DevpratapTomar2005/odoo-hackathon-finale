import express from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middleware.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health",(req,res)=>{
    res.status(200).json({success:true, message:"server is running"});
});

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);

app.use(globalErrorHandler);

export default app;