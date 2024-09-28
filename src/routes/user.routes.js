import { Router } from "express";
import {upload} from "../middlewares/uploadFile.middleware.js"
import {registerUser , login, logoutUser, updateUserPassword, updateAvatar} from "../controllers/user.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router() 

router.route("/register").post(upload.fields([
    {
        name : "avatar" ,
        maxCount : 1
    },
    {
        name : "coverImage" ,
        maxCount : 1 
    }
]) , registerUser)

router.route("/login").post(login)

router.route("/logout").post(verifyJWT , logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT , updateUserPassword)

router.route("/profile").get(verifyJWT , getUserInfo)

router.route("/update-user-info").patch(verifyJWT , updateAccountInfo)

router.route("/update-user-avatar").patch(verifyJWT , upload.single("avatar") , updateAvatar)

router.route("/cover-img" , verifyJWT , upload.single("/coverImage") , updateCoverImg)

router.route("/channel/:username").get(verifyJWT , getUserChannelInfo)

router.route("/watch-history").get(verifyJWT , getWatchHistory)



export default router 




