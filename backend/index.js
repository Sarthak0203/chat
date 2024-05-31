const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");
require('dotenv').config();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: 'lax' },
  })
);


app.use(passport.initialize());
app.use(passport.session());


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:9000/auth/google/callback", // Updated this line
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log("Google OAuth authentication successful!"); // Add logging statement
      cb(null, profile);
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  cb(null, user);
});

const user = require('./Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = process.env.key;
const port = process.env.PORT_FOR_BACKEND || 9000;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
mongoose.connect(process.env.MongoURL)
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.log('Database connection failed', err));

app.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userdoc = await user.create({ email, password: hashedPassword, first_name, last_name });
    res.send({ userdoc });
  } catch (e) {
    console.log(e.stack);
    res.status(400).send('An error occurred while creating the user');
  }
});
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.key
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const userDoc = await user.findById(jwt_payload.id);
    if (userDoc) {
      return done(null, userDoc);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userdoc = await user.findOne({ email });
    if (!userdoc) {
      return res.status(401).json('Wrong Credentials');
    }
    const passok = bcrypt.compareSync(password, userdoc.password);
    if (!passok) {
      return res.status(401).json('Wrong Credentials');
    }
    jwt.sign({ email, id: userdoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token).json({ status: 'ok', user: userdoc }); // Include the user data in the response
    });
  } catch (error) {
    console.error(`Error in /login route: ${error.message}`);
    res.status(500).send('Server error');
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login", // Redirect to the login page if authentication fails
  }),
  async function (req, res) {
    console.log("Google OAuth authentication successful!"); // Add logging statement
    try {
      // Find or create the user in your database
      let userDoc = await user.findOne({ email: req.user.emails[0].value });
      if (!userDoc) {
        userDoc = await user.create({
          email: req.user.emails[0].value,
          first_name: req.user.name.givenName,
          last_name: req.user.name.familyName,
          // Set password as not required for Google-authenticated users
        });
      }

      // Generate a JWT token using secretKey
      jwt.sign({ email: userDoc.email, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) {
          console.error(`Error signing JWT token: ${err.message}`);
          return res.status(500).send("Server error");
        }
        // Redirect to the frontend with the token as a query parameter
        res.redirect(`http://localhost:3000/chat?token=${token}`);
      });
    } catch (error) {
      console.error(`Error in /auth/google/callback: ${error.message}`);
      res.status(500).send("Server error");
    }
  },
  function(err, req, res, next) {
    // This function will be called if the authentication process fails
    console.error("Authentication failure:", err);
    res.redirect("/login"); // Redirect to login page on authentication failure
  }
);


app.post('/name', async (req, res) => {
  const { email } = req.body;
  const userdoc = await user.findOne({ email });
  if (userdoc) {
    return res.status(200).json({ firstName: userdoc.first_name, email: userdoc.email });
  } else {
    return res.status(404).json({ error: 'User not found' });
  }
});

app.post('/update', async (req, res) => {
  const { oldEmail, newEmail, firstName } = req.body;
  try {
    let userdoc = await user.findOne({ email: oldEmail });
    if (!userdoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    userdoc.email = newEmail;
    userdoc.first_name = firstName;
    await userdoc.save();

    // Find the updated user
    userdoc = await user.findOne({ email: newEmail });
    console.log('user updated');
    console.log(userdoc);
    res.json({ success: true, user: userdoc });
  } catch (error) {
    console.error(`Error in /update route: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const userDoc = await user.findById(req.user.id);
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: userDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
