import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideo = asyncHandler(async( req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortBy, userId} = req.query

    

})
const publishAVideo = asyncHandler(async( req, res) => {
    const {title, description} = req.body

    const videoLocalPath = req.file?.video[0]?.path

    let videoFiles;

    try {
        videoFiles = await uploadOnCloudinary(videoLocalPath)
        console.log("Video uploaded on cloudinary");

        const video = await Video.create({
            title,
            description
        })
    
        const createdVideo = await Video.findById(video._id)
    
        if(!createdVideo) {
            throw new ApiError(500, "something went wrong while uploading the video")
        }
    
        return res
            .status(201)
            .json(new ApiResponse(200, createdVideo, "video uploaded successfully"))
        
    } catch (error) {
        console.log("Error uploading video", error);
        
        throw new ApiError(500, "Failed to upload video");
    }
})

const getVideoById = asyncHandler(async( req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "video does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video retrieved successfully"))
})

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    const videoLocalPath = req.file?.path
    
    if(!videoLocalPath){
        throw new ApiError(500,"video file is required")
    }

    let videoFile;

    try {
        videoFile = await uploadOnCloudinary(videoLocalPath)

        if(!videoFile.url) {
            throw new ApiError(500, "something went wrong while uploading video")
        }

        const newVideo = await Video.findByIdAndUpdate(videoId,
            {
                $set: videoFile.url,
            },
            {new: true}
        )

        if(!newVideo) {
            throw new ApiError(401, "video not found")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, newVideo, "Video updated successfully"))
    } catch (error) {
        throw new ApiError(500, "Failed to upload video")
    }
})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    const videoPath = req.file?.path

    if(!videoPath) {
        throw new ApiError(500, "video path required")
    }

    let videoFile
    try {

        videoFile = await deleteFromCloudinary(videoPath)

       if(!videoFile) {
            throw new ApiError(200, "Error deleting video")
       }

       const video = await Video.findByIdAndDelete(videoId)

       if(!video) {
            throw new ApiError(500, "Couldn't delete video")
       }

       return res
        .status(200)
        .json(200, {}, "Video deleted successfully")
    } catch (error) {
        throw new ApiError(500, "Video deleting process failed")
    }
})



export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo
}