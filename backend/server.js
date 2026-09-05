import app from "./src/app.js";
import {envConfig} from "./src/config/env.config.js";
import { connectDB } from "./src/db/db.js";

connectDB();

app.listen(envConfig.PORT, () => {
    console.log(`Server is running on port ${envConfig.PORT}`);
});