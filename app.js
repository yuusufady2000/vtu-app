
require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const cookieParser = require("cookie-parser");
const path = require("path");
const { csrfSync } = require("csrf-sync");
const flash = require("connect-flash");

const User = require("./models/user");
const auth = require("./routes/auth");
const errorController = require("./controllers/error");
const shopRoutes = require("./routes/shopRoutes");

const PORT = process.env.PORT || 3000;

if (
    !MONGODB_URL ||
    !process.env.SESSION_SECRET ||
    !process.env.CSRF_SECRET
) {
    throw new Error("Missing environment variables");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

const store = MongoStore.create({
    mongoUrl: MONGODB_URL,
    collectionName: "sessions"
});

app.use(session({
    name: "zeal.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    rolling: true,
    cookie: {
        maxAge: 20 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    }
}));

app.use(flash());

const {
    generateToken,
    csrfSynchronisedProtection
} = csrfSync({
    getTokenFromRequest: req => req.body?._csrf,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"]
});

app.use((req, res, next) => {
    console.log("SESSION DEBUG:", {
        method: req.method,
        path: req.path,
        hasCookie: Boolean(req.headers.cookie),
        hasSessionCookie: Boolean(req.headers.cookie?.includes("zeal.sid=")),
        sessionID: req.sessionID,
        nodeEnv: process.env.NODE_ENV
    });

    next();
});

app.use(csrfSynchronisedProtection);

app.use((req, res, next) => {
    if (!req.session.user?._id) {
        return next();
    }

    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(next);
});

app.use((req, res, next) => {
    res.locals.csrfToken = generateToken(req);
    res.locals.isAuthenticated = !!req.session.isLoggedIn;
    res.locals.user = req.user || null;
    next();
});

app.use(auth);
app.use(shopRoutes);

app.get("/", (req, res) => {
    res.redirect("/login");
});

app.use(errorController.error);

mongoose.connect(MONGODB_URL)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(PORT, "0.0.0.0", () => {
        });
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });
