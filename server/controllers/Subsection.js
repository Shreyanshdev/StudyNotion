const SubSection =  require("../models/subsection");
const Section = require("../models/Section");

const {uploadImageToCloudinary} = require("../utils/imageUploader");

//create subsection
exports.createSubSection = async(req, res) =>{
    try{
        //fetch data from req body
        const {sectionId , title , timeDuration , description} = req.body;
        //extract video/files
        const video =req.files.videoFile;
        //vaildation
        if( !sectionId || !title || !timeDuration || !description || !video){
            return res.status(400),json({
                success:false,
                message:"all feild are required",
            })
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        //create sub-section
        const SubSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })
        //update section with subsection object id
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId} ,
                                                                {$push:{
                                                                    subSection:SubSectionDetails._id,
                                                                }},
                                                                {new:true},
                                                            );
        //log updated section here after adding populate query
        //return res  
        return res.status(200).json({
            success:true,
            message:'Sub section created successfully',
            updatedSection,
        })

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to create sub-section",
            error:error.message,
        })
    }
}

//update subsection
exports.updateSubSection = async (req, res) => {
    try {
      const { sectionId, subSectionId, title, description } = req.body
      const subSection = await SubSection.findById(subSectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
  
      await subSection.save()
  
      // find updated section and return it
      const updatedSection = await Section.findById(sectionId).populate(
        "subSection"
      )
  
      console.log("updated section", updatedSection)
  
      return res.json({
        success: true,
        message: "Section updated successfully",
        data: updatedSection,
      })
    } 
    catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
}

//delete subsection
exports.deleteSubSection = async (req, res) => {
try {
    const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate(
    { _id: sectionId },
    {
        $pull: {
        subSection: subSectionId,
        },
    }
    )
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if (!subSection) {
    return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
    "subSection"
    )

    return res.json({
    success: true,
    message: "SubSection deleted successfully",
    data: updatedSection,
    })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
        })
    }
}
