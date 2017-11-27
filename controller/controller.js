const express = require("express");
const router = express.Router();
require("../config/connection");
const request = require("request");
const cheerio = require("cheerio");
const Article = require("../models/article");
const Comment = require("../models/comment");

//Website we will be scraping news from
const target = "https://www.nytimes.com/section/technology";

//Route for home page using Handlebars
router.get("/", function(req, res) {
  Article.find({ saved: false }).exec(function(err, data) {
    let hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

//Route for saved page using Handlebars
router.get("/saved", function(req, res) {
  Article.find({ saved: true })
    .populate("comments")
    .exec(function(err, data) {
      if (err) throw err;
      else {
        let hbsObject = {
          article: data
        };
        console.log(hbsObject);
        res.render("saved", hbsObject);
      }
    });
});

//Route to scrape website for news
router.get("/scrape", function(req, res) {
  console.log("scrape");
  request(target, function(err, response, body) {
    if (!err && response.statusCode === 200) {
      let $ = cheerio.load(body);

      //Grabs data from each <article> to save in our DB
      $("article").each(function(index, article) {
        let results = {};
        results.link = $(this)
          .children("div")
          .children("h2")
          .children("a")
          .attr("href");
        results.title = $(this)
          .children("div")
          .children("h2")
          .text();
        results.summary = $(this)
          .children("div")
          .children(".summary")
          .text();
        if (results.link) console.log(results);
        let newArticle = new Article(results);
        if (results.link)
          newArticle.save(function(err, doc) {
            if (err) throw err;
            else console.log(doc);
          });
      });
    }
    res.send("Scrape Complete");
  });
});

//Route to get all articles from DB
router.get("/articles", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  });
});

//Route for grabbing specific articles and their comments
router.get("/articles/:id", function(req, res) {
  Article.findOne({ _id: req.params.id })
    .populate("note")
    .exec(function(err, doc) {
      if (err) console.log(err);
      else {
        res.json(doc);
      }
    });
});

//Route to save an article
router.post("/articles/saved/:id", function(req, res) {
  Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }).exec(
    function(err, doc) {
      if (err) console.log(err);
      else {
        res.send(doc);
      }
    }
  );
});

//Route to delete article from saved
router.post("/articles/delete/:id", function(req, res) {
  Article.findOneAndUpdate(
    { _id: req.params.id },
    { saved: false, comments: [] }
  ).exec(function(err, doc) {
    if (err) console.log(err);
    else {
      res.send(doc);
    }
  });
});

//Route to save a comment
router.post("/comment/save/:id", function(req, res) {
  let newComment = new Comment({
    body: req.body.text,
    article: req.params.id
  });
  newComment.save(function(err, comment) {
    if (err) console.log(err);
    else {
      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comments: comment } }
      ).exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.send(comment);
        }
      });
    }
  });
});

//Route to delete a comment
router.delete("/comment/delete/:comment_id/:article_id", function(req, res) {
  Comment.findOneAndRemove({ _id: req.params.comment_id }).exec(function(err) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      Article.findOneAndUpdate(
        { _id: req.params.article_id },
        { $pull: { comment: req.params.comment_id } }
      ).exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.send("Comment Deleted");
        }
      });
    }
  });
});

module.exports = router;
