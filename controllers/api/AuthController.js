const db = require('../../database/db');
const crypto = require('../../services/crypto');
const transporter = require('../../services/mailer');
require("dotenv").config();
const path = require('path');
const fs = require('fs');
//const fs = require('fs/promises');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const baseUrl = process.env.BASEURL;
const JSONWEBTOKEN_KEY = process.env.JSONWEBTOKEN_KEY;
const tokenBlacklist = require('../../middeleware/tokenBlackList');



/* ------------ Supportive Functions ---------------------------*/

const updateImagesPath = async(users)=>{
  return users.map(user => ({
    ...user,
    profile_img: (user.profile_img && user.profile_img!="")? user.profile_img.replace('/uploads', baseUrl+'/uploads'):'',
  }));
}

const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase());

const generateRandomPassword = (length) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}
/* ------------ API ---------------------------*/


exports.apiLogin = async (req, res) => {
    //validate request
    if (!req.body) {
     res.status(400).send({
       status: false,
       result: "",
       errors: "Request parameters can not be empty!",
     });
   }
 
   const { email, password } = req.body;
 
   try {
     // Query the database for the user with the given email
     const sql = "SELECT * FROM `users` WHERE email = ?";
     var results = await db.query(sql, [email]);
     if (results.length === 0) {
        res.status(200).send({ 
          status: false, 
          result: "",
          errors: "Wrong Email and password.",
        });

     }else{

        //if(results[0].email_verified_at!== null)
        //{
          results = results.map(user => ({
            ...user,
            profile_img: (user.profile_img && user.profile_img!="")? user.profile_img.replace('/uploads', baseUrl+'/uploads'):'',
          }));
          const user = results[0];
    
          // Compare the provided password with the hashed password in the database
          const user_password = crypto.decrypt(user.password);
      
          if(req.body.password==user_password)
          {
            // Create a JWT token
            const token = jwt.sign({ userId: user.id }, JSONWEBTOKEN_KEY, { expiresIn: '1h' });
            res.status(200).send({ 
              status: true, 
              result: { user: user, token: token }, 
              errors: "" 
            });
          }else{
            res.status(200).send({ 
              status: false, 
              result: "",
              errors: "Wrong Email and password."
            });
          }
        /*}else{
          res.status(200).send({ 
            status: false, 
            result: "",
            errors: "Please verify your email."
          });
        }*/
        
     }
     
     
 
   }catch (error) {
     res.status(500).send({ status: false, result: "", errors:error });
   }
 }


 exports.apiLogout = async (req, res) => {
   //validate request
   if (!req.body) {
     res.status(400).send({
       status: false,
       result: "",
       errors: "Request parameters can not be empty!",
     });
    
   }
   const token = req.headers.authorization;
 
   if (token) {
     tokenBlacklist.add(token);
   }
 
   res.status(200).send({
     status: true,
     result: "",
     errors: "Logged out Successfully",
   });
 
 }
 
 // create and save new user
 exports.apiRegister = async (req, res) => {
   //validate request
   if (!req.body) {
     res.status(400).send({
       status: false,
       result: "",
       errors: "Request parameters can not be empty!",
     });
   }
 
   const {first_name, last_name, email, password } = req.body;
   const status = 1; 

 
   try { 
    
     //check the email id  is exists in user table or not
     const sql = 'SELECT * FROM `users` WHERE email=?';
     const results = await db.query(sql, [email]);
     if(results.length === 0)
     {
      if(first_name!="" & last_name!="" & email!="" & password!="")
      {
        const hashedPassword = crypto.encrypt(password);
        //const verificationToken = crypto.getOTP(6);
        const verificationToken = generateRandomPassword(10);
        const verificationLink = `${process.env.FRONTEND_URL}/change-password/${verificationToken}`;

        // insert data from the user table
        const insert_sql = "INSERT INTO `users` SET first_name=?, last_name=?, email=?, password=?, email_verify_code=?, status='?'";
        const result2 = await db.query(insert_sql, [ first_name, last_name, email, hashedPassword, verificationToken, status]);
      
        
        if (result2.insertId > 0) {
          //console.log('User inserted:', result2.insertId);

          const sql = 'SELECT * FROM `users` WHERE id=?';
          const user = await db.query(sql, [result2.insertId]);

           const mailOptions = {
               from: process.env.SMTP_FROM_EMAIL,
               to: user[0].email,
               subject: 'Email Verification',
               html: `
               <h1>Dear ${ titleCase(user[0].first_name+" "+user[0].last_name)}</h1>
               <p>Thank you for registering! To verify your email, please use this link below:</p>
               <strong><a href="${verificationLink}">${verificationLink}</a></strong>
               <p>If you didn't sign up for this service, you can ignore this email.</p>
               <p>Thank you</p>
               <p>Support Team</p>
               <p>${process.env.APP_NAME}</p>
               `,
           };
          //console.log(mailOptions);
   
           transporter.sendMail(mailOptions, (error, info) => {
               if (error) {
                   console.log(error);
                   res.status(500).send({status: false, result: "", errors: "Error sending email" });
               } else {
                   console.log('Email sent: ' + info.response); 
                   res.status(200).send({ 
                     status: true, 
                     result: "Thank you for register. We have sent a verification email", 
                     errors: "" 
                   });  
               }
           });
       
           /*res.status(200).send({ 
             status: true, 
             result: "Thank you for register. We have sent a verification email", 
             errors: "" 
           }); */ 
        } else {
          res.status(200).send({status: false, result: "", errors: "Unable to regiter. Please contact to administrator." });
        }
      }else{
        res.status(200).send({status: false, result: "", errors: "Required fields should not empty" });
      }
        
        
       
     }else{
       res.status(200).send({ status: false, result: "", errors: "Sorry. This email is already exists!" });
     }
 
   } catch (error) {
     res.status(500).send({ status: false, result: "", errors:"Error:"+error, errorData:error });
   }
 }
 // create and save new user
 exports.apiRegisterWithFacebook = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const {first_name, last_name, email, facebook_token, profile_image} = req.body;
  const status = 1; 

  try { 
   
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE email=? OR facebook_login=?';
    var results = await db.query(sql, [email, facebook_token]);
    if(results.length === 0)
    {
 
      //upload facebook profile image on our server
      const imageStream = await axios.get(profile_image, { responseType: 'stream' });

      // Save the fetched image to the server
      const timestamp = Date.now();
      const fileName = `user-${timestamp}.jpg`;
      const profile_img = `/uploads/users/${fileName}`;
      const writer = fs.createWriteStream(`public/${profile_img}`);
      imageStream.data.pipe(writer);

      writer.on('finish', () => {
        console.error('Image uploaded successfully', 'imageUrl'+ profile_img);
      });

      writer.on('error', (err) => {
        profile_img = '';
        console.error(err);
      });
      
       // insert data from the user table
       const currentDate = new Date();
       const insert_sql = "INSERT INTO `users` SET first_name=?, last_name=?, email=?, profile_img=?, facebook_login=?, email_verified_at=?, status='?'";
       const result2 = await db.query(insert_sql, [ first_name, last_name, email, profile_img, facebook_token, currentDate, status]);
       
       if (result2.insertId > 0) {
          //console.log('User inserted:', result2.insertId);

          const sql = 'SELECT * FROM `users` WHERE id=?';
          var userData = await db.query(sql, [result2.insertId]);
          userData = await updateImagesPath(userData);

          const user = userData[0];

          const mailOptions = {
              from: process.env.SMTP_FROM_EMAIL,
              to: userData[0].email,
              subject: `Thankyou for register on ${process.env.APP_NAME}`,
              html: `
              <h1>Dear ${ userData[0].first_name}</h1>
              <p>Thank you for registering! </p>
              <p>If you didn't sign up for this service, you can ignore this email.</p>
              <p>Thank you</p>
              <p>Support Team</p>
              <p>${process.env.APP_NAME}</p>
              `,
          };
        
    
          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  console.log(error);
                  res.status(500).send({status: false, result: "", errors: "Error sending email" });
              } else {
                  console.log('Email sent: ' + info.response); 
                  res.status(200).send({ 
                    status: true, 
                    result: "Thank you for register.", 
                    errors: "" 
                  });  
              }
          });
      
         
          // Create a JWT token
          const token = jwt.sign({ userId: user.id }, JSONWEBTOKEN_KEY, { expiresIn: '1h' });
          res.status(200).send({ 
            status: true, 
            result: { user: user, token: token }, 
            errors: "" 
          }); 

       } else {
         res.status(404).send({status: false, result: "", errors: "Unable to insert record in db" });
       }
      
    }else{
        const userData = await updateImagesPath(results);

        // Create a JWT token
        const token = jwt.sign({ userId: userData[0].id }, JSONWEBTOKEN_KEY, { expiresIn: '1h' });
        res.status(200).send({ 
          status: true, 
          result: { user: userData[0], token: token }, 
          errors: "" 
        }); 

    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors: " Error: "+error, errorData: error });
  }
}

 //  email verification 
exports.apiEmailVerify = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const token = req.params.token;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE email_verify_code=?';
      var user = await db.query(sql, [token]);
      if(user.length > 0)
      {
        const currentDate = new Date();
        const token_sql = "UPDATE `users` SET email_verify_code=?, email_verified_at=? WHERE id=?";
        const result = await db.query(token_sql, ['',currentDate, user[0].id]);

        user = await updateImagesPath(user);
        if(result.affectedRows>0){
          res.status(200).send({ 
            status: true, 
            result: { user: user, "message": "Email verified successfully" }, 
            errors: "" 
          });
        }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. token is expired" });
        }
        

      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. Invalid verification token." });
      }
  
    } catch (error) {
      res.status(500).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};
  

// Get profile
exports.apiProfile = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  user_id = req.user.userId;

  try {
    //check the email id  is exists in user table or not
    const sql = 'SELECT * FROM `users` WHERE id=?';
    var user = await db.query(sql, [user_id]);
    if(user.length > 0)
    {

      user = await updateImagesPath(user);
      res.status(200).send({ 
        status: true, 
        result: { user: user }, 
        errors: "" 
      });
    }else{
        res.status(200).send({status: false, result: "", errors: "Not found user with id " + id });
    }
  }catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }

}

// Update profile
exports.apiProfileUpdate = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    // Handle multer error specifically for incorrect image type
    if (req.fileValidationError) {
      return res.status(400).send({status: false, result: "", errors: req.fileValidationError.message });
    }
  
    const user_id = req.user.userId;
  
    const { first_name, last_name, email, phone, gender, about } = req.body;
  
    try {
      //check the user  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id=?';
      const user = await db.query(sql, [user_id]);
      if(user.length > 0)
      {
        //check the email id  is exists in user table or not
        const sql = 'SELECT * FROM `users` WHERE email=? AND id!=?';
        const user2 = await db.query(sql, [email, user_id]);
        if(user2.length > 0)
        {
            res.status(200).send({status: false, result: "", errors: "Email is already exists. please try another Email." });  
        }else{
            var profile_img = user[0].profile_img;
            
            if(req.files.profile_image){
                // Delete the old profile image
                if (profile_img) {
                  const oldProfileImagePath = path.join(__dirname,'../../public/', profile_img);
                  try {
                    await fs.access(oldProfileImagePath); // Check if the file exists
                    await fs.unlink(oldProfileImagePath); // Delete the file
                  } catch (err) {
                    console.error('Error deleting old image:', err);
                  }
                }
                profile_img = '/uploads/users/' + req.files.profile_image[0].filename;
            }
            
            // Update data into the user table
            const sql = 'UPDATE `users` SET first_name=?, last_name=?, email=?, phone=?, gender=?, about=?, profile_img=?  WHERE id=?';
            const edit_results = await db.query(sql, [first_name, last_name, email, phone, gender, about, profile_img,  user_id]);
            
            const updated_sql = 'SELECT * FROM `users` WHERE id=?';
            var updated_user = await db.query(updated_sql, [user_id]);

            updated_user = await updateImagesPath(updated_user);
            
            if (edit_results.affectedRows > 0) {
                res.status(200).send({ 
                    status: true, 
                    result: { user: updated_user }, 
                    errors: "" 
                });

            } else {
                res.status(200).send({status: false, result: "", errors: "Profile record has not updated" });
            }
        }
      }else{
        res.status(200).send({status: false, result: "", errors: "Sorry unable to update profile." });  
      }
  
    } catch (error) {
      res.status(500).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
  };

