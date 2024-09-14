import { Router } from "express";
import {upload} from "../middlewares/uploadFile.middleware.js"
import {registerUser , login, logoutUser} from "../controllers/user.controller.js";
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
export default router 




