import {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import {Tweet} from "../models/tweet.models.js"
import { Comment } from "../models/comment.models.js"
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
            await Like.findByIdAndDelete(like._id);
            let video = await Video.findByIdAndUpdate(videoId, {
                $inc: {likes: -1}
            }, { new: true })
            console.log("video unlike successfully", like)

            return res
                .status(200)
                .json(new ApiResponse(200, {totalLikes: video.likes}, "video unliked successfully"))
        } else {
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
        }
    } catch (error) {
        console.log(error);
        throw new ApiError(400,"An error occurred while liking the video")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "commentID is invalid");
    }

    try {
        const { userId } = req.body;
    
        let like = await Like.findOne({ comment: commentId, likedBy: userId });

        if (like) {
            
            await Like.findByIdAndDelete(like._id);

            let comment = await Comment.findByIdAndUpdate(
                commentId,
                { $inc: { likes: -1 } },
                { new: true }
            );

            if (!comment) {
                throw new ApiError(404, "Comment not found");
            }

            console.log("Comment unliked successfully", like);

            return res.status(200).json(new ApiResponse(200, { totalLikes: comment.likes }, "Comment unliked successfully"));
        } else {

            like = new Like({
                comment: commentId,
                likedBy: userId
            });

            await like.save();

            let comment = await Comment.findByIdAndUpdate(
                commentId,
                { $inc: { likes: 1 } },
                { new: true }
            );

            if (!comment) {
                throw new ApiError(404, "Comment not found");
            }

            const populatedLike = await Like.findById(like._id).populate('likedBy', 'username');

            return res.status(200).json(new ApiResponse(200, { like: populatedLike, totalLikes: comment.likes }, "Comment liked successfully"));
        }
    } catch (error) {
        console.log(error);
        throw new ApiError(400, "An error occurred while liking the comment");
    }
});


const toggleTweetLike = asyncHandler(async (req, res) => {

    //TODO: toggle like on tweet
    const { tweetId } = req.params;
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "tweetID is invalid");
    }

    try {
        const { userId } = req.body;
        
        let like = await Like.findOne({ tweet: tweetId, likedBy: userId });

        if (like) {
            await Like.findByIdAndDelete(like._id);

            let tweet = await Tweet.findByIdAndUpdate(
                tweetId,
                { $inc: { likes: -1 } },
                { new: true }
            );

            if (!tweet) {
                throw new ApiError(404, "Tweet not found");
            }

            console.log("Tweet unliked successfully", like);

            return res.status(200).json(new ApiResponse(200, { totalLikes: tweet.likes }, "Tweet unliked successfully"));
        } else {
            like = new Like({
                tweet: tweetId,
                likedBy: userId
            });

            await like.save();

            let tweet = await Tweet.findByIdAndUpdate(
                tweetId,
                { $inc: { likes: 1 } },
                { new: true }
            );

            if (!tweet) {
                throw new ApiError(404, "Tweet not found");
            }

            const populatedLike = await Like.findById(like._id).populate('likedBy', 'username');

            return res.status(200).json(new ApiResponse(200, { like: populatedLike, totalLikes: tweet.likes }, "Tweet liked successfully"));
        }
    } catch (error) {
        console.log(error);
        throw new ApiError(400, "An error occurred while liking the tweet");
    }
});



const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "userID is invalid")
    }

    try {
        // const {videoId} = req.body
        let likedVideos = await Like.find({likedBy: userId, video: { $ne: null }}).populate([{path: 'likedBy', select: 'username'}, {path: 'video', select: 'title'}])

        if(likedVideos === 0) {
            throw new ApiError(400, "user haven't liked any video")
        }
        
        return res
            .status(200)
            .json(new ApiResponse(201, likedVideos, "list of liked videos successfully loaded"))
    } catch (error) {
        console.log(error);
        throw new ApiError(400, "cant get user list of liked video")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}