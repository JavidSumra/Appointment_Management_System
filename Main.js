/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

//Importing Dependencies Which is Used With in Project
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyparser = require("body-parser");
const cookieparser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const connectEnsure = require("connect-ensure-login");
const flash = require("connect-flash");
const session = require("express-session");
const csrf = require("tiny-csrf");
const bcrypt = require("bcrypt");
const sequelize = require("sequelize");
// Global Variable
const saltRound = 10;

// InBuilt Module
const path = require("path");

// Modules
const sequelize = require("./models");
const DataTypes = require("sequelize");

const User = require("./models/user")(sequelize, DataTypes);
const Appoitment = require("./models/appoitment")(sequelize, DataTypes);

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

let today = new Date().toLocaleDateString("en-In");
// Get Request
app.get("/", (request, response) => {
  try {
    // console.log(request.session.passport);
    if (request.session.passport) {
      response.redirect("/Login/Home");
    } else {
      response.render("Login", { csrfToken: request.csrfToken() });
    }
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
      let getAppointment = await Appoitment.getAppointmentList(
        request.user.id,
        today
      );
      let list = await Appoitment.getListofAppointment(request.user.id);
      let completedAppointment = await Appoitment.getCompletedAppointment(
        request.user.id
      );
      if (request.accepts("html")) {
        response.render("Home", {
          csrfToken: request.csrfToken(),
          findUser,
          getAppointment,
          completedAppointment,
          today,
          list,
        });
      } else {
        return response.json({
          list,
        });
      }
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

app.get(
  "/AddAppointment/:day/:month/:year",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let UserDetail = request.user;
      let date =
        request.params.day +
        "/" +
        request.params.month +
        "/" +
        request.params.year;
      let getAppointment = await Appoitment.getAppointmentList(
        request.user.id,
        date
      );
      response.render("AddAppointment", {
        csrfToken: request.csrfToken(),
        UserDetail,
        getAppointment,
        date,
      });
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

app.get(
  "/Edit/Appointment/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let getAppointment = await Appoitment.findByPk(request.params.id);
      let findUser = await User.findByPk(request.user.id);
      if (request.accepts("html")) {
        response.render("Edit", {
          csrfToken: request.csrfToken(),
          getAppointment,
          findUser,
          today,
        });
      } else {
        return response.json({
          getAppointment,
        });
      }
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

app.get(
  "/change/NewAppointment/:title/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let AppointmentDetail = await Appoitment.findByPk(request.params.id);
      let NewTitle = request.params.title;
      response.render("changeAppointment", {
        csrfToken: request.csrfToken(),
        AppointmentDetail,
        NewTitle,
      });
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
    }
  }
);

app.get(
  "/recommendation/:id/:title",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let getAppointment = await Appoitment.findByPk(request.params.id);
      let allAppointment = await Appoitment.getAppointmentList(
        request.user.id,
        getAppointment.Appointment_Date
      );
      let timeslot = getTimeSlot(allAppointment, 15);
      let NewTitle = request.params.title;
      console.log(timeslot);
      response.render("Recommend", {
        csrfToken: request.csrfToken(),
        getAppointment,
        timeslot,
        NewTitle,
      });
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
    }
  }
);

app.get("/User/Forgotpass", (request, response) => {
  try {
    response.render("ForgotPass", { csrfToken: request.csrfToken() });
  } catch (error) {
    console.log("Error:" + error);
    response.send(error);
  }
});

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

app.get("*", (request, response) => {
  response.render("error", { csrfToken: request.csrfToken() });
});

// Post Request
app.post("/SignUpUser", async (request, response) => {
  let finduser = await User.getUser(request.body.email);
  if (finduser) {
    request.flash("error", "User Already Exist");
    response.redirect("back");
  } else {
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
  "/NewAppointment",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let todayDate = new Date(request.body.app_Date).toLocaleDateString("en-In");
    let getUser = await Appoitment.getAppointmentList(
      request.user.id,
      todayDate
    );

    let statusStart = true,
      appointmentTitle,
      appoitmentId;
    // console.log(todayDate == today);
    for (let i = 0; i < getUser.length; i++) {
      // console.log("For LOOP");
      // console.log(`${i + 1}:` + request.body.E_Time > getUser[i].Ending);
      if (
        (getUser[i].Starting < request.body.S_Time &&
          request.body.S_Time < getUser[i].Ending) ||
        request.body.E_Time < getUser[i].Ending
      ) {
        statusStart = false;
        appointmentTitle = getUser[i].Title;
        appoitmentId = getUser[i].id;
      }
    }
    try {
      // console.log(statusStart);
      if (statusStart) {
        if (request.body.E_Time > request.body.S_Time) {
          if (request.body.Title.trim().lenght > 4) {
            let addNewAppointment = await Appoitment.create({
              Title: request.body.Title.trim(),
              userId: request.user.id,
              Starting: request.body.S_Time,
              Ending: request.body.E_Time,
              Status: false,
              Appointment_Date: todayDate,
            });
            console.log(addNewAppointment);
            request.flash("success", "Created Successfully");
            response.redirect("/Login/Home");
          } else {
            request.flash("error", "Title Lenght Must Greater Than 4");
            response.redirect("back");
          }
        } else {
          console.log("Not Executed");
          request.flash("error", "Please Enter Valid Time");
          response.redirect("back");
        }
      } else {
        request.flash(
          "error",
          `This Time Slot is Occupieded by ${appointmentTitle}`
        );
        response.redirect(
          `/change/NewAppointment/${request.body.Title.trim().replaceAll(
            " ",
            "_"
          )}/${appoitmentId}`
        );
      }
    } catch (error) {
      console.log("Erorr:" + error);
      response.status(402).send(error);
    }
  }
);

app.post("/Forgotpass", async (request, response) => {
  try {
    if (request.body.password === request.body.conpassword) {
      let userDetail = await User.getUser(request.body.email);
      if (userDetail) {
        let hashPass = await bcrypt.hash(request.body.password, saltRound);
        await userDetail.updatePass(hashPass);
        request.flash("success", "Password Updated Successfully");
        response.redirect("/");
      } else {
        request.flash("error", "User Not Exist");
        response.redirect("back");
      }
    } else {
      request.flash("error", "Password Not Match");
      response.redirect("back");
    }
  } catch (error) {
    console.log("Error:" + error);
    response.send(error);
  }
});
app.post(
  "/modify/Appointment/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let appoitment = await Appoitment.findByPk(request.params.id);
      let AppointmentDetail = await appoitment.UpdateTitle(
        request.body.NewTitle.trim(),
        request.params.id
      );
      console.log(AppointmentDetail);
      request.flash("success", "Title Updated");
      response.redirect("back");
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

app.post(
  "/CreateNewAppointment/:title/:start/:end/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let getDate = await Appoitment.findByPk(request.params.id);
      console.log(getDate.Appointment_Date);
      console.log(request.params.title);
      let NewAppointment = await Appoitment.create({
        Title: request.params.title.replaceAll("_", " "),
        Starting: request.params.start,
        Ending: request.params.end,
        Status: false,
        Appointment_Date: getDate.Appointment_Date,
        userId: request.user.id,
      });
      console.log(NewAppointment);
      request.flash("success", "Created Successfully");
      // response.redirect("/Login/Home");
      response.send(NewAppointment ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
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

app.put(
  "/UpdateNewAppointment/:id/:Title",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let Appointment = await Appoitment.findByPk(request.params.id);
      let title = request.params.Title.replaceAll("_", " ");
      let update = await Appointment.UpdateTitle(title, request.params.id);
      console.log(update);
      if (update ? true : false) {
        request.flash("success", "Successfully Updated");
      }
      return response.send(update ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
    }
  }
);

const getTimeSlot = (Appointment, duration) => {
  let timeslot, time1, time2, timeStart, timeEnd, status;
  if (Appointment.length > 1) {
    for (let i = 0; i < Appointment.length - 1; i++) {
      timeslot = formatTime(
        timestrToSec(Appointment[i + 1].Starting) -
          timestrToSec(Appointment[i].Ending)
      );
      console.log(timeslot);
      if (timeslot.split(":")[1] > duration) {
        console.log(timeslot);
        status = true;
        time1 = Appointment[i + 1].Starting;
        time2 = `00:01:00`;
        timeEnd = formatTime(timestrToSec(time1) - timestrToSec(time2));
        console.log(timeEnd);
        time1 = Appointment[i].Ending;
        time2 = "00:01:00";
        timeStart = formatTime(timestrToSec(time1) + timestrToSec(time2));
        console.log(timeStart);
        return { timeStart, timeEnd };
      }
    }
    if (!status) {
      time1 = Appointment[Appointment.length - 1].Ending;
      time2 = `00:${duration}:00`;
      timeEnd = formatTime(timestrToSec(time1) + timestrToSec(time2));
      console.log(timeEnd);
      time1 = Appointment[Appointment.length - 1].Ending;
      time2 = "00:01:00";
      timeStart = formatTime(timestrToSec(time1) + timestrToSec(time2));
      console.log(timeStart);
      return { timeStart, timeEnd };
    }
  } else {
    time1 = Appointment[0].Ending;
    time2 = `00:${duration}:00`;
    timeEnd = formatTime(timestrToSec(time1) + timestrToSec(time2));
    console.log(timeEnd);
    time1 = Appointment[0].Ending;
    time2 = "00:01:00";
    timeStart = formatTime(timestrToSec(time1) + timestrToSec(time2));
    console.log(timeStart);
    return { timeStart, timeEnd };
  }
};

function timestrToSec(timestr) {
  var parts = timestr.split(":");
  return parts[0] * 3600 + parts[1] * 60 + +parts[2];
}

function pad(num) {
  if (num < 10) {
    return "0" + num;
  } else {
    return "" + num;
  }
}

function formatTime(seconds) {
  return [
    pad(Math.floor(seconds / 3600)),
    pad(Math.floor(seconds / 60) % 60),
    pad(seconds % 60),
  ].join(":");
}
module.exports = app;
