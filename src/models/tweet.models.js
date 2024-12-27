import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema (
    {
        // either of video, comment or tweet will be assigned others are null
        
        content: {
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        oldTweets: [
            {
                content: String,
                updatedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
    },
    { timestamps: true } 
)

export const Tweet = mongoose.model("Tweet", tweetSchema)