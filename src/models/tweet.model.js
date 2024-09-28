import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
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
}, { timestamps: true });


export const Tweet = mongoose.model("Tweet", tweetSchema);
