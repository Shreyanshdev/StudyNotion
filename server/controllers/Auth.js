const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {passwordUpdated} =require("../mail/templates/passwordUpdate");
const mailSender = require("../utils/mailSender");
require("dotenv").config();

//send OTP
exports.sendOTP = async(req , res) => {

    try{
        //fetch email
        const {email} = req.body ;

        //if user already exist || validate
        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message: "User already exist",
            })  
        }

        //generate otp
        var otp = otpGenerator.generate(6 ,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated : " , otp);

        //check otp is unique or not
        const result = await OTP.findOne({otp : otp});

        while(result){
            otp = otpGenerator.generate(6 , {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp : otp});
        }

        const otpPayload = {email , otp};

        //entry an entry to db
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return successful response
        res.status(200).json({
            success:true,
            message:"OTP sent successfully",
            otp,
        })

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,

        })
    }
}

//signUp
exports.signUp = async (req , res) => {
    try{

        //data fetch
        const {firstName , lastName , email , password , confirmPassword ,accountType ,contactNumber , otp} = req.body;

        //validate karo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message:"All feilds are required",
            })
        }

        //2 password match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password and confirm password vale doesn't match. Please try again !!"
            })
        }

        //if user already present or not
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(401).json({
                success:false,
                message: "User already registered",
            })  
        }

        //find most recent otp
        const recentOtp = await OTP.find({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
          })
            .sort({ createdAt: -1 })
            .limit(1);
          
        console.log(recentOtp);
        //validate
        if(recentOtp.length == 0){
            return res.status(400).json({
                success:false,
                message:"Otp not found", 
            })
        } else if(otp !== recentOtp[0].otp){
            return res.status(400).json({
                success:false,
                message:"invalid Otp", 
            }) 
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password , 10);

        //entry in db
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            contactNumber:null,
            about:null,
        })
        const user = await User.create({
            firstName, 
            lastName, 
            email, 
            password:hashedPassword, 
            accountType,
            additionalDetail :profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,

        })

        //return res
        res.status(200).json({
            success:true,
            message:"user is registered successfully",
            user,
        })

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Please try again !! ",

        })
    }
}

//login 
exports.logIn = async(req , res) => {
    try{

        //data fetch
        const {email , password} = req.body;

        //validation
        if(!email || !password){
            return res.status(403).json({
                success:false,
                messsage:"All feilds are required",
            });
        }

        //user exist or not
        const user = await User.findOne({email}).populate("additionalDetail");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered, please sign up first",
            });
        }

        //generate JWT after password checking
        if( await bcrypt.compare(password , user.password)){
            const payload = {
                email : user.email,
                id :user._id,
                accountType : user.accountType,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {
                expiresIn :"2h",
            });
            user.token = token;
            user.password = undefined;

            //create coookie and send response
            const options = {
            expires : new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
            }
            res.cookie("token" , token , options).status(200).json({
                success:true,
                token ,
                user, 
                message:"Logged in successfully",
            })
        }

        else{
            return res.status(401).json({
                success:false,
                message:"Password inccoorect",
            })
        }

        

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Login failure, Please try again",
        })
    }
}

//change password
exports.changePassword = async(req ,res) => {
    try{

        //data fetch
        const userDetails = await User.findById(req.user.id);

        //get old password, new password , confirm password
        const{oldPassword , newPassword , confirmPassword} = req.body;

        //validate old password
        const isPasswordMatch = await bcrypt.compare(
                                            oldPassword,
                                            userDetails.password,
        )
        if(!isPasswordMatch){
            return res.json({
                success:false,
                message:"The password is incorrect",
            })
        }

        //update password
        const encryptedPassword = await bcrypt.hash(newPassword ,10);
        const updatedCourseDetails = await User.findByIdAndUpdate(
                                                            req.user.id,
                                                            {password:newPassword},
                                                            {new:true},
        )
        try {
            const emailResponse = await mailSender(
                                                updatedCourseDetails.email,
                                                "Password has been updated in your account",
                                                passwordUpdated(
                                                    updatedUserDetails.email,
                                                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                                                )

            )
            console.log(emailResponse);
        }
        catch(err){
            console.error("Error occurred while sending email:", error)
            return res.status(500).json({
            success: false,
            message: "Error occurred while sending email",
            error: error.message,
            })
        }

        // Return success response
        return res
        .status(200)
        .json({ success: true, message: "Password updated successfully" })
    }   
    catch(error){
        console.error("Error occurred while updating password:", error)
        return res.status(500).json({
        success: false,
        message: "Error occurred while updating password",
        error: error.message,
    })
    }     
}