import { v2 as cloudinary } from 'cloudinary';
import { response } from 'express';
import fs from 'fs'

    cloudinary.config({ 
        cloud_name: 'ddyn5lbds', 
        api_key: '897941549959919', 
        api_secret: process.env.API_SECRET_KEY_CLOUDINARY // Click 'View Credentials' below to copy your API secret
    });
    
    const uploadCloudinary=async (localfilepath)=>{
        try {
            if(!localfilepath){
                console.log("no localfilepath")
                return null;

            } 
            
           const response= await cloudinary.uploader.upload(localfilepath,{
                resource_type:"auto"
            })
            console.log("file is uploaded successfully", response.url)
            
        fs.unlinkSync(localfilepath)
            return response
        } catch (error) {
            
        fs.unlinkSync(localfilepath)
        console.log(error,"file uploading to cloudinary is failed")
        return null;
            
        }

    }
    export {uploadCloudinary}