import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/CloudinaryUtility.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

    const user = User.findOne({
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

export {registerUser}