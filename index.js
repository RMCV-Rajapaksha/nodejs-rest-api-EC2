const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer=require('multer')
const path = require('path');

// Load environment variables from .env file
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const postRoute = require('./routes/posts');
const commentRoute = require('./routes/comments');



// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use("/images",express.static(path.join(__dirname,"/images")))
app.use(cors({
    origin: 'http://localhost:5173', // Ensure no trailing slash
    credentials: true,
}));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/posts', postRoute);
app.use('/api/comments', commentRoute);


app.post('/api/checkout', async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "buy me a coffee",
              },
              unit_amount: 1000, 
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: "https://devdexfrontend.vercel.app/",
        cancel_url: "https://devdexfrontend.vercel.app/",
      });
  
      console.log(session); // Log the session object here
  
      // Send the session URL to the client
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error.message);
      res.status(500).send("Internal Server Error");
    }
  });


//image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res, next) => {
    console.log(req.body);
    res.status(200).json("Image has been uploaded successfully");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});


