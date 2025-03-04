import {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import {Video} from "../models/video.models.js";
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComment = asyncHandler(async(req, res) => { 
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid videoID")
    }

    try {
        const video = await Video.findById(videoId).populate('owner', 'username');
        
        if (!video) {
            throw new ApiError(404, "Video not found");
       }
        const comment = await Comment.find({video: videoId}).populate('owner', 'username')

        if(!comment) {
            throw new ApiError(404, "comment not found")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {
            videoOwner: video.owner.username,
            comments: comments
        }, "comment retrieved successfully"))
    } catch (error) {
        console.log("Error retrieving comment", error);
        throw new ApiError(500, "Failed to retrieve comment")
    }
})

const addComment = asyncHandler(async(req, res) => {
    // const {} = req.params
    const {content, userId, videoId} = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(402, "Invalid videoID");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(403, "Invalid userID");
    }

    if (!content) {
        throw new ApiError(400, "Content field is required");
    }

    try{

        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(403, "Invalid userID")
        }

        const video = await Video.findById(videoId)

        if(!video) {
            throw new ApiError(403, "Video not found")
        }

        const comment = await Comment.create({                                                                                      
            content: content,
            owner: userId,
            video: videoId,
            videoTitle: video.title,
            videoOwner: video.owner.username
        })

        if(!comment) {
            throw new ApiError(402, "Error, cant create comment on this video")
        }

        const createdComment =  await Comment.findById(comment._id).populate("owner", "username")

        if(!createdComment) {
            throw new ApiError(400, "Cant create comment")
        }

        return res
            .status(200)
            .json(new ApiResponse(201, createdComment, "comment successfully created"))
    } catch(error) {
        console.log("Error creating comment", error);
        throw new ApiError(401, "An error occurred")
    }
})

const updateComment = asyncHandler(async(req, res) => {
    // const {} = req.params
    const { userId, content, commentId, videoId } = req.body
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid commentID")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid videoID")
    }

    if (content === "") {
        throw new ApiError(404, "Content field is required")
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "Invalid videoID")
    }

    try {

        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(403, "Invalid userID")
        }

        const video = await Video.findById(videoId)

        if(!video) {
            throw new ApiError(403, "Video not found")
        }

        const oldComment = await Comment.findById(commentId)

        if(!oldComment) {
            throw new ApiError(400, "Old Comment not found")
        }
        const oldCommentArray = []
        const CommentArray = oldComment.oldComments.push({
            content: oldComment.content,
            updatedAt: new Date()
        })
        oldCommentArray.push(CommentArray)  
        await oldComment.save();
        const updatedComment = await Comment.findByIdAndUpdate(commentId, 
                {
                    $set: {
                        content:content
                    }
                },
                {new: true}
            )
    
            if(!updatedComment) {
                throw new ApiError(404, "Error updating old comment")
            }
    

        const updatedComments = await Comment.findById(commentId).populate([{ path: 'owner', select: 'username' }, { path: 'video', select: 'title' }])

        return res
            .status(200)
            .json(new ApiResponse(200, {oldComment,updatedComments}, "Comment updated successfully"))
    } catch (error) {
        console.log("Error updating comment", error)
        throw new ApiError(500, "Failed to update comment")
    }
})

const deleteComment = asyncHandler(async(req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid commentID")
    }

    try {
        const comment = await Comment.findById(commentId)

        if (!comment) {
            throw new ApiError(404, "Comment not found")
        }

        

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Comment deleted successfully"))
    } catch (error) {
        console.log("Error deleting comment", error)
        throw new ApiError(500, "Failed to delete comment")
    }
})

export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}
