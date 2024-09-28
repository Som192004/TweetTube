import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/CloudinaryUtility.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import fs from "fs" 


const registerUser = asyncHandler(async (req,res) => {
    //steps : 
    //get the details from the frontEnd
    //validation - not empty 
    //check whether the user is already present or not :username , email 
    //upload the images to the cloudinary 
    //finally register the user 
    //remove password and refresh token field from response
    //check the response whether the user is created or not . . 

    const {username , fullname , password , email} = req.body ;
    
    if([fullname , email , username , password].some((field) => field?.trim === "")){
        throw new ApiError(400 , "All Fields are required ")
    }

    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(user){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path ; 
    const coverLocalPath = req.files?.coverImage[0]?.path ;

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImg = await uploadOnCloudinary(coverLocalPath)

    if(!avatar){
        throw new ApiError(400 , "Avatar is not uploaded successfully ")
    }
    
    const newUser = await User.create({
        fullname,
        email, 
        avatar ,
        coverImg : coverImg || "" , 
        password ,
        username : username.toLowerCase()
    })
    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500 , "User is not registered successfully")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully ! ")
    )
})

const login = asyncHandler (async (req,res) => {
    //Steps while login the user . . .
    //Get all the details from the frontEnd 
    //Check whether any field is empty or not 
    //after that check whether the user is already logged in or not by checking the token
    //if user is not having the access token then after than do the login and check whether the user is having an account or not 
    //if user is having the access token then check the expiry of the access token and also if the access token is expired then check the refresh token 

    const {email , password} = req.body

    if(!email){
        throw new ApiError(400 , "Email is required")
    }
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404 , "User not Found")
    }

    const isPassValid = await user.isPasswordCorrect(password)

    if(!isPassValid){
        throw new ApiError(401 , "Password is not valid")
    }

    let accessToken = "" ;
    let refreshToken = "" ;

    try{
        accessToken = user.       generateAccessToken()

        refreshToken = user.generateRefToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false })

    }catch(error){
        throw new ApiError(500 , "Something went wrong while generating refresh and access token")
    }

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true ,
        secure : true 
    }

    //cookies are not set in the mobile application at the user end that's why here we are sending the accesstoken and refreshtoken in the response to the user 
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken).json(
        new ApiResponse(200 , 
            { user : loggedInUser , accessToken , refreshToken

            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id , 
        {
            $set: {
                refreshToken: null  // Use null instead of undefined to clear
            },
        },
            {
                new : true 
            }
        
    )

    const options = {
        httpOnly : true ,
        secure : true , 
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken",options).json(new ApiResponse(200 , {} , "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

    if(!incomingRefreshToken){
        throw new ApiError(401 , "UnAuthorized Request")
    }

    try{
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401 , "InValid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh token is expired")
    }

    const options = {
        httpOnly : true , 
        secure : true 
    }

    const accessToken = await generateAccessToken(user._id)

    const newrefreshToken = await generateRefToken(user._id)

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200 ,
            {accessToken , refreshToken : newrefreshToken} ,
            "Access Token refreshed"
        )
    )
    }
    catch(error){
        throw new ApiError(401 , error?.message || "Invalid refesh token")
    }

    
})

const updateUserPassword = asyncHandler(async (req,res) => {
    const {oldPassword , newPassword} = req.body

    const user = User.findById(req.user?._id)

    const isPasswordCorrect = await (user.isPasswordCorrect(oldPassword))

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old password")
    }

    user.password = newPassword 
    await user.save({validateBeforeSave : false})

    return res.status(200).json(new ApiResponse(200 , {} , "Password changed Successfully "))

})

const getUserInfo = asyncHandler(async (req,res) => {
    //This line may give some error check while testing the api . . .
    return res.status(200).json(new ApiResponse(200 , {user : req.user} , "User Info fetched Successfully "))

})

const updateAccountInfo = asyncHandler(async(req,res) => {
    const {fullname , email} = req.body 

    if(!fullname || !email){
        throw new ApiError(400 , "All Fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id , 
        {
            $set : {
                fullname, email 
            }
        } ,
        {new : true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200 , user , "Account details updated successfully ") )

})  

const updateAvatar = asyncHandler(async (req,res) => {
    const avatarPath = req.file?.path

    if(!avatarPath){
        throw new ApiError(400 , "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarPath)

    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading the file on the cloudinary")
    }

    fs.unlink(avatarPath, (err) => {
        if (err) {
            console.error(`Failed to delete uploaded avatar: ${err.message}`);
        } else {
            console.log('Uploaded avatar deleted successfully from server');
        }
    });

    const user = await User.findByIdAndUpdate(req.user?._id ,
    {
        $set : {
            avatar : avatar.url
        }
    } ,
    {new : true}
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200 , user , "Avatar Image is updated Successfully")
    )
})

const updateCoverImg = asyncHandler(async (req,res) => {
    const coverImgPath = req.file?.path

    if(!coverImgPath){
        throw new ApiError(400 , "Cover Img is missing")
    }

    const coverImg = await uploadOnCloudinary(coverImgPath)

    if(!coverImg.url){
        throw new ApiError(400 , "Error while uploading coverImg on cloudinary")
    }
    fs.unlink(coverImgPath, (err) => {
        if (err) {
            console.error(`Failed to delete uploaded avatar: ${err.message}`);
        } else {
            console.log('Uploaded avatar deleted successfully from server');
        }
    });


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImg : coverImg.url
            }
        } ,
        {new : true }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200 , user , "Cover Image is updated Successfully")
    )

})

const getUserChannelInfo = asyncHandler(async(req , res) => {
    const {username} = req.params ; 

    if(!username?.trim()){
        throw new ApiError(400 , "username is not given ") ;
    }
    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase() 
            },
        },       
        {
            $lookup : {
                from : "subscriptions" ,
                localField : "_id" ,
                foreignField : "channel" ,
                as : "subscribers" ,
            }
        } ,
        {
            $lookup : {
                from : "subcriptions" ,
                localField : "_id" ,
                foreignField : "subscriber" ,
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscibedTo"
                },
                isSubscribedTo : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , "$subscribers.subscriber"]
                        },
                        then : true ,
                        else : false 
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1 ,
                username : 1 , 
                subscribersCount : 1 ,
                channelsSubscribedToCount : 1 ,
                isSubscribedTo : 1 ,
                avatar : 1 ,
                coverImg : 1 ,
                email : 1 , 
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404 , "channel does not exist") ;
    }

    return res.status(200).json(
        new ApiResponse(200 , channel[0] , "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory" ,
                foreignField : "_id" ,
                as : "watchHistory" ,
                pipeline : [
                    {
                        $lookup : {
                            from : "users" ,
                            localField : "owner" ,
                            foreignField : "_id" ,
                            as : "owner"  ,
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1 ,
                                        username : 1 ,
                                        avatar : 1 , 
                                    }
                                }
                            ]
                        } ,
                    } ,
                    {
                        $addFields : {
                            owner : {
                                $first : "owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200 , user[0].watchHistory , "Watch History fetched Successfully")
    )
})


export {registerUser , login , logoutUser ,refreshAccessToken , updateUserPassword , getUserInfo , updateAccountInfo ,updateAvatar ,updateCoverImg , getUserChannelInfo,
getWatchHistory}  