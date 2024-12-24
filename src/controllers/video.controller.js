import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async( req, res) => {
    const { page = 1, limit = 10, query, sortBy= 'asc', sortType= 'title', userId } = req.query

    const filter = {}

    try {
        if (query) {
            filter.title = { $regex: query, $options: 'i' }
        }
        if (userId) {
            filter.userId = userId
        }
    
        const sortOptions = { [sortType] : sortBy === "desc" ? -1 : 1}
        
    
        const videos = await Video.find(filter)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(Number(limit))
    
        const totalVideos = await Video.countDocuments(filter)
    
        return res
            .status(200)
            .json(new ApiResponse(200, { videos, totalVideos }, "videos retrieved successfully"))
    } catch (error) {
        throw new ApiError(500, "failed to get videos")
    }
    
})

const publishAVideo = asyncHandler(async( req, res) => {
    const { title, description, userId } = req.body

    const videoLocalPath = req.files.videoFile?.[0]?.path

    if(!videoLocalPath) {
        throw new ApiError(404, "video file does not exist")
    }

     let videoFile
    try {
        videoFile = await uploadOnCloudinary(videoLocalPath)
        console.log("Video uploaded on cloudinary", videoFile);
        }catch{
            throw new ApiError(404, "couldn't upload video on cloudinary")
        }

        if (!videoFile || !videoFile.url) {
            throw new ApiError(500, "Invalid response from Cloudinary");
        }

        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        try{
        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            userId: user._id
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

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

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

const togglePublishStatus = asyncHandler(async(req, res) =>  {
    const { videoId } = req.params

    try {
        const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "video not found")
    }

    video.isPublished = !video.isPublished

    return res 
        .status(200)
        .json( new ApiResponse(200,video, "video publish status updated successfully"))

    } catch (error) {
        throw new ApiError(400, "couldn't update publish status")
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}