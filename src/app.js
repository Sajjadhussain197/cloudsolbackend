import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dns from "dns"
const app = express();
dns.setServers(['8.8.8.8', '1.1.1.1']);
app.use(cors({
    origin:'*',
    Credential: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from './routes/user.router.js'

app.use("/api/auth/users",userRouter)


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});


export {app }