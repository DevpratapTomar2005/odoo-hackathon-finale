import express from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middleware.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import weeklyScheduleRouter from "./routes/weeklySchedule.routes.js";
import contractRouter from "./routes/contract.route.js";
import attendenceRouter from "./routes/attendence.route.js";
import timeoffRouter from "./routes/timeoff.route.js";
import allocationRouter from "./routes/allocation.route.js";
import payslipRouter from "./routes/payslip.route.js";
import payrollDashboardRouter from "./routes/payrolldashboard.route.js";
import payrunRouter from "./routes/payrun.routes.js";
import salaryRuleRouter from "./routes/salaryrule.route.js";
import salaryStructureRouter from "./routes/salarystructure.routes.js";
import employeeRoutes from "./routes/employee.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health",(req,res)=>{
    res.status(200).json({success:true, message:"server is running"});
});

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/weekly-schedule",weeklyScheduleRouter);
app.use("/api/contract",contractRouter);
app.use("/api/attendence",attendenceRouter);
app.use("/api/timeoff",timeoffRouter);
app.use("/api/allocation",allocationRouter);
app.use("/api/payslip",payslipRouter);
app.use("/api/payroll-dashboard",payrollDashboardRouter);
app.use("/api/payrun",payrunRouter);
app.use("/api/salary-rule",salaryRuleRouter);
app.use("/api/salary-structure",salaryStructureRouter);
app.use("/api/employee",employeeRoutes);

app.use(globalErrorHandler);

export default app;