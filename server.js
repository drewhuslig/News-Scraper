//Set up our express app
//Testing this out
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

app.use(express.static("public"));

const path = require('path');
const exphbs = require("express-handlebars");
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
  })
);
app.set("view engine", "handlebars");

const routes = require("./controller/controller.js");
app.use('/', routes);

app.listen(PORT, function() {
  console.log("App listening on PORT: " + PORT);
});
