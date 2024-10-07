import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js ";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


//method to register user 
// register controller

//method to register user 
// register controller
const registerUser = asyncHandler(async (req, res) => {
    //steps to register user
    //extract user data from request / get user data from frontend
    //validation - non-empty fields
    //check if user already exist - username and email
    //check for images, check for avator 
    //upload them to clouldinary, avator
    //create user object now - create entry in DB
    //check for response i.e. user creation 
    //return response 




    // get user data from frontend
    // we can get form and json data from body
    const { username , email, fullName, password } = req.body
    // console.log(username, email)
    // console.log("req.body-->",req.body)
    //validation  -- non empty
    //either check for each and every field for non-empty
    //or use advance methods
    if(
        [username , email, fullName, password].some((field) => {
            return field?.trim() === ''
        })
    ){
        throw new ApiError(400, "All input Fileds are required")
    }



    //check if user already exist - username and email
    // findOne returns the one user which is find first
    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"user already exist with this username or email")
    }

    // console.log("req.files-->",req.files)
    const avatarLocaPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;  --> "throws error as can't read properties of undefined" while we send an empty string in input
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if(!avatarLocaPath){
        throw new ApiError(400,"avatar file required")
    }



    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocaPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log("uploaded on clodinary")

    //check for errorless uploadation of avatar on cloudinary
    if(!avatar){
        return new ApiError(400, "avatar file is required")
    }
    // console.log("avatar check")
    //now create a entry in database
    const user = await User.create(
        {
            username , 
            email, 
            fullName, 
            password,
            avatar : avatar.url,
            coverImage : coverImage?.url || "" 
        }
    )
    // console.log("user created")


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()  

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })
        // console.log(accessToken ,refreshToken)
        return { accessToken ,refreshToken }

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token");
    }
}

const loginUser = asyncHandler(async(req,res) => {
    
    //req.body -> data
    //username or email
    //find user
    //pass check
    //refresh token access token
    //send cookie

    const { username, password, email } = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or password is required")  //400 bad request
    }

    const user = await User.findOne({
            $or: [{username},{email}]
        })
    
    if(!user){
        throw new ApiError(404,"user doesn't exist")
    }

    const isPasswordValid = user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials")
    }


    const { refreshToken , accessToken } = await generateAccessAndRefreshTokens(user._id)  
    // console.log(refreshToken,accessToken,user._id) 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //set options for cookies
    const options = {
        httpOnly :true,     // Accessible only by the web server (not by JavaScript)
        secure: true,   // Only send the cookie over HTTPS
    }

    return res.status(200)
              .cookie("refreshToken",refreshToken,options)
              .cookie("accessToken",accessToken,options)
              .json(
                    new ApiResponse(200, {
                        user:loggedInUser,
                        refreshToken,
                        accessToken
                    },
                "user logged in successfully")
                )


})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
                            {
                                $set:{
                                    refreshToken : undefined
                                }
                            },
                            {
                                new : true
                            }
    )
    const options = {
        httpOnly : true,
        secure : true,
    }


    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged Out Successfully"))

})

const refresshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    
    try {

        if (!incomingRefreshToken) {
            throw new ApiError(401,"Unauthorised Request")
        }
        console.log(incomingRefreshToken)
        console.log('\n')
        
   
        
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        // console.log(incomingRefreshToken)
        // console.log(decodedToken)
        // console.log('\n')
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        console.log(user.refreshToken)
        
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401,"Refresh Token is Used or Expired");
        }
    
        const options ={
            httpOnly: true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh TOken")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword, confPassword} = req.body;
    const user = await User.findById(req.user?._id);
    if(!isPasswordCorrect(oldPassword)){
        throw new ApiError(400,"Invalid Old Password")
    }
    if (confPassword !== newPassword) {
        throw new ApiError(400,{},"new password doesn't match")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})


//updating text base data
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {email, fullName} = req.body
    if(!email || !password){
        throw new ApiError(400,"all fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email: email,
            }
        },
        {
            new : true   // return the updated user
        }
    ).select("-password")

    return res
    .status(200)
    .json(200,user,"Account details updated successfully")
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocaPath = req.file?.path

    if(!avatarLocaPath){
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocaPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user_id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new : true
        }   
    ).select("-password")

    return res
    .status(200)
    .json(200,user,"updated avatar successfully")

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocaPath = req.file?.path

    if(!coverImageLocaPath){
        throw new ApiError(400, "cover file is missing")
    }

    const avatar = await uploadOnCloudinary(coverImageLocaPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover Image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user_id,
        {
            $set:{
                coverImage:coverImager.url
            }
        },
        {
            new : true
        }   
    ).select("-password")

    return res
    .status(200)
    .json(200,user,"updated coverImage successfully")

})

export {registerUser,
        loginUser,
        logoutUser,
        refresshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateUserCoverImage,
        updateUserAvatar,
        updateAccountDetails
    }