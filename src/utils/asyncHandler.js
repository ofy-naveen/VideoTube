

const asyncHandler = (requestHandler) =>{
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))
    }
}

// next(err): If an error occurs (the catch block is triggered), 
// next(err) is called with the err argument. 
// This signals to Express that an error occurred, 
// so it should skip all regular middleware functions and proceed directly to error-handling middleware.

export {asyncHandler}

// another way to write async handler  (try-catch)

// const asyncHandler = (requestHandler) => async (req,res,next) => {
// try {
//     await requestHandler(req,res,next);
// } catch (error) {
//     res.status(error.code || 500).json({
//         success : false,
//         message : error.message
//     })
// }
// }