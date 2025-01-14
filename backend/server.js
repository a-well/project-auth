import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import crypto from "crypto"
import bcrypt from "bcrypt"

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
})

const User = mongoose.model("User", UserSchema)

app.post("/register", async (req, res) => {
  const { username, password } = req.body

  try {
    const salt = bcrypt.genSaltSync()
    if (password.length < 10) {
      res.status(400).json({
        success: false,
        response: "Passord must be at least 10 characters long"
      })
    } else {
      const newUser = await new User({username, password: bcrypt.hashSync(password, salt)}).save()
      res.status(201).json({
        success: true,
        response: {
          username: newUser.username,
          accessToken: newUser.accessToken,
          id: newUser._id
        }
      })
    }
  } catch(e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({username})
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        response: {
          username: user.username,
          id: user._id,
          accessToken: user.accessToken
        }
      })
    } else {
      res.status(400).json({
        success: false,
        response: "Credentials did not match. Please make sure you entered the correct username and password and try again."
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
})

const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findOne({accessToken})
    if (user) {
      console.log('user found: ', user)
      req.user = user
      next()
    } else {
      res.status(401).json({
        response: "You need to be signed in to access this resource. Please log in",
        success: false
      })
    }
  } catch (e) {
    console.error(e)
    res.status(400).json({
      response: e,
      success: false
    })
  }
}

const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  hearts: {
    type: Number,
    default: 0
  }
})

const Thought = new mongoose.model("Thought", ThoughtSchema)

// Return all the thoughts
app.get("/thoughts", authenticateUser)
app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find({})
  res.status(200).json({success: true, response: thoughts})
})

app.post("/thoughts", authenticateUser)
app.post("/thoughts", async (req, res) => {
  const { message } = req.body

  console.log({message})
  try {
    const newThought = await new Thought({message}).save()
    res.status(201).json({success: true, response: newThought})
  } catch (e) {
    console.error(e)
    res.status(400).json({success: false, response: e})
  }
})

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Project Authentication API")
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
