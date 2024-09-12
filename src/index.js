import dotenv from "dotenv"
import mongoose from "mongoose";
import  express  from "express";
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config() ;
connectDB().then(() => {
    app.on('err' , (err) => {
                    console.log("Error : " , err) ;
                    throw err ; 
                })

    app.listen(process.env.PORT || 8000, () => {
        console.log("app is listening at the port :" , process.env.PORT) ;
    });
})
.catch((err) => {
    console.log("MONGO DB connection Failed . . . ") ;
})

//This is the first approach for connecting to the dataBase  . . . 
// (async () => {
//     try {
//         // Establishing the database connection
//         await mongoose.connect(process.env.MONGODB_URI);
//         console.log("MongoDB connected successfully");

//         // Handling server error events
//         app.on('error', (err) => {
//             console.error("Server Error:", err);
//             // Optionally, you can handle the error gracefully here without throwing
//         });

//         // Start the server
//         const port = process.env.PORT || 8000; // Fallback to 8000 if PORT is undefined
//         app.listen(port, () => {
//             console.log(`App is listening on port ${port}`);
//         });

//     } catch (err) {
//         console.error("Error:", err);
//         process.exit(1); // Exit the process if there's a critical failure
//     }
// })();


