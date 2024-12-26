import {isValidObjectId} from "mongoose"
import {Tweet} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async(req, res) => {
    const { content, userId } = req.body

    if(!content) {
        throw new ApiError(402, "content field required")
    }

    try {
        const user = await User.findById(userId)
    
        if(!user) {
            throw new ApiError(401, "user not found")
        }
    
        const tweetContent = await Tweet.create({
            content,
            userId: user._id,
            owner: user._id
        })

        const createdTweet = await Tweet.findById(tweetContent._id).populate('owner', 'username')
 
        if(!createdTweet) {
            throw new ApiError(404, "something went wrong while creating tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(201, createdTweet, "Tweet uploaded successfully"))
    } catch (error) {
        throw new ApiError(401, "Error uploading tweet")
    }
})

const getUserTweets = asyncHandler(async(req, res) => {
    const {userId} = req.params

    try {
        const user = await User.findById(userId)
    
        if(!user) {
            throw new ApiError(404, "user not found, please input a valid userID")
        }
    
        const userTweets = await Tweet.find({ userId })

        if(userTweets.length === 0) {
            throw new ApiError(404, "user does not have any tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(201, userTweets, "user tweets loaded successfully"))
    } catch (error) {
        throw new ApiError(402, "Process failed")
    }
})

const updateTweet =  asyncHandler(async(req, res) => {
    const {userId} = req.params

    if(!userId) {
        throw new ApiError(404, "userId is invalid")
    }

    const user
})

export {
    createTweet,
    getUserTweets,
}
