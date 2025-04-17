const Section = require("../models/Section");
const Course = require("../models/Course");

//Section handler
exports.createSection = async (req , res) => {
    try{
        //data fetch
        const {sectionName , courseId} = req.body;

        //validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:'Missing Properties',
            });
        }

        //create section
        const newSection = await Section.create({sectionName});
        //update course with Section object id
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                            courseId,
                                            {
                                                $push:{
                                                    courseContent:newSection._id,
                                                }
                                            },
                                            {new:true},
                                        )
                                        .populate({
                                            path:"courseContent",
                                            populate:{
                                                path:"subSection",
                                            }
                                        })
                                        .exec();

        // use populate to replace section/subsection both in updatedcourse details

        //return response
        return res.status(200).json({
            success:true,
            message:'Section created successfully',
            updatedCourseDetails,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to create section",
            error:error.message,
        })
    }
}

//update section
exports.updateSection = async(req,res) => {
    try{
        const {sectionName , sectionId } =req.body;

        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:'Missing Properties',
            });
        }

        const section = await Section.findByIdAndUpdate(sectionId ,{sectionName},{new:true});

        return res.status(200).json({
            success:true,
            message:'Section updated successfully',
            
        })


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to update section",
            error:error.message,
        })
    }
}

//delete section
exports.deleteSection = async(req,res) => {
    try{
        //get id :- assumning we are sending id in params
        const {sectionId} = req.body;
        //use find and delete
        await Section.findByIdAndDelete(sectionId);
        //todo: do we need to delete the entry from  course schema;
        //return res
        return res.status(200).json({
            success:true,
            message:'Section deleted successfully',
            
        })

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to delete section",
            error:error.message,
        })
    }
}