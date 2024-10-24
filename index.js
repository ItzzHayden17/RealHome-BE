import express from "express";
import bodyParser from "body-parser";
import mongoose, { Schema } from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import sgMail from '@sendgrid/mail';

const app = express();
const port = 8080; //This will change when we host it online
dotenv.config();
const frontEndUrl = "https://realhome-fe.onrender.com";
const saltRounds = 10;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(bodyParser.urlencoded({ extended: true })); //Allow express to use body-parser to parse incoming form data.
app.use("/image", express.static("uploads"));
app.use(cors());

const allowedOrigins = [
  "http://localhost:3000",
  "https://realhome-fe.onrender.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
  }

  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  next();
});

mongoose.connect(process.env.MONGO_URL); //Connect to the MongoDB

const listingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  price: Number,
  listingHeading: String,
  listingDescription: String,
  bed: Number,
  bath: Number,
  car: Number,
  pet: Boolean,
  sqrmeter: Number,
  type: String,
  suburb: String,
  sellType: String,
  levies: Number,
  rates: Number,
  images: Array,
  agentId: String,
  address: String,
  kitchen:{
    type:String,
    required:false,
  },
  livingRoom:{
    type:String,
    required:false,
  },
  study:{
    type:String,
    required:false,
  },
  carport:{
    type:String,
    required:false,
  },
  garden:{
    type:String,
    required:false,
  },
  pool:{
    type:String,
    required:false,
  },
  flatlet:{
    type:String,
    required:false,
  },
  lat:String,
  lng:String,
  city: String,
  province: String,
  sellerName: String,
  sellerEmail: String,
  sellerMobile: Number,
  agentName: String,
  agentEmail: String,
  agentMobile: String,
  additionalFeatures: String,
  userWhoListedID: String,

});

const Listing = mongoose.model("Listing", listingSchema);

const wishlistSchema = new mongoose.Schema({
  price:{
    type:Number,
    required:false
  },
  bed:{
    type:Number,
    required:false
  },
  bath:{
    type:Number,
    required:false
  },
  car:{
    type:Number,
    required:false
  },
  type:{
    type:String,
    required:false
  },
  suburb:{
    type:String,
    required:false
  }, 
  pet:{
    type:Boolean,
    required:false
  },
  city:{
    type:String,
    required:false
  },
  province:{
    type:String,
    required:false
  },
  email:String,
  emailSentToUser:{
    type:Boolean,
    default:false
  }
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  email: String,
  password: String,
  name: String,
  surname: String,
  number: Number,
  isAgent: Boolean,
  image: String,
});

const User = mongoose.model("User", userSchema);

const uploadDir = "uploads";
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
  },
});



//Here is the wishlist checking funtion

function checkForMatches(listing,wishlist){
  return (!wishlist.price || listing.price <= wishlist.price) &&
        (!wishlist.bed || listing.bed == wishlist.bed) &&
        (!wishlist.bath || listing.bath == wishlist.bath) &&
        (!wishlist.car || listing.car == wishlist.car) &&
        (!wishlist.type || listing.type == wishlist.type) &&
        (!wishlist.suburb || listing.suburb == wishlist.suburb) &&
        (!wishlist.pet || listing.pet == wishlist.pet)&&
        (!wishlist.city || listing.city == wishlist.city)&&
        (!wishlist.province || listing.province == wishlist.province)
}


function sendEmail(userEmail,listing){
  
  let msg = {
    from: 'anraypython@gmail.com',
    to: `${userEmail}`,
    subject: 'New Listing Match Found!',
    text: `We found a match for your wishlist: ${JSON.stringify(listing)}`
};
  
  sgMail.send(msg)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error) => {
      console.error(error)
    });
}


async function checkAndNotify() {
  const wishlists = await Wishlist.find();
  const listings = await Listing.find();

  for (const wishlist of wishlists) {
    for (const listing of listings) {

      
      const match = checkForMatches(listing, wishlist)
      
      if (!wishlist.emailSentToUser) {
        if (match) {
          await Wishlist.findByIdAndUpdate(wishlist._id.toString(), {
            $set: {emailSentToUser : true}
          });
          await sendEmail(wishlist.email, listing); // Await here for proper flow
        }
      }
    }
  }
}

setInterval(checkAndNotify  ,6000)


