import {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComment = asyncHandler(async(req, res) => { 
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid videoID")
    }

    try {
        const comment = await Comment.find({video: videoId}).populate('owner', 'username')

        if(!comment) {
            throw new ApiError(404, "comment not found")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, comment, "comment retrieved successfully"))
    } catch (error) {
        console.log("Error retrieving comment", error);
        throw new ApiError(500, "Failed to retrieve comment")
    }
})

const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {userId} = req.body

    if(!isValidObjectId(videoId)) {
        throw new ApiError(402, "Invalid videoID")
    }

    try{

        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(403, "Invalid userID")
        }

        const comment = await Comment.create({                                                                                      
            content: content,
            owner: userId
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
    const {commentId} = req.params
    const { content } = req.body
if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "Invalid commentID")
}

try {
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    comment.content = content
    await comment.save()

    const updatedComment = await Comment.findById(commentId).populate("owner", "username")

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
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

        await comment.remove()

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
