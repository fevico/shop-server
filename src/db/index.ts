import mongoose from "mongoose";

const uri = process.env.MONGO_URI
if(!uri) throw new Error("MONGODB_URI is not defined")

export const dbConnect = () =>{
    mongoose.connect(uri).then(()=>{
        console.log('db connected')
    }).catch((error)=>{
        console.log('db connection failed:', error.message)
    })
}