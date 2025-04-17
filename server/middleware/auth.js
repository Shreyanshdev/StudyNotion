const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async(req , res , next) => {
    try{
        const token = req.cookies.token 
                        || req.body.token 
                        || req.header("Authoisation").replace("Bearer" , "");

        
        //if token is missing
        if(!token){
            return res.status(401).json({
                success:false,
                message:"token is missing",
            })
        }

        //verify the token
        try{
            const decode = jwt.verify(token , process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        }catch(err){
            return res.status(401).json({
                success:false,
                message:"token is invalid",
            })
        }
        next();

    }
    
    catch(error){
        return res.status(401).json({
            success:false,
            message:"something went wrong while validationg token",
        });
    }
}

//isStudent
exports.isStudent = async( req, res , next) => {
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"this is protected route for students"
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again"
        })
    }
}

//isInstructor
exports.isInstructor = async( req, res , next) => {
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"this is protected route for Instructor"
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again"
        })
    }
}

//isAdmin
exports.isAdmin = async( req, res , next) => {
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"this is protected route for Admin"
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again"
        })
    }
}
