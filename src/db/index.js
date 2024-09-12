import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        console.log(process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\n mongodb connected `);
        // console.log(connectionInstance);
    }catch(err){
        
        console.log("MongoDB Connection Error . . . ") ;
        console.log(err);
        
    }
}

export default connectDB ;