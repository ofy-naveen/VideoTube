import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js ";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
    console.log(username, email)
    console.log("req.body-->",req.body)
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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;  

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

export default registerUser 

