import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        const totalVideos = await Video.countDocuments({ channel: channelId });
        const totalViews = await Video.aggregate([
            { 
                $match: { 
                    channel: mongoose.Types.ObjectId(channelId) 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    totalViews: { $sum: "$views" } 
                } 
            }
        ]);
        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
        const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ channel: channelId }).select("_id") } });

        const stats = {
            totalVideos,
            totalViews: totalViews[0]?.totalViews || 0,
            totalSubscribers,
            totalLikes
        };

        return res
            .status(200)
            .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
    } catch (error) {
        throw new ApiError(500, `Error fetching channel stats: ${error.message}`);
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        const videos = await Video.find({ channel: channelId }).select("title description views likes createdAt");

        if (!videos.length) {
            throw new ApiError(404, "No videos found for this channel");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
    } catch (error) {
        throw new ApiError(500, `Error fetching channel videos: ${error.message}`);
    }
});

export {
    getChannelStats,
    getChannelVideos
};
