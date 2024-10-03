import express from "express"
import bodyParser from "body-parser"

const app = express()
const port = 8080           //This will change when we host it online

app.use(bodyParser.urlencoded({ extended: true }))  //Allow express to use body-parser to parse incoming form data.

app
.get("/",(req,res)=>{
    res.send("Hello Realhome")
})
.listen(port,()=>{
    console.log(`Server started on port ${port}`);
})