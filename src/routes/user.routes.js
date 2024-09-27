import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router()

//inject a middleware for file handeling before sending response

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",  // in frontend also, fieldname should be avatar
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser)
// jab bhi is route pe post req aaye to aapko di gayi field files ko upload karna hai,and then pass to the registerUser Controller

export default userRouter