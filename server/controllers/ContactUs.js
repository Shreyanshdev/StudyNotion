const {contactUsEmail} = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.contactUs = async(req,res) => {
    try{

        const {email , firstName , lastname , message ,phoneNo , countryCode} = req.body;

        const emailRes = await mailSender(
                                    email,
                                    "Your data sent succesfully",
                                    contactUsEmail(email , firstName , lastname , message ,phoneNo , countryCode)
        );
        console.log(emailRes);
        return res.json({
            success:true,
            message:"Email sent successfully"
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}