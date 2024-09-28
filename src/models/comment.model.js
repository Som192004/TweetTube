import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,  
    },

    content: {
        type: String,
        required: [true, "Content is required"],  // Content is mandatory
        trim: true,                               
        validate: {
            validator: function(value) {
                return value.trim().length > 0;   // Ensure content isn't just spaces
            },
            message: "Content cannot be empty or just whitespace",
        },
    },
    video : {
        type : Schema.Types.ObjectId ,
        ref : "Video" ,
        required : true ,
    }

},{timestamps : true})

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema);