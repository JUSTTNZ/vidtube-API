import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if(!user) {
            throw new ApiError(403, "user not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}
const registerUser = asyncHandler( async (req, res) => {
    const {fullname, email, username, password} = req.body

    //validation
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    const exitingUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(exitingUser) {
        throw new ApiError(409, "User with email or username already exists.")
    }

    console.warn(req.files);
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing.")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)

    // let coverImage = ""
    // if(coverImageLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverImage)
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("uploaded avatar", avatar);
        
    } catch (error) {
        console.log("Error uploading avatar", error);
        throw new ApiError(500, "Failed to upload avatar")
        
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        console.log("uploaded coverImage", coverImage);
        
    } catch (error) {
        console.log("Error uploading coverImage", error);
        throw new ApiError(500, "Failed to upload coverImage")
        
    }

    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
    
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
    
        if(!createdUser) {
            throw new ApiError(500, "Something went wrong while registering user")
        }
    
        return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User registered successfully"))
    } catch (error) {
        console.log("User creation failed");
        
        if(avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "Something went wrong while registering a user and images were deleted")
    }
})

const loginUser = asyncHandler( async (req, res) => {
    // get data from body
    const {email, username, password} = req.body
    console.log(email, password);
    

    //validation
    if(
        [email, username, password].some((field) => typeof field !== 'string' || field.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(409, "User does not exist")
    }

    try {
        console.log("Provided password:", password);
        console.log("Stored hashed password:", user.password);
        const validatePassword = await user.isPasswordCorrect(password);
        console.log("Password validation result:", validatePassword);

        if (!validatePassword) {
            throw new ApiError(401, "Invalid credentials");
        }
    } catch (error) {
        throw new ApiError(500, "Error validating password", error);
    }

    try {
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

        if(!loggedInUser) {
            throw new ApiError(404, "Cant login user")
        }

        const options = {
            httpOnly:  true,
            secure: process.env.NODE_ENV === "production",
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200, 
            {user: loggedInUser, accessToken, refreshToken},
            "User logged in successfully"
        ))

    } catch (error) {
        console.log("User logged in failed", error);
        
    }
})

const logOutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        // need to come back here after middleware
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly:  true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required")
    }

    try {
       const decodedToken = jwt.verify(
        incomingRefreshToken, 
        process.env.REFRESH_TOKEN_SECRET
       )
       const user = await User.findById(decodedToken?._id)
       if(!user) {
        throw new ApiError(401, "Invalid refresh token")
       }
       if(incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401,"Invalid refresh token")
       }

       const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
       }

       const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)

       return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json( 
            new ApiResponse(
                200, 
                {accessToken, 
                    refreshToken: newRefreshToken},
                "Access token refreshed successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while refreshing access token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid) {
        throw new ApiError(401, "Old password is incorrect")
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async(res, req) => {
    return res.status(200).json( new ApiResponse(200, req.user, "Current user details"))
})

const updateAccountDetails = asyncHandler( async(res, req) => {
    const {fullname, email} = req.body
    
    // if(!fullname || !email) {
    //     throw new ApiError(400, "Fullname and email is required")
    // }

    if(!fullname) {
        throw new ApiError(400, "Fullname is required")
    }

    if(!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async(res, req) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(500, "Something went wrong while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: avatar.url
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler( async(res, req) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(500, "something went wrong while uploading cover image")
    }

    const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: coverImage.url,
        },
        {new: true}
    ).select(" -password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim) {
        throw new ApiError(400, "username is required")
    }
    console.log(channel);
    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscribedTo: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers, subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                 // project only the necessary data
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ],
    )

    if(!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }
    

    return res.status(200).json(new ApiResponse(
        200,
        channel[0],
        "Channel profile successfully"
    ))
    
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    if (!user.length) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(
        200, 
        user[0]?.watchHistory, 
        "Watch history retrieved successfully"));
})

export { 
    registerUser,
    loginUser, 
    getWatchHistory,
    refreshAccessToken, 
    logOutUser, 
    changeCurrentPassword,
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getUserChannelProfile,
    getCurrentUser,
}