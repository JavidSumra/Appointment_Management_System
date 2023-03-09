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

const { request, response } = require("express");
// InBuilt Module
const path = require("path");

// Modules
const { sequelize } = require("./models"),
  DataTypes = require("sequelize");

const User = require("./models/user")(sequelize, DataTypes),
  Appoitment = require("./models/appointment")(sequelize, DataTypes);

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

app.get(
  "/Login/Home",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let findUser = await User.findByPk(request.user.id);
      let getAppointment = await Appoitment.getAppointmentList(request.user.id);
      let completedAppointment = await Appoitment.getCompletedAppointment(
        request.user.id
      );
      console.log(getAppointment);
      console.log(findUser);
      response.render("Home", {
        csrfToken: request.csrfToken(),
        findUser,
        getAppointment,
        completedAppointment,
      });
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

app.get(
  "/AddAppointment",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let UserDetail = request.user;
      let getAppointment = await Appoitment.getAppointmentList(request.user.id);
      response.render("AddAppointment", {
        csrfToken: request.csrfToken(),
        UserDetail,
        getAppointment,
      });
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);
app.get(
  "/Signout",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  (request, response) => {
    try {
      request.logout((err) => {
        if (err) {
          return next(err);
        }
        request.flash("success", "Signout Successfully");
        response.redirect("/");
      });
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);
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
      return response.redirect("/Login/Home");
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
      response.redirect("/Login/Home");
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
    }
  }
);

app.post(
  "/NewAppointment/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log(request.body);
      console.log(request.params.id);

      if (request.body.S_Time != request.body.E_Time) {
        let addNewAppointment = await Appoitment.create({
          Title: request.body.title,
          userId: request.user.id,
          Starting: request.body.S_Time,
          Ending: request.body.E_Time,
          Status: false,
          Appintment_Date: request.body.Date,
        });
        console.log(addNewAppointment);
        request.flash("success", "Created Successfully");
        response.redirect("/Login/Home");
      } else {
        request.flash("error", "Please Enter Different Time");
        response.redirect("back");
      }
    } catch (error) {
      console.log("Erorr:" + error);
      response.status(402).send(error);
    }
  }
);

// Delete Request

app.delete(
  "/Appointment/Delete/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let deleteAppointment = await Appoitment.removeAppointment(
        request.params.id,
        request.user.id
      );
      // console.log(deleteAppointment ? true : false);
      if (deleteAppointment ? true : false) {
        request.flash("success", "Successfully Deleted");
      } else {
        request.flash("error", "Failed To Delete");
      }
      return response.send(deleteAppointment ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

// Put Request

app.put(
  "/Update/Appointment/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    const updateAppointment = await Appoitment.findByPk(request.params.id);
    try {
      let Status = !updateAppointment.Status;
      let NewAppointmentStatus = await updateAppointment.UpdateAppointment(
        Status
      );
      console.log(NewAppointmentStatus);
      if (NewAppointmentStatus ? true : false) {
        request.flash("success", "Successfully Updated");
      }
      return response.send(NewAppointmentStatus ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

module.exports = app;