// Update a new idetified user by user id
exports.apiChangePassword = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const { current_password, new_password, confirm_password } = req.body;
  
    const user_id = req.user.userId;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE id=?';
      const user = await db.query(sql, [user_id]);
      
      if(user.length > 0)
      {
  
            hashedPassword = crypto.encrypt(current_password);
            if(hashedPassword == user[0].password)
            {
              if(new_password==confirm_password)
              {
                newHashedPassword = crypto.encrypt(new_password);
                // Update data into the user table
                const sql = 'UPDATE `users` SET password=? WHERE id=?';
                const edit_results = await db.query(sql, [newHashedPassword,  user_id]);
                if (edit_results.affectedRows > 0) {
                    res.status(200).send({ 
                      status: true, 
                      result: "Password has been updated successfully", 
                      errors: "" 
                    });
  
                } else {
                  res.status(200).send({status: false, result: "", errors: "Password has not updated" });
                }
              }else{
                  res.status(200).send({status: false, result: "", errors: "Both new Passwords are not matched" });
              }
   
            }else{
              res.status(200).send({status: false, result: "", errors: "Current password is not matched" });
            }
            
      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. Cannot updated with id "+user_id+". Maybe user_id is wrong" });
      }
  
    } catch (error) {
      res.status(500).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
  };

// send otp for password change  to user
exports.apiForgotPassword = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const { email } = req.body;
  
    try {
      //check the email id  is exists in user table or not
      const sql = 'SELECT * FROM `users` WHERE email=?';
      const user = await db.query(sql, [email]);
      
      if(user.length > 0)
      {
          //const verificationToken = crypto.getOTP(6);
          const verificationToken = generateRandomPassword(10);
          const verificationLink = `${process.env.FRONTEND_URL}/reset-password/${verificationToken}`;

          const currentDate = new Date();
          const twoDaysAfter = new Date(currentDate);
          twoDaysAfter.setDate(currentDate.getDate() + 2);
          const otp_type = 'change-password';

          // insert data from the user table
          const insert_sql = "INSERT INTO `user_verification_codes` SET user_id=?, otp=?, type=?, expire_at=?";
          const result2 = await db.query(insert_sql, [user[0].id, verificationToken, otp_type, twoDaysAfter]);

          const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: user[0].email,
            subject: 'Password Reset OTP',
            html: `
            <h1>Password Reset OTP</h1>
            <h3>Dear ${user[0].first_name} ${user[0].last_name}</h3>
            <p>Reset password link is given below:<br><p> 
            <p><strong><a href="${verificationLink}">${verificationLink}</a></strong></p>
            <p>If you didn't request for change password, you can ignore this email.</p>
            `,
        };
        //console.log(mailOptions);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);   
                res.status(200).send({ 
                  status: true, 
                  result: "Password reset email sent to your email address", 
                  errors: "",
                  verificationLink: verificationLink
                });
            }
        });
        
        /*res.status(200).send({ 
          status: true, 
          result: "Password reset email sent to your email address", 
          errors: "",
          verificationLink: verificationLink
        });*/

      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. "+email+" not exists in our records" });
      }
  
    } catch (error) {
      res.status(500).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};


// update password
exports.apiUpdatePassword = async (req, res) => {
    //validate request
    if (!req.body) {
      res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
      });
    }
    
    const {token,  new_password, confirm_password } = req.body;
    
    try {

      //check the email id  is exists in user table or not
      const sql = "SELECT * FROM `user_verification_codes` WHERE otp=? AND type='change-password'";
      const result = await db.query(sql, [token]); 
      
      if(result)
      {console.log(result);
        const currentDate = new Date();
        if(result[0].expire_at>currentDate){

          if(new_password==confirm_password)
          {
            //delete otp
            const del_sql = "DELETE FROM `user_verification_codes` WHERE id=?";
            const del_result = await db.query(del_sql, [result[0].id]); 


            newHashedPassword = crypto.encrypt(new_password);
            // Update data into the user table
            const sql = 'UPDATE `users` SET password=?  WHERE id=?';
            const edit_results = await db.query(sql, [newHashedPassword,  result[0].user_id]);
            if (edit_results.affectedRows > 0) {
                res.status(200).send({ 
                  status: true, 
                  result: "Password has been changed successfully", 
                  errors: "" 
                });

            } else {
              res.status(200).send({status: false, result: "", errors: "Sorry. Unable to change password. <br>Please contact to administrator." });
            }
          }else{
              res.status(200).send({status: false, result: "", errors: "Both new Passwords are not matched" });
          }

        }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. token is expired." });
        }

        
        
   
      }else{
          res.status(200).send({status: false, result: "", errors: "Sorry. token is invalid." });
      }
  
    } catch (error) {
      res.status(500).send({status: false, result: "", errors: 'Error fetching data:'+error });
    }
  
};



// Google login
exports.apiRegisterWithGoogle = async (req, res) => {
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const { first_name, last_name, email, google_login, profile_image,social_Id } =
    req.body;
  
  const status = 1;
  try {
    //check the email id  is exists in user table or not
    const sql = "SELECT * FROM `users` WHERE email=? OR google_login=? OR social_Id=?";
    var results = await db.query(sql, [email, google_login,social_Id]);
    if (results.length === 0) {
      //upload google profile image on our server

      
      const imageStream = await axios.get(profile_image, {
        responseType: "stream",
      });

      // Save the fetched image to the server
      const timestamp = Date.now();
      const fileName = `user-${timestamp}.jpg`;
      const profile_img = `/uploads/users/${fileName}`;
      const writer = fs.createWriteStream(`public/${profile_img}`);
      imageStream.data.pipe(writer);

      writer.on("finish", () => {
        console.error("Image uploaded successfully", "imageUrl" + profile_img);
      });

      writer.on("error", (err) => {
        profile_img = "";
        console.error(err);
      });

      // insert data from the user table
      const currentDate = new Date();
      const insert_sql =
        "INSERT INTO `users` SET first_name=?, last_name=?, email=?, profile_img=?, google_login=?, social_Id=?, email_verified_at=?, status='?'";
      const result2 = await db.query(insert_sql, [
        first_name,
        last_name,
        email,
        profile_img,
        google_login,
        social_Id,
        currentDate,
        status,
      ]);

      if (result2.insertId > 0) {
        //console.log('User inserted:', result2.insertId);

        const sql = "SELECT * FROM `users` WHERE id=?";
        var userData = await db.query(sql, [result2.insertId]);
        userData = await updateImagesPath(userData);

        const user = userData[0];

        const mailOptions = {
          from: process.env.SMTP_FROM_EMAIL,
          to: userData[0].email,
          subject: `Thankyou for register on ${process.env.APP_NAME}`,
          html: `
              <h1>Dear ${userData[0].first_name}</h1>
              <p>Thank you for registering! </p>
              <p>If you didn't sign up for this service, you can ignore this email.</p>
              <p>Thank you</p>
              <p>Support Team</p>
              <p>${process.env.APP_NAME}</p>
              `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            res
              .status(500)
              .send({
                status: false,
                result: "",
                errors: "Error sending email",
              });
          } else {
            console.log("Email sent: " + info.response);
            res.status(200).send({
              status: true,
              result: "Thank you for register.",
              errors: "",
            });
          }
        });

        // Create a JWT token
        const token = jwt.sign({ userId: user.id }, JSONWEBTOKEN_KEY, {
          expiresIn: "1h",
        });
        res.status(200).send({
          status: true,
          result: { user: user, token: token },
          errors: "",
        });
      } else {
        res
          .status(404)
          .send({
            status: false,
            result: "",
            errors: "Unable to insert record in db",
          });
      }
    } else {
      const userData = await updateImagesPath(results);

      // Create a JWT token
      const token = jwt.sign({ userId: userData[0].id }, JSONWEBTOKEN_KEY, {
        expiresIn: "1h",
      });
      res.status(200).send({
        status: true,
        result: { user: userData[0], token: token },
        errors: "",
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({
        status: false,
        result: "",
        errors: " Error: " + error,
        errorData: error,
      });
  }
};
