const express = require("express")
const multer=require("multer")
const path=require("path")
const app = express()
const fs = require('fs')
const cookieParser=require("cookie-parser")
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"/views"));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the destination folder where the uploaded files will be stored
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    // Specify the filename of the uploaded file
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
    fs.readFile("./products.json", "utf-8", (err, dt) => {
        if (err) return res.send()
        let data = JSON.parse(dt)
        res.render("homepage",{products:data})
    })
})

app.get("/details", (req, res) => {
    fs.readFile("./products.json", "utf-8", (err, dt) => {
        if (err) return res.redirect("/")
        let data = JSON.parse(dt)
        let product = data.filter((prdt) => prdt.title == req.query.name)
        let relatedProducts = data.filter((prdt) => prdt.title != req.query.name)
        res.render("details",{product:product[0],relatedProducts})
    })
})

app.post("/edit/:item", (req, res) => {
    fs.readFile("./products.json", "utf-8", (err, dt) => {
        if (err) return res.redirect("/adminPanel")
        let data = JSON.parse(dt)
        let product = data.filter((item) =>item.title==req.params.item)
        let otherProducts = data.filter((item) => item.title != req.params.item)
        if (req.body.description) product[0].description = req.body.description;
        if (req.body.price) product[0].price = req.body.price;
        if (req.body.title) product[0].title = req.body.title;
        otherProducts.push(product[0])
        fs.writeFile("./products.json", JSON.stringify(otherProducts), () => {
            res.redirect("/adminPanel")
        })
    })
})

app.get("/terms", (req, res) => {
    res.render("Terms")
})

app.get("/about", (req, res) => {
    res.render("About")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/adminLogin", (req, res) => {
    fs.readFile("./admin.json","utf-8",(err,data) => {
        if (err) return res.json()
        let admin = JSON.parse(data)
        if (admin.username == req.body.username && admin.password == req.body.password) {
            res.cookie("admin", "theLegend", {
              httpOnly: true,
              maxAge: 30 * 24 * 60 * 60*1000,
            });
            res.redirect("/adminPanel")
        } else {
            res.redirect("/login")
        }
    })
})

app.get("/faqs", (req, res) => {
    res.render("Faqs")
})

app.get("/adminPanel", (req, res, next) => {
    if (req.cookies.admin) {
        next()
    } else {
        res.redirect("/login")
    }
},(req, res) => {
    fs.readFile("./products.json", "utf-8", (err, data) => {
        if (err) res.redirect("/")
        let products = JSON.parse(data)
        res.render("AdminPanel",{products})
    })
})

app.post("/delete", (req, res,next) => {
    if (req.cookies.admin) {
        next()
    } else {
        res.redirect("/")
    }
}, (req, res) => {
    fs.readFile("./products.json", "utf-8", (err, dt) => {
        if (err) res.send()
        let data = JSON.parse(dt)
        let filteredData = data.filter((product) => product.title != req.query.name)
        fs.writeFile("./products.json",JSON.stringify(filteredData), () => {
            res.redirect("/adminPanel")
        })
    })
})

app.post("/add",upload.single("image"),(req, res, next) => {
    if (req.cookies.admin) {
        next()
    } else {
        res.redirect("/")
    }
}, (req, res) => { 
        fs.readFile("./products.json", "utf-8", (err, dt) => {
            if (err) res.send();
            let newProduct = {}
            newProduct.title = req.body.title.trim();
            newProduct.url = "/"+req.file.filename;
            newProduct.description = req.body.description;
            newProduct.price = req.body.price;
            let data = JSON.parse(dt);
            data.push(newProduct)
          fs.writeFile("./products.json", JSON.stringify(data), () => {
            res.redirect("/adminPanel");
          });
        });
})

app.get("*", (req, res) => {
    res.render("NotFound")
})

app.listen(3000, () => {
    console.log("server running at port 3000");
})