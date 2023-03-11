const request = require("supertest");
var chherio = require("cheerio");
const db = require("../models/index");
const app = require("../Main");

let server, agent;

function extractCsrfToken(res) {
  var $ = chherio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/AdminLogin").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Appointement Management Test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3005, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Signup", async () => {
    let res = await agent.get("/Signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/SignUpUser").send({
      fname: "Javid",
      email: "javidsumara987@gmail.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Signout", async () => {
    let res = await agent.get("/Login/Home");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/Signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/Login/Home");
    expect(res.statusCode).toBe(302);
  });
  test("Login", async () => {
    await login(agent, "javidsumara987@gmail.com", "1234");
    const res = await agent.get("/Login/Home");
    expect(res.statusCode).toBe(200);
  });
  test("Create New Appointment", async () => {
    let agent = request.agent(server);
    await login(agent, "javidsumara987@gmail.com", "1234");
    let res = await agent.get("/AddAppointment/:day/:month/:year");
    const csrfToken = extractCsrfToken(res);
    let response = await agent.post("/NewAppointment").send({
      Title: "Interview",
      S_Time: "01:20:00",
      E_Time: "02:20:00",
      app_Date: new Date().toLocaleDateString("en-In"),
      Status: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Delete Appointment", async () => {
    let agent = request.agent(server);
    await login(agent, "javidsumara987@gmail.com", "1234");
    let response = await agent.get("/AddAppointment/:day/:month/:year");
    let csrfToken = extractCsrfToken(response);
    await agent.post("/NewAppointment").send({
      Title: "Interview",
      S_Time: "01:20:00",
      E_Time: "02:20:00",
      app_Date: new Date().toLocaleDateString("en-In"),
      Status: false,
      _csrf: csrfToken,
    });

    let getAppointmentPage = await agent
      .get("/Login/Home")
      .set("Accept", "application/json");
    let parsedAppointments = JSON.parse(getAppointmentPage.text);
    console.log(parsedAppointments);
    console.log(parsedAppointments.getAppointment);
    const parsedAppointmentsLength = parsedAppointments.getAppointment.length;
    console.log(parsedAppointmentsLength);
    let AppointementDetail =
      parsedAppointments.getAppointment[parsedAppointmentsLength - 1];
    let Appointmentid = AppointementDetail.id;

    response = await agent.get("/Login/Home");
    csrfToken = extractCsrfToken(response);

    let res = await agent
      .delete(`/Appointment/Delete/${Appointmentid}`)
      .send({ _csrf: csrfToken });
    let status = Boolean(res.text);
    expect(status).toBe(true);
  });

  //   test("Edit Appointment", async () => {
  //     let agent = request.agent(server);
  //     await login(agent, "javidsumara987@gmail.com", "1234");
  //     let response = await agent.get("/Edit/Appointment/:id");
  //     let csrfToken = extractCsrfToken(response);
  //     await agent.post("/modify/Appointment/:id").send({
  //       New_Title: "Interview 2",
  //     });
  //   });
});
