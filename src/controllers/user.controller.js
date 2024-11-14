
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"

const generateAccessTokenRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        
        console.log(user.refreshToken,"usertoken")
        return { accessToken, refreshToken }




    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")

    }
}



const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;
    
    if (
        [fullName, email, password, username].some((field) => field?.trim() === '')
    ) {
        throw new ApiError(400, "All the fieleds are requied")
    }

    const existinguser = await User.findOne({ $or: [{ username }, { email }] });
    if (existinguser) {
        throw new ApiError(409, "User with this email or username already exists")

    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    res.status(201).json(
        new ApiResponse(200, createdUser, "User created Successfully!!!!")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { username, email, password } = req.body
        console.log(username, email, password,"login")
        if (!username && !email) {
            throw new ApiError(400, "Username or Email is required")
        }
        const user = await User.findOne({ email })
        if (!user) {
            throw new ApiError(404, "User doesnt exist")

        }
        console.log(user,"user")
        const ispasswordValid = await user.isPasswordCorrect(password)
        if (!ispasswordValid) {
            throw new ApiError(401, "the password is incorrect")

        }

        const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(user._id)
            console.log(accessToken, refreshToken,"accessToken, refreshToken")
        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"

        )
            console.log(loggedInUser,"loggedInUser")
        const options = {
            httpOnly: true,
            secure: true
        }
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { user: loggedInUser, accessToken, refreshToken },
                    "User logged In Successfully"
                )
            )


    } catch (error) {
        throw new ApiError(500, "User login failed")

    }

})



const loggedOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true

        }

    )
    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out")
        )


})

const refreshAcessToken = asyncHandler(async (req, res) => {
    try {
        const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incommingRefreshToken) {
            throw new ApiError(401, "Unauthorized access");
        }

        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Inavlid refresh token")
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Uer token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newrefreshToken } = await generateAccessTokenRefreshToken(user._id)

        return res.status(200)
            .cookie("AccessToken", accessToken, options)
            .cookie("RefreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, newrefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")

    }
})
const changePassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        
        const user = await User.findById(req.user?._id)

        const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
        if (!isPasswordCorrect) {
            throw new ApiError(401, "Password is not correct")

        }

        user.password = newPassword;
        user.save({ validateBeforeSave: false })
        return res.status(200)
            .json(new ApiResponse(200, {}, "Password changed Successfully"))



    } catch (error) {

    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(200, req.user, " current User fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    
    try {
        const { email, fullName } = req.body;
        
        
        if (!email || !fullName) {
            throw new ApiError(400, "All fields are required")

        }

        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    fullName,
                    email: email
                }
            },
            { new: true }
        ).select("-password")
        return res.status(200)
            .json(new ApiResponse(200, user, "account details updated successfully"))

    } catch (error) {

    }

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar File is missing")
        }

        const avatar = await uploadCloudinary(avatarLocalPath);
        if (!avatar.url) {
            throw new ApiError(400, "Error while uploading Cloudinary")
        }


        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true }
        ).select("-password")

        return res.status(200)
            .json(new ApiResponse(200, user, "User avatar image is updated successfully"))

    } catch (error) {

    }
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const coverImageLocalPath = req.file?.path;
        if (!coverImageLocalPath) {
            throw new ApiError(400, "coverImage  File is missing")
        }

        const coverImage = await uploadCloudinary(coverImageLocalPath);
        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading Cloudinary")
        }


        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            { new: true }
        ).select("-password")

        return res.status(200)
            .json(new ApiResponse(200, user, "User cover image is updated successfully"))

    } catch (error) {

    }
})
const deleteUser = asyncHandler(async (req, res) => {
    
    try {
        const user = await User.findByIdAndDelete(req.params.id)
       
        if(!user){
            throw new ApiError(404, "User not found")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "User deleted successfully"))    

    } catch (error) {
    console.log(error)
        
    }
})

const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find().select("-password -refreshToken");
        return res.status(200).json(new ApiResponse(200, users, "All users fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch users");
    }
});

const getUserById = asyncHandler(async (req, res) => {
    try {
        
        const user = await User.findById(req.params.id)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch user");
    }
});

export {
    registerUser,
    loginUser,
    loggedOutUser,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    refreshAcessToken,
    deleteUser,
    getAllUsers,
    getUserById
}

