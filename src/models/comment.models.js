import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
const commentSchema = new Schema (
    {
        // either of video, comment or tweet will be assigned others are null
        
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true } 
)

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)