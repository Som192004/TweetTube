import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema({
    name: {
        type: String,
        required: [true, "Playlist name is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
    },
    videos: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
        default: [],   
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,  
    },
}, 
{ timestamps: true });



// Virtual to count the number of videos in a playlist
// playListSchema.virtual('videoCount').get(function() {
//     return this.videos.length;
// });

export const PlayList = mongoose.model("PlayList", playListSchema);