const upload = multer({ storage: storage });
app
  .get("/properties", async (req, res) => {
    const data = await Listing.find();    
    res.send(data);
  })
  .get("/all-agents", async (req, res) => {
    const agents = await User.find({ isAgent: true });
    res.send(agents);
  })
  .get("/listing/:id", async (req, res) => {
    try {
      const listing = await Listing.findOne({ _id: req.params.id });
      const agent = await User.findOne({ _id: listing.agentId });
      res.send([listing, agent]);
    } catch (error) {
      console.log(error);
    }
  })
  .get("/agent/:id", async (req, res) => {
    const agent = await User.findOne({ _id: req.params.id });
    console.log(req.params.id);
    
    res.send(agent);
  })
  .get("/wishlist",(req,res)=>{

  })
  .post("/list-property", upload.array("property-images"), (req, res) => {
    const {
      listingType,
      propertyType,
      erfSize,
      address,
      lng,
      lat,
      suburb,
      city,
      garages,
      province,
      sellerName,
      sellerEmail,
      sellerMobile,
      agentName,
      agentEmail,
      agentMobile,
      listPrice,
      rates,
      levies,
      listingHeading,
      listingDescription,
      petsAllowed,
      bedrooms,
      bathrooms,
      additionalFeatures,
      userId,
      kitchen,
      livingRoom,
      study,
      carport,
      garden,
      pool,
      flatlet,

    } = req.body;
    const imageArray = [];

    var pets = false;
    if (petsAllowed == "yes") {
      pets = true;
    }
    req.files.forEach((file) => {
      imageArray.push(file.filename);
    });

    const listing = new Listing({
      price: listPrice,
      listingHeading: listingHeading,
      listingDescription: listingDescription,
      bed: bedrooms,
      bath: bathrooms,
      car: garages,
      pet: pets,
      sqrmeter: erfSize,
      type: propertyType,
      suburb: suburb,
      sellType: listingType,
      levies: levies,
      rates: rates,
      images: imageArray,
      agentId: userId,
      address: address,
      lng:lng,
      lat:lat,
      city: city,
      kitchen:kitchen,
      livingRoom:livingRoom,
      study:study,
      carport:carport,
      garden:garden,
      pool:pool,
      flatlet:flatlet,
      province: province,
      sellerName: sellerName,
      sellerEmail: sellerEmail,
      sellerMobile: sellerMobile,
      agentName: agentName,
      agentEmail: agentEmail,
      agentMobile: agentMobile,
      additionalFeatures: additionalFeatures,
      userWhoListedID: userId,
    });
    listing.save();
    res.redirect(frontEndUrl);
  })
  .post("/signup", upload.single("agentImage"), (req, res) => {
    const { email, password, confirmPassword, name, surname, number } =
      req.body;
    var agentImage = "";
    var isAgent = false;
    if (req.file) {
      agentImage = req.file.filename;
      isAgent = true;
    }

    if (password == confirmPassword) {
      bcrypt.hash(password, saltRounds, async function (err, hash) {
        const user = new User({
          email: email,
          password: hash,
          name: name,
          surname: surname,
          number: number,
          isAgent: isAgent,
          image: agentImage,
        });
        
        
        await user.save();

        res.cookie("user", JSON.stringify(user), { maxAge: 1000 * 60 * 15 });
        res.redirect(frontEndUrl);

        
        let msg = {
          from: 'anraypython@gmail.com',
          to: `${email}`,
          subject: 'Thank you for registering!',
          text: `This email is just to welcome and thank you for using RealHome.<br>We believe you will have a great time`
        };
        
        sgMail.send(msg)
          .then(() => {
            console.log('Email sent')
          })
          .catch((error) => {
            console.error(error)
          });

      });
    } else {
      res.send("passwords do not match");
    }
  })
  .post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email: email });
      bcrypt.compare(password, user.password, function (err, result) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          if (result) {
            res.cookie("user", JSON.stringify(user), {
              maxAge: 1000 * 60 * 30,
              secure:true,
              sameSite:"None",
              domain:".onrender.com"
            });
            res.redirect(frontEndUrl);

            let msg = {
              from: 'anraypython@gmail.com',
              to: `${email}`,
              subject: 'RealHome Login',
              text: `Hi ${user.name},we have detected a new login to your account,if this was you,you can safely ignore this email`
            };
            
            sgMail.send(msg)
              .then(() => {
                console.log('Email sent')
              })
              .catch((error) => {
                console.error(error)
              });
          } else {
            res.send("Password incorrect");
          }
        }
      });
    } catch (error) {
      console.error(error);
      res.send("User not found,try signin up.");
    }
  })
  .post("/wishlist",(req,res)=>{
    const {price,bed,bath,car,type,suburb,pet,city,province,email} = req.body

    function strinToBool(string){
      return string === "true"
    }
    
    const wishlist = new Wishlist({
      price:price,
      bed:bed,
      bath:bath,
      car:car,
      type:type,
      suburb:suburb,
      city:city,
      pet:strinToBool(pet),
      province:province,
      email:email
    })

      wishlist.save()
    res.redirect(frontEndUrl)
    
  })
  .post("/edit-listing/:id",upload.array("property-images"),async (req,res)=>{


    const {
      images,
      listingType,
      propertyType,
      sqrmeter,
      address,
      lng,
      lat,
      suburb,
      city,
      car,
      province,
      sellerName,
      sellerEmail,
      sellerMobile,
      agentName,
      agentEmail,
      agentMobile,
      price,
      rates,
      levies,
      listingHeading,
      listingDescription,
      petsAllowed,
      bed,
      bath,
      additionalFeatures,
      userId,
      kitchen,
      livingRoom,
      study,
      carport,
      garden,
      pool,
      flatlet,
      listingId

    } = req.body;

    const imageArray = [];

    var pets = false;
    if (petsAllowed == "yes") {
      pets = true;
    }
    req.files.forEach((file) => {
      imageArray.push(file.filename);
    });
    const listingData = await Listing.findById(listingId)
    const filterArray = listingData.images.filter(image => images.includes(image))
    const updatedImagesArray = filterArray.concat(imageArray)
    
    const data = {
      price: price,
      listingHeading: listingHeading,
      listingDescription: listingDescription,
      bed: bed,
      bath: bath,
      car: car,
      pet: pets,
      sqrmeter: sqrmeter,
      type: propertyType,
      suburb: suburb,
      sellType: listingType,
      levies: levies,
      rates: rates,
      images: updatedImagesArray,
      agentId: userId,
      address: address,
      lng:lng,
      lat:lat,
      city: city,
      kitchen:kitchen,
      livingRoom:livingRoom,
      study:study,
      carport:carport,
      garden:garden,
      pool:pool,
      flatlet:flatlet,
      province: province,
      sellerName: sellerName,
      sellerEmail: sellerEmail,
      sellerMobile: sellerMobile,
      agentName: agentName,
      agentEmail: agentEmail,
      agentMobile: agentMobile,
      additionalFeatures: additionalFeatures,
      userWhoListedID: userId,
    }
    const listing = await Listing.findByIdAndUpdate(listingId,data,{overwrite:true})
    res.redirect(frontEndUrl+"/listing/"+listingId)
  })
  .post("/contact-agent/:id",async (req,res)=>{
    const user = await User.findById(req.params.id)
    const {name,email,message} = req.body

    function sendEmail(userEmail,senderEmail,name,message){
  
      let msg = {
        from: `anraypython@gmail.com`,
        to: `${userEmail}`,
        subject: 'Listing enquiry',
        text: `${name} 
               ${senderEmail}
              ${message}`
    };
      
      sgMail.send(msg)
        .then(() => {
          console.log('Email sent')
        })
        .catch((error) => {
          console.error(error)
        });
    }

    sendEmail(user.email,email,name,message)
    res.redirect(frontEndUrl)

  })
  .post("/edit-profile/:id",upload.single("agentImage"),async (req,res)=>{

    const {name,surname,email,agentImage} = req.body

    var image = ""
    if (req.file) {
      image = req.file.filename
    } else {
      image = agentImage
    }
    const data = {
      email:email,
      name:name,
      surname:surname,
      image:image
    }
    const user = await User.findByIdAndUpdate(req.params.id,data)
    res.redirect(frontEndUrl+"/agents")
  })


  .delete("/delete/:id",async (req,res)=>{
    const listing = await Listing.findByIdAndDelete(req.params.id)
    res.redirect(frontEndUrl)
  })
  .listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
