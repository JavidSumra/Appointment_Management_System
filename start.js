/* eslint-disable no-undef */
const Port = 3000 || process.env.PORT,
  app = require("./Main");

app.listen(Port, () => {
  console.log(`Server Started\nPort Number ${Port}`);
});
