// require('dotenv').config({path: './env'})

// import dotenv from 'dotenv'
import connectDB from './db/index.js';
import app from './app.js';

// dotenv.config({
//     path: './env'
// })




connectDB()
.then(()=>{
    app.listen(process.env.Port || 8000 , () =>{
        console.log(`server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!!",err)
})











//database connection
// ;(  async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//        app.on("error",(error)=>{
//         console.log("ERR:", error)
//         throw error
//        })

//        app.listen(process.env.PORT,()=>{
//         console.log(`APP is listening on port ${process.env.PORT}`)
//        })
    
//     } catch (error) {
//         console.log("MongoDB connection ERROR: ",error)
//         throw error
//     }
//     }
// )()