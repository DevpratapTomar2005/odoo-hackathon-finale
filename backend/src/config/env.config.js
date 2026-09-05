import dotenv from "dotenv";
dotenv.config();

if(!process.env.PORT){
    throw new Error("PORT is not defined");
}

if(!process.env.DATABASE_URL){
    throw new Error("DATABASE_URL is not defined");
}

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined");
}

export const envConfig = {
    PORT : parseInt(process.env.PORT),
    NODE_ENV : process.env.NODE_ENV || "development",
    DATABASE_URL : process.env.DATABASE_URL,
    JWT_SECRET : process.env.JWT_SECRET
}