const nodemailer = require("nodemailer")

const sendEmail = async (opctions) => {

    const transporter = nodemailer.createTransport({
        host:process.env.SMPT_HOST,
        port:process.env.SMPT_PORT,
      
        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD
        }
    }
    )

    const mailopction = {
        from: process.env.SMPT_MAIL,
        to: opctions.email,
        subject: opctions.subject,
        text: opctions.message
    }
    
    await transporter.sendMail(mailopction)
    
}
module.exports = sendEmail;