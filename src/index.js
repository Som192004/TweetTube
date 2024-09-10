import dotenv from "dotenv"
import mongoose from "mongoose";
import  express  from "express";
import connectDB from "./db/index.js";


dotenv.config({
    path : './env'
})
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
//     try{
//         await mongoose.connect(`${process.env.MONGO_URI}`) ;
//         app.on('err' , (err) => {
//             console.log("Error : " , err) ;
//             throw err ; 
//         })

//         app.listen(process.env.PORT , () => {
//             console.log("App is listening on port " , process.env.PORT);
//         })
//     }catch(err){
//         console.log("Error : " , err) ;
//         throw err ;
//     }
// })()

