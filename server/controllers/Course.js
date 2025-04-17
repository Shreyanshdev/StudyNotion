const Course = require("../models/Course");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
const Categories = require("../models/Categories");

//create course handler
exports.createCourse = async(req, res)=>{
    try{

        //data fetch
        const {courseName , courseDescription , whatYouWillLearn , price , tag , category} = req.body;

        //get thumbnail
        const thumbnail =req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
            return res.status(400).json({
                success:false,
                message:"all feilds are mandetory"
            })
        }

        //check for instructor validation
        const userId =req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("instructor details :",instructorDetails )

        if(!instructorDetails){
            return res.status(400).json({
                success:false,
                messsage:"Instructor details not found"
            })
        }

        //validation on tagdetails
        const categoriesDetails = await Categories.findById(category);
        if(!categoriesDetails){
            return res.status(400).json({
                success:false,
                messsage:"Categories details not found"
            })
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail , process.env.FOLDER_NAME);

        //create an entry to db
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn :whatYouWillLearn,
            price,
            category : categoriesDetails._id,
            tag,
            thumbnail:thumbnailImage.secure_url,
        })

        //add the new course to the user Schema of instructor
        await User.findByIdAndUpdate(
            {_id : instructorDetails._id},
            {
                $push : {
                    courses : newCourse._id,
                }
            },
            {new:true,},
        )

        //update te Category schema
        await Categories.findByIdAndUpdate(
            categoriesDetails._id,
            {
              $push: { courses: newCourse._id },
            },
            { new: true }
        );

        //return res
        return res.status(200).json({
            success:true,
            message:"Course created succcessfully",
            data : newCourse,
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

//get allCourses handler
exports.showAllCourses = async(req , res) =>{
    try{
        const allCourses = await Course.find({} ,{courseName:true , 
                                                price:true ,
                                                thumbnail:true ,
                                                instructor:true,
                                                ratingAndReview:true,
                                                studentEnrolled:true,})
                                                .populate("instructor")
                                                .exec();
        return res.status(200).json({
            success:true,
            message:"Data for all Courses fetched successfully",
            data:allCourses,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Cannot fetched course data",
            error:error.message,
        })
    }
}

//get course  details
exports.getCourseDetails = async(req,res) => {
    try{
        ///get id
        const {courseId} = req.body;

        //find course details
        const courseDetails = await Course.find(
                                                {_id:courseId})
                                                .populate(
                                                    {
                                                        path:"instructor",
                                                        populate:{
                                                            path:"additionalDetail",
                                                        }
                                                    }
                                                )
                                                .populate("category")
                                                //.populate("ratingAndReviews")
                                                .populate({
                                                    path:"courseContent",
                                                    populate:{
                                                        path:"subSection",
                                                    }
                                                })
                                                .exec();

        //validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could the find the course with ${courseId}`,
            })
        }

        //return response
        return res.status(200).json({
            success:true,
            message:"Course details fetched successfully",
            data:courseDetails,
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


