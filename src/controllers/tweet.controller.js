import {isValidObjectId} from "mongoose"
import {Tweet} from "../models/tweet.models.js"
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
            owner: userId,
        })

        const createdTweet = await Tweet.findById(tweetContent._id).populate('owner', 'username')
 
        if(!createdTweet) {
            throw new ApiError(404, "something went wrong while creating tweet")
        }

        // await createdTweet.save()

        return res
            .status(200)
            .json(new ApiResponse(201, createdTweet, "Tweet uploaded successfully"))
    } catch (error) {
        throw new ApiError(401, "Error uploading tweet")
    }
})

const getUserTweets = asyncHandler(async(req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(404, "Invalid userID")
    }

    try {
        const user = await User.findById(userId)
    
        if(!user) {
            throw new ApiError(404, "user not found, please input a valid userID")
        }
    
        const userTweets = await Tweet.find({owner: userId})
        console.log(userTweets);

        if(userTweets.length === 0) {
            throw new ApiError(404, "user does not have any tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(201, userTweets, "user tweets loaded successfully"))
    } catch (error) {
        console.log(error);
        
        throw new ApiError(402, "Process failed")
    }
})

const updateTweet =  asyncHandler(async(req, res) => {
    const {tweetId} = req.params


    if(!tweetId) {
        throw new ApiError(404, "tweetId is invalid")
    }

    const { content } = req.body

    if(!content === "") {
        throw new ApiError(401, "content field required")
    }

    try {
        const oldTweetArray = []
        const oldTweet = await Tweet.findById(tweetId)

        oldTweetArray.push(oldTweet)
        console.log(oldTweetArray);
        

        if(!oldTweet) {
            throw new ApiError(400, "Old tweet not found")
        }
        const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, 
            {
                $set: {
                    content:content
                }
            },
            {new: true}
        )

        if(!updatedTweet) {
            throw new ApiError(404, "Error updating old tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {oldTweet, updatedTweet}, "Tweet updated successfully"))
    } catch (error) {
        console.log("Error occurred in the updating process", error);
        throw new ApiError(400, "Error occurred updating tweet")
    }
})

const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Deleting tweet requires tweetId")
    }

    try {
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

        if(!deletedTweet) {
            throw new ApiError(401, "Error deleting tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(201, {}, "Tweet deleted successfully"))

    } catch (error) {
        console.log("Cant delete tweet",error);
        throw new ApiError(400, "Error occurred")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
