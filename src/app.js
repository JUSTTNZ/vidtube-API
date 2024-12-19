import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true 
    })
)

//common middleware
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// import routes
import healthCheckRouter from "./routes/healthCheckRoute.js"
import userRouter from "./routes/user.route.js"
import { errorHandler } from "./middlewares/error.middlewares.js";

app.use("/api/v1/healthCheck", healthCheckRouter)
app.use("/api/v1/users", userRouter)
app.use(errorHandler)
export { app }