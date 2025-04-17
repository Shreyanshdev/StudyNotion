const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt= require("bcrypt");
const crypto = require("crypto"); 

//reset password token
exports.resetPasswordToken = async(req , res) => {
    
    try{

        //get email from req ki body
        const email = req.body.email;

        //check user for this email , email validation
        const user = await User.findOne({email: email});
        if(!user){
            return res.status(401).json({success:false,message:"your email is not registered with us"});
        }

        //generate token
        const token = crypto.randomUUID();

        //update user by adding token nd expiration time
        const updateDetails = await User.findOneAndUpdate({email:email},
                                                        {
                                                            token:token,
                                                            resetPasswordExpires:Date.now() + 5*60*1000,
                                                        },
                                                        {new:true});

        //create url
        const url = `http://localhost:3000/update-password/${token}`;

        //send mail containing url
        await mailSender(email , "Password Reset Link" , `Password Reset Link: ${url}`);

        //return response 
        return res.json({
            success:true,
            messsage:"Email send successfullly , please check email and change pwd",
        });


    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending reset pwd mail",
        })
    }
    
}

//resetPassword
exports.resetPassword = async(req , res) => {
    try{
         //data fetch
        const {password , confirmPassword ,token} = req.body;

        //validation
        if(password !== confirmPassword){
            return res.json({
                success:false,
                message:"password is not matching",
            });
        }

        //get user details from db using token
        const userDetails = await User.findOne({token:token});

        //if no entry is created - invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:"invalid token"
            })
        }

        //token  time check
        if( userDetails.resetPasswordExpires < Date.now() ){
            return res.json({
                success:false,
                message:"token expired ,please regenerate it !!"
            })
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password , 10);

        //db m update kardo
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        );

        //return res
        return res.status(200).json({
            success:true,
            message:"password reset succcesful"
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending reset pwd mail",
        })
    }

}