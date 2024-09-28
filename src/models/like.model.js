import mongoose, { Schema } from "mongoose";
//ToDo : Understand the relation between like and comment . . .

const likeSchema = new Schema({
    comment : {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        required: true,  
    } ,
    video : {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true,  
    } ,
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,  
    },
    tweet : {
        type: Schema.Types.ObjectId,
        ref: "Tweet",
        required: true,  
    }
    
},{timestamps : true})

export const Like = mongoose.model("Like", likeSchema);