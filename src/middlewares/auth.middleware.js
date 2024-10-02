import {asyncHandler} from "../utils/asyncHandler.js"
import apiError from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"


export const verifyJWT = asyncHandler(async(req, _,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // get access token aither from cookies or from http headers
    
        if(!token){
            throw new apiError(401, "Unauthorised request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if (!user) {
            throw new apiError(401,"invalid access token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401,error?.message || "Invalid Access Token")
    }

})