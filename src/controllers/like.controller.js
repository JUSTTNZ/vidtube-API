import {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    try {
        const {userId} = req.body

        if(!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }

        let like = await Like.findOne({video: videoId, likedBy: userId})
        
        if(like) {
            let video = await Video.findByIdAndUpdate(videoId, {
                $inc: {likes: -1}
            }, { new: true })
            console.log("video unlike successfully");
            
            if(!video) {
                throw new ApiError(404, "Video not found")
            }
        }

        like = new Like({
            video: videoId,
            likedBy: userId
        })

        await like.save()

        let video = await Video.findByIdAndUpdate(videoId, {
            $inc: {likes: 1}
        }, { new: true })

        if(!video) {
            throw new ApiError(404, "Video not found")
        }

        const populatedLike = await Like.findById(like._id).populate('likedBy', 'username')

        return res
            .status(200)
            .json(new ApiResponse(200, { like: populatedLike, totalLikes: video.likes }, "Video liked successfully"))
    } catch (error) {
        return res.status(500).json(new ApiError(500, "An error occurred while liking the video"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}