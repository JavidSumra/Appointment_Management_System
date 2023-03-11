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

  test("Mark Appointment as Complete", async () => {
    let agent = request.agent(server);
    await login(agent, "javidsumara987@gmail.com", "1234");
    let res = await agent.get("/AddAppointment/:day/:month/:year");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/NewAppointment").send({
      Title: "Interview",
      S_Time: "01:20:00",
      E_Time: "02:20:00",
      app_Date: new Date().toLocaleDateString("en-In"),
      Status: false,
      _csrf: csrfToken,
    });
    let HomePage = await agent
      .get("/Login/Home")
      .set("Accept", "application/json");
    let parseHomePage = JSON.parse(HomePage.text);
    let lengthofAppointment = parseHomePage.list.length;
    let Appointement = parseHomePage.list[lengthofAppointment - 1];
    let Appointmentid = Appointement.id;

    res = await agent.get("/Login/Home");
    csrfToken = extractCsrfToken(res);

    let response = await agent
      .put(`/Update/Appointment/${Appointmentid}`)
      .send({
        _csrf: csrfToken,
      });
    let status = Boolean(response.text);
    expect(status).toBe(true);
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
    const parsedAppointmentsLength = parsedAppointments.list.length;
    let AppointementDetail =
      parsedAppointments.list[parsedAppointmentsLength - 1];
    let Appointmentid = AppointementDetail.id;

    response = await agent.get("/Login/Home");
    csrfToken = extractCsrfToken(response);

    let res = await agent
      .delete(`/Appointment/Delete/${Appointmentid}`)
      .send({ _csrf: csrfToken });
    let status = Boolean(res.text);
    expect(status).toBe(true);
  });

  test("Edit Appointment Title", async () => {
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
    let parsedAppointmentsLength = parsedAppointments.list.length;
    let AppointementDetail =
      parsedAppointments.list[parsedAppointmentsLength - 1];
    let Appointmentid = AppointementDetail.id;

    let res = await agent.get(`/Edit/Appointment/${Appointmentid}`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .get(`/Edit/Appointment/${Appointmentid}`)
      .set("Accept", "application/json");

    parsedAppointments = JSON.parse(res.text);
    Appointmentid = parsedAppointments.getAppointment.id;

    await agent.post(`/modify/Appointment/${Appointmentid}`).send({
      NewTitle: "Event 1",
      _csrf: csrfToken,
    });
    let resp = await agent.get("/Login/Home").set("Accept", "application/json");

    parsedAppointments = JSON.parse(resp.text);
    parsedAppointmentsLength = parsedAppointments.list.length;
    resp = parsedAppointments.list[parsedAppointmentsLength - 1].Title;

    expect(resp).toBe("Event 1");
  });
});
