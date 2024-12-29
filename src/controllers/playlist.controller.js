import {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user._id;
    try {
        
        if (!name) {
            throw new ApiError(400, "Playlist name is required");
        }
    
        const playlist = await Playlist.create({
            name,
            description,
            owner: userId,
            videos: [],
        });
    
        return res
            .status(201)
            .json(new ApiResponse(201, playlist, "Playlist created successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    try {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }

        const playlists = await Playlist.find({ owner: userId });

        return res
            .status(200)
            .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }

        const playlist = await Playlist.findById(playlistId).populate("videos", "title, description");

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    try {
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid playlist or video ID");
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video already exists in the playlist");
        }

        playlist.videos.push(videoId);
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    try {
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid playlist or video ID");
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }

        const playlist = await Playlist.findByIdAndDelete(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                },
            },
            { new: true, runValidators: true }
        );

        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}