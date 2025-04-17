const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { Mongoose, default: mongoose } = require("mongoose");


//capture the payment and initiate the razorpay 
exports.capturePayment = async(req,res) => {

    //data fetch
    const {course_id} =req.body;
    const userId = req.user.id;

    //validation
    //course id validate
    if(!course_id){
        return res.json({
            success:false,
            message:"please enter valid course id",
        })
    }
    //valid courseDetails
    let course;
    try{
        course = await Course.findById(course_id);
        if(!course){
            return res.json({
                success:false,
                message:"Could not found the course",
            });
        }

        //user already buy that course
        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentEnrolled.includes(uid)){
            return res.status(200).json({
                success:false,
                message:"Student is already enrolled",
            })
        }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }

    //order create
    const amount = course.price;
    const currency = "INR" ;

    const options = {
        amount : amount*100,
        currency,
        receipt: Math.random(Date.now()).toString(),
        notes : {
            courseId : course_id,
            userId,
        },
    };

    try{
        //initaite the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        
        //return response
        return res.status(200).json({
            success:true,
            courseName : course.courseName,
            courseDescription : course.courseDescription,
            thumbnail : course.thumbnail,
            orderId: paymentResponse.id,
            currency: paymentResponse.currency,
            amount : paymentResponse.amount,
        })
    }
    catch(error){
        console.log(error);
        return res.json({
            success:false,
            message:'Could not initiate order',
        })
    }
}

//verify signature of razorpay and server
exports.verifySignature = async(req,res) => {
    const webHookSecret ="12345678";

    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256" , webHookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest){
        console.log("Payment is authorised");

        const {courseId , userId} =  req.body.payload.payment.entity.notes;

        try{
            //fulfill the action 

            //find the course and enroll student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                                                                {_id : courseId},
                                                                {$push:{studentEnrolled:userId}},
                                                                {new:true},
            );
            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:'Course not found',
                })
            }
            console.log(enrolledCourse);

            //find the student and add the course in the enrolled courses list
            const enrolledStudent = await User.findOneAndUpdate(
                                                                {_id: userId},
                                                                {$push:{courses:courseId}},
                                                                {new:true},
            );
            console.log(enrolledStudent);

            //confirmation ka mail send krdo
            const emailResponse = await mailSender(
                                                enrolledStudent.email,
                                                "Congratulations from Studify",
                                                "Congratulations, you are onboarded to new Studify Course",
            );

            console.log(emailResponse);
            return res.status(200),json({
                success:true,
                message:'Signature verified and Course added !!',
            })
        }
        catch(error){
            return res.status(500),json({
                success:true,
                message:error.message,
            })
        }
    }

    else{
        return res.status(400),json({
            success:true,
            message:'Invalid request',
        })
    }
}

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body

    const userId = req.user.id

    if (!orderId || !paymentId || !amount || !userId) {
        return res
        .status(400)
        .json({ success: false, message: "Please provide all the details" })
    }

    try {
        const enrolledStudent = await User.findById(userId)

        await mailSender(
        enrolledStudent.email,
        `Payment Received`,
        paymentSuccessEmail(
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
            amount / 100,
            orderId,
            paymentId
        )
        )
    } catch (error) {
        console.log("error in sending mail", error)
        return res
        .status(400)
        .json({ success: false, message: "Could not send email" })
    }
    }
    // enroll the student in the courses
    const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
    return res
    .status(400)
    .json({ success: false, message: "Please Provide Course ID and User ID" })
    }

    for (const courseId of courses) {
        try {
        // Find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
            { _id: courseId },
            { $push: { studentsEnroled: userId } },
            { new: true }
        )

        if (!enrolledCourse) {
            return res
            .status(500)
            .json({ success: false, error: "Course not found" })
        }
        console.log("Updated course: ", enrolledCourse)

        const courseProgress = await courseProgress.create({
            courseID: courseId,
            userId: userId,
            completedVideos: [],
        })
        // Find the student and add the course to their list of enrolled courses
        const enrolledStudent = await User.findByIdAndUpdate(
            userId,
            {
            $push: {
                courses: courseId,
                courseProgress: courseProgress._id,
            },
            },
            { new: true }
        )

        console.log("Enrolled student: ", enrolledStudent)
        // Send an email notification to the enrolled student
        const emailResponse = await mailSender(
            enrolledStudent.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
            )
        )

        console.log("Email sent successfully: ", emailResponse.response)
        } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, error: error.message })
        }
    }
}

