require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ========== DATABASE ===========
userName = process.env.USER_NAME;
userPwd = process.env.USER_PASSWORD;
mongoose.connect(`mongodb+srv://${userName}:${userPwd}@cluster0.6xgc3mh.mongodb.net/todolistDB`)
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((err) => {
    console.log("Failed to connect. Error:");
    console.log(err);
  })


const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemsSchema);

// ========== GET ===========
app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) =>{
      res.render("list", { listTitle: "Home", newListItem: foundItems });
    })
    .catch(err => console.log(err));
});

// Custom list display/creation
app.get("/:listName", async (req, res) => {
  const customListName = _.capitalize(req.params.listName);

  await List.findOne({name: customListName}).exec().then((result) => {
    if (result){

        res.render("list", {listTitle: customListName, newListItem: result.items});

    } else {

      const list = new List({
        name: customListName,
        item: []

      });

      List.insertMany([list])
        .then(() => console.log("success"))
        .catch(err => console.log(err));
      console.log(customListName + " list created.");
      res.redirect("/" + customListName);
    }
  })

  .catch(err => console.log(err));
});


app.get("/about", (req, res) => {
  res.render("about");
});

// ========== POST ===========
app.post("/", async (req, res) => {
  const newItem = {
    name: req.body.addItem
  }

  const listName = req.body.list;

  if (listName === "Home"){
    Item.insertMany([newItem]);
    res.redirect("/");
  } else {
    await List.findOne({name: listName}).exec()
      .then((foundList) =>{
        foundList.items.push(newItem);
        foundList.save();
      })
      .catch(err => console.log(err));

      res.redirect("/" + listName);
  }
});

// delete
app.post("/delete", async (req, res) => {
  const itemId = req.body.deleteItem;
  const listName = req.body.listName;

  // default list delete
  if (listName === "Home") {
      await Item.findByIdAndRemove(itemId)
      .then(() => {console.log("Item Deleted")})
      .catch((err) => {
        console.log(err);
      });

    res.redirect("/");
  } else {
    // custome list delete
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}).exec()
    .then(() => {
      res.redirect("/" + listName);
    })
    .catch(err => console.log(err));
  }

});


app.listen(port, () => {
  console.log("App running on port " + port);
});
