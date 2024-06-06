import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from './Models/User.js';

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
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
      clientID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:9000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log("Google OAuth authentication successful!");
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

const secret = process.env.REACT_APP_key;
const port = process.env.REACT_APP_PORT_FOR_BACKEND || 9000;

mongoose.connect(process.env.REACT_APP_MongoURL)
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.log('Database connection failed', err));

app.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userdoc = await User.create({ email, password: hashedPassword, first_name, last_name });
    res.send({ userdoc });
  } catch (e) {
    console.log(e.stack);
    res.status(400).send('An error occurred while creating the user');
  }
});

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.REACT_APP_key
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const userDoc = await User.findById(jwt_payload.id);
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
    const userdoc = await User.findOne({ email });
    if (!userdoc) {
      return res.status(401).json('Wrong Credentials');
    }
    const passok = bcrypt.compareSync(password, userdoc.password);
    if (!passok) {
      return res.status(401).json('Wrong Credentials');
    }
    jwt.sign({ email, id: userdoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token).json({ status: 'ok', user: userdoc });
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
    failureRedirect: "/login",
  }),
  async function (req, res) {
    console.log("Google OAuth authentication successful!");
    try {
      let userDoc = await User.findOne({ email: req.user.emails[0].value });
      if (!userDoc) {
        userDoc = await User.create({
          email: req.user.emails[0].value,
          first_name: req.user.name.givenName,
          last_name: req.user.name.familyName,
        });
      }

      jwt.sign({ email: userDoc.email, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) {
          console.error(`Error signing JWT token: ${err.message}`);
          return res.status(500).send("Server error");
        }
        res.redirect(`http://localhost:3000/chat?token=${token}`);
      });
    } catch (error) {
      console.error(`Error in /auth/google/callback: ${error.message}`);
      res.status(500).send("Server error");
    }
  }
);

app.post('/name', async (req, res) => {
  const { email } = req.body;
  const userdoc = await User.findOne({ email });
  if (userdoc) {
    return res.status(200).json({ firstName: userdoc.first_name, email: userdoc.email });
  } else {
    return res.status(404).json({ error: 'User not found' });
  }
});

app.post('/update', async (req, res) => {
  const { oldEmail, newEmail, firstName } = req.body;
  try {
    let userdoc = await User.findOne({ email: oldEmail });
    if (!userdoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    userdoc.email = newEmail;
    userdoc.first_name = firstName;
    await userdoc.save();

    userdoc = await User.findOne({ email: newEmail });
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
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: userDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
