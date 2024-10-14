import express from "express"
import bodyParser from "body-parser"
import mongoose, { Schema } from "mongoose"
import cors from "cors"
import multer from "multer"
import path from 'path';
import fs from 'fs';
import bcrypt from "bcrypt";
import dotenv from "dotenv"
import { log } from "console"

const app = express()
const port = 8080           //This will change when we host it online
dotenv.config();
const frontEndUrl = "http://localhost:3000"
const saltRounds = 10

app.use(bodyParser.urlencoded({ extended: true }))  //Allow express to use body-parser to parse incoming form data.
app.use("/image",express.static('uploads'));
app.use(cors())

mongoose.connect(process.env.MONGO_URL) //Connect to the MongoDB


const listingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
},
  price: Number,
  listingHeading: String,
  listingDescription: String,
  bed: Number,
  bath: Number,
  car: Number,
  pet: Boolean,
  sqrmeter : Number,
  type: String,
  suburb:String,
  sellType:String,
  levies:Number,
  rates:Number,
  images:Array,
  agentId:Number,
  address:String,
  city:String,
  province:String,
  sellerName:String,
  sellerEmail:String,
  sellerMobile:Number,
  agentName:String,
  agentEmail:String,
  agentMobile:String,
  additionalFeatures:String,
  userWhoListedID:String
})

const Listing = mongoose.model("Listing",listingSchema)

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
},
  email:String,
  password:String,
  name:String,
  surname:String,
  number:Number,
  isAgent:Boolean,
  image:String,
})

const User = mongoose.model("User",userSchema)


const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
 // Store files in memory (for testing)
 const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, uploadDir); // Set the destination directory for uploads
  },
  filename: (req, file, cb) => {
      // Set the filename with a unique identifier
      cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Use timestamp to avoid name collisions
  }
});

const upload = multer({ storage: storage });
app
.get("/properties",async (req,res)=>{
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
    const data = await Listing.find()
    res.send(data)
})
.get("/all-agents",async (req,res)=>{
  const agents = await User.find({isAgent:true})  
  res.send(agents)
})
.get("/listing/:id",async (req,res)=>{

  try {
    const listing = await Listing.findOne({_id : req.params.id })
    res.send(listing)
    console.log(listing);
    
  } catch (error) {
    console.log(error);
    
  }

})
.post("/list-property",upload.array('property-images'),(req,res)=>{

  const {listingType,propertyType,erfSize,address,suburb,city,province,sellerName,sellerEmail,sellerMobile,agentName,agentEmail,agentMobile,listPrice,rates,levies,listingHeading,listingDescription,petsAllowed,bedrooms,bathrooms,additionalFeatures,carports,userId} = req.body
  const imageArray =[]
  console.log(userId);
  
  var pets = false
  if (petsAllowed == "yes") {
    pets = true
  }
  req.files.forEach((file)=>{
    imageArray.push(file.filename)
  })


  const listing = new Listing(
    {
      price: listPrice,
      listingHeading: listingHeading,
      listingDescription: listingDescription,
      bed: bedrooms,
      bath: bathrooms,
      car: carports,
      pet: pets,
      sqrmeter : erfSize,
      type: propertyType,
      suburb:suburb,
      sellType:listingType,
      levies:levies,
      rates:rates,
      images:imageArray,
      agentId:1,
      address:address,
      city:city,
      province:province,
      sellerName:sellerName,
      sellerEmail:sellerEmail,
      sellerMobile:sellerMobile,
      agentName:agentName,
      agentEmail:agentEmail,
      agentMobile:agentMobile,
      additionalFeatures:additionalFeatures,
      userWhoListedID:userId
    }
  )
  listing.save()
  console.log(listing);
  
  res.redirect(frontEndUrl)
})
.post("/signup",upload.single('agentImage'),(req,res)=>{
  const {email,password,confirmPassword,name,surname,number} = req.body
  var agentImage = ""
  var isAgent = true
  if (req.file) {
    agentImage = req.file.filename
    isAgent = true
  }
  
  if (password == confirmPassword) {
    bcrypt.hash(password, saltRounds,async function(err, hash) {
      const user = new User({
        email:email,
        password:hash,
        name:name,
        surname:surname,
        number:number,
        isAgent:isAgent,
        image:agentImage
      })

      await user.save()
      
      res.cookie("user",JSON.stringify(user),{maxAge:1000*60*15})
      res.redirect(frontEndUrl)
  });
  }else{
    res.send("passwords do not match")
  }

})
.post("/login", async (req,res)=>{
  const {email,password} = req.body
  try {
    const user = await User.findOne({ email: email });
    bcrypt.compare(password, user.password, function(err, result) {
      if (err) {
        console.log(err);
        res.send(err)
      }else{
        if (result) {
          res.cookie("user",JSON.stringify(user),{maxAge:1000*60*15 })
          res.redirect(frontEndUrl)
        }else{
          res.send("Password incorrect")
        }
      }
  });
  } catch (error) {
    console.error(error);
    res.send("User not found,try signin up.")
  }
  
})
.listen(port,()=>{
    console.log(`Server started on port ${port}`);
})