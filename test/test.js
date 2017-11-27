require("../config/connection");
const request = require("request");
const cheerio = require("cheerio");
const Article = require("../models/article");
const Comment = require("../models/comment");

console.log("here");
console.log(Article.find({ title: "How to Cook Turkey" }));
