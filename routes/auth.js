const express=require('express')
const router=express.Router()
const User=require('../models/User')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')


//register
router.post('/register',async(req,res)=>{
    try{
        const {username,email,password}=req.body
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hashSync(password,salt) 
        const newUser = new User({
            username,
            email,
            password:hashedPassword
        })
        const savedUser=await newUser.save()
        res.status(200).json(savedUser)
    }
    catch(err){
        res.status(500).json(err)
    }
})

//login
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email,
        });
        if (!user) {
            return res.status(400).json("User not found");
        }
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
            return res.status(401).json("Wrong password");
        }
        const token=jwt.sign({_id:user._id,username:user.username,email:user.email},process.env.SECRET_KEY,{expiresIn:"3d"})  
        res.cookie("token",token).status(200).json(user)
        
    } catch (err) {
        res.status(500).json(err);
    }
});

//logout
router.get('/logout', async (req, res) => {
    try {
        res.clearCookie("token", { sameSite: "None", secure: true }); // Closing parenthesis moved to correct position
        res.status(200).json("User Logged out");
    } catch (err) {
        res.status(500).json(err);
    }
});

//refetch user
// to avoid the log out refreshing 

router.get("/refetch", (req,res)=>{
    const token=req.cookies.token
    jwt.verify(token,process.env.SECRET,{},async (err,data)=>{
        if(err){
            return res.status(404).json(err)
        }
        res.status(200).json(data)
    })
})


module.exports=router;