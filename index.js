import express from "express"
import bodyParser from "body-parser"
import mongoose, { Schema } from "mongoose"
import cors from "cors"
import multer from "multer"
import path from 'path';
import fs from 'fs';
import { log } from "console"

const app = express()
const port = 8080           //This will change when we host it online

app.use(bodyParser.urlencoded({ extended: true }))  //Allow express to use body-parser to parse incoming form data.
app.use("/image",express.static('uploads'));
app.use(cors())

mongoose.connect("mongodb+srv://admin:admin@real-home.i5pmd.mongodb.net/?retryWrites=true&w=majority&appName=real-home") //Connect to the MongoDB


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
  additionalFeatures:String
})

const Listing = mongoose.model("Listing",listingSchema)


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
    console.log(data);

    res.send(data)
})
.post("/list-property",upload.array('property-images'),(req,res)=>{

  const {listingType,propertyType,erfSize,address,suburb,city,province,sellerName,sellerEmail,sellerMobile,agentName,agentEmail,agentMobile,listPrice,rates,levies,listingHeading,listingDescription,petsAllowed,bedrooms,bathrooms,additionalFeatures,carports} = req.body
  const imageArray =[]

  var pets = false
  if (petsAllowed == "yes") {
    pets = true
  }
  req.files.forEach((file)=>{
    imageArray.push(file.filename)
  })

  console.log(imageArray);

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
      additionalFeatures:additionalFeatures
    }
  )
  listing.save()
})
.listen(port,()=>{
    console.log(`Server started on port ${port}`);
})