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
            $set : {
                refreshToken : undefined
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
export {registerUser , login , logoutUser}