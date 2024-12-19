import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
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
            await deleteFromCloudinary(avatar.public_Id)
        }
        if(coverImage) {
            await deleteFromCloudinary(coverImage.public_Id)
        }

        throw new ApiError(500, "Something went wrong while registering a user and images were deleted")
    }
})

export { registerUser }