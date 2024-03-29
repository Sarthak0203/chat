const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://anonochat.vercel.app',
  credentials: true
}));
const user = require('./Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const secret = process.env.secret;
require('dotenv').config()

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
  

app.post('/name', async (req, res) => {
  const { email } = req.body;
  const userdoc = await user.findOne({ email });
  if (userdoc) {
    return res.status(200).json({firstName: userdoc.first_name, email: userdoc.email});
  } else {
    return res.status(404).json({error: 'User not found'});
  }
});
  

  app.listen(9000, () => console.log('Server is running on port 9000'));