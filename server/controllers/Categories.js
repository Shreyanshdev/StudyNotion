const Categories = require("../models/Categories");

// tag ka handler function
exports.createCategories = async(req , res) => {
    try{

        //fetch data 
        const {name , description} =req.body;

        //validation
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"All feilds are required",
            })
        }

        //create entry in db
        const categoryDetails = await Categories.create({
            name:name,
            description:description
        })
        console.log(categoryDetails);

        // return response
        return res.status(200).json({
            success:true,
            message:"Category created successfully"
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

//getAllcategories handler function
exports.showAllCategories = async(req , res) =>{
    try{
        const allCategories = await Categories.find({} ,{name:true , description:true});
        return res.status(200).json({
            success:true,
            message:"All categories returned successfully",
            allCategories,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//category page details
exports.categoryPageDetails = async(req,res) =>{
    try{
        //get category
        const {categoryId} = req.body;
        //get courses for specified  categoryId
        const selectedCategory = await Categories.findById(categoryId)
                                        .populate("courses")
                                        .exec();
        //validation
        //when there is no category found
        if(!selectedCategory){
            return res.status(404).json({
                success:false,
                message:"Data not found",
            })
        }
        //when there is no courses in category
        if(selectedCategory.courses.length === 0){

        }
        //get courses for different category 
        const differentCategory = await Categories.find({
                                                    _id:{$ne :categoryId},
                                                    })
                                                    .populate("courses")
                                                    .exec();
        //get top selling courses
        const allCategory = await Categories.find().populate("courses");
        const allCourses = allCategory.flatMap((category)=>category.courses);
        const topSellingCategory = allCourses.sort((a,b) => b.sold - a.sold)
                                             .slice(0,10);      
        
        //return response
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategory,
                topSellingCategory,
            },
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}