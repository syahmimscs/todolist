const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true});//localhost

const itemsSchema = {
  name: String
}
const Item = mongoose.model("Item",itemsSchema); // model is capitalise

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List",listSchema);

const workItems = [];

app.get("/", function(req, res) {
  Item.find().then((items)=>{
    if (items.length === 0){
      Item.insertMany(defaultItems).then(()=>{
        console.log('Inserted!');
      }).catch(function(err){
        console.log(err);
      });
      res.redirect("/");
    }else{
    res.render("list", {listTitle: "Today", newListItems: items});
  }
  })
});

app.get("/:pageName",(req,res)=>{
  const pageName = _.capitalize(req.params.pageName); // after the /<pageName>
  
  List.findOne({name:pageName}).then(function(foundList){
    if (!foundList){
      const list = new List({
        name: pageName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+pageName);
  }else{
    res.render("list",{listTitle:foundList.name,newListItems:foundList.items})
  }
  }).catch(function(err){
    console.log(err);
  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const toAdd = new Item({name:itemName});
  
  if (listName === "Today"){
  toAdd.save();
  res.redirect("/");
}else{
  List.findOne({name:listName}).then(function(foundList){
    foundList.items.push(toAdd);
    foundList.save();
    res.redirect("/"+listName);
  })
}

 
});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listTitle;
  if (listTitle === "Today"){
  Item.findByIdAndRemove(checkedItemId).then(()=>{
  console.log("Deleted!")
  }).catch(function(err){
    console.log(err);
  });
  
  res.redirect("/");
}else{
  List.findOneAndUpdate({name:listTitle},{$pull:{items:{_id:checkedItemId}}}).then((foundList)=>{
    res.redirect("/"+listTitle);
  }).catch(function(err){
    console.log(err);
  })
}

})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
