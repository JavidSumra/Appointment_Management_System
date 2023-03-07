/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
//Importing Dependencies Which is Used With in Project
const express = require("express"),
  app = express(),
  ejs = require("ejs"),
  bodyparser = require("body-parser"),
  cookieparser = require("cookie-parser"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  connectEnsure = require("connect-ensure-login"),
  flash = require("connect-flash"),
  session = require("express-session"),
  csrf = require("tiny-csrf"),
  bcrypt = require("bcrypt");

// Global Variable
const saltRound = 10;

// InBuilt Module
const path = require("path");

// Modules
const { sequelize } = require("./models"),
  DataTypes = require("sequelize");

const User = require("./models/user")(sequelize, DataTypes);

// Setup View Engine And Path of Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname + "/views"));

// Middleware
app.use(bodyparser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieparser("This_is_My_Secret_String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(flash());

app.use(
  session({
    secret: "This_is_Super_Secret_Key_2021095900025026",
    cookie: {
      maxAge: 60 * 60 * 24 * 1000, //24 Hours
    },
  })
);

// To Authenticate User I use Passport libraby
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({
        where: {
          email: username,
        },
      })
        .then(async function (user) {
          if (user) {
            const resultantPass = await bcrypt.compare(password, user.password);
            if (resultantPass) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid Password" });
            }
          } else {
            return done(null, false, { message: "User Does Not Exist" });
          }
        })
        .catch((error) => {
          console.log(error);
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serealizing User in Session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use(function (request, response, next) {
  const Message = request.flash();
  response.locals.messages = Message;
  next();
});

// Get Request
app.get("/", (request, response) => {
  try {
    response.render("Login", { csrfToken: request.csrfToken() });
  } catch (error) {
    console.log("Error:" + error);
    response.status(402).send(error);
  }
});

app.get("/Signup", (request, response) => {
  try {
    response.render("Signup", { csrfToken: request.csrfToken() });
  } catch (error) {
    console.log("Error:" + error);
    response.status(402).send(error);
  }
});

// Post Request
app.post("/SignUpUser", async (request, response) => {
  try {
    console.log(request.body);
    const HashPassword = await bcrypt.hash(request.body.password, saltRound);
    let UserDetail = await User.create({
      firstName: request.body.fname,
      email: request.body.email,
      password: HashPassword,
    });
    console.log(UserDetail);
    request.flash("success", "User Created Successfully");
    request.login(UserDetail, (err) => {
      if (err) {
        console.log(err);
      }
      request.flash("success", "User Suceessfully Created");
      return response.redirect("/");
    });
  } catch (error) {
    console.log(error);
    response.status(402).send(error);
  }
});

app.post(
  "/AdminLogin",
  passport.authenticate("local", { failureFlash: true, failureRedirect: "/" }),
  (request, response) => {
    try {
      response.redirect("/");
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
    }
  }
);

module.exports = app;
