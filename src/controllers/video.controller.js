import {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

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
    const { title, description, duration, views, likes, userId, owner } = req.body

    const videoLocalPath = req.files.videoFile?.[0]?.path
    const thumbNailLocalPath = req.files.thumbnail?.[0]?.path
    
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

        

        if(!thumbNailLocalPath) {
            throw new ApiError(404, "thumbnail file does not exist")
        }

    
        let thumbnail
        try {
            thumbnail = await uploadOnCloudinary(thumbNailLocalPath)
            console.log("thumbnail uploaded on cloudinary", thumbnail);
        }catch{
            throw new ApiError(404, "couldn't upload thumbnail on cloudinary")
        }
    
            if (!thumbnail || !thumbnail.url) {
                throw new ApiError(500, "Invalid response from Cloudinary");
            }

        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        // Convert duration from "HH:MM" format to total minutes
        const [hours, minutes] = duration.split(':').map(Number);
        const totalDuration = (hours * 60) + minutes;

        try{
        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            userId: user._id,
            owner: user._id,
            views,
            duration: totalDuration,
            likes,
        })
    

        const createdVideo = await Video.findById(video._id).populate('owner', 'username')
    
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

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const videoFileUrl = video.videoFile;
    const thumbnailUrl = video.thumbnail;

    try {
        if (videoFileUrl) {
            await deleteFromCloudinary(videoFileUrl);
            console.log("Video deleted from Cloudinary:", videoFileUrl);
        } else {
            console.log("Error deleting video: videoFileUrl is not defined");
        }

        if (thumbnailUrl) {
            await deleteFromCloudinary(thumbnailUrl);
            console.log("Thumbnail deleted from Cloudinary:", thumbnailUrl);
        } else {
            console.log("Error deleting thumbnail: thumbnailUrl is not defined");
        }

        await Video.findByIdAndDelete(videoId);

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video deleted successfully"));
    } catch (error) {
        console.error("Error deleting video:", error);
        throw new ApiError(500, "Failed to delete video");
    }
});

const togglePublishStatus = asyncHandler(async(req, res) =>  {
    const { videoId } = req.params
    
    try {
        const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "video not found")
    }

    video.isPublished = !video.isPublished
    await video.save();

    return res 
        .status(200)
        .json( new ApiResponse(200,video, "video publish status updated successfully"))

    } catch (error) {
        throw new ApiError(400, "couldn't update publish status", error)
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