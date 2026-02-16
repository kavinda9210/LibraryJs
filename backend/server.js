const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const adminRoute = require("./admin");
const userManagementRoute = require("./usermanagement");
const itamRoutes = require("./itam"); // ✅ must exist
const authRoutes = require("./auth"); 
const incomeRoutes = require("./income");
const outgoingRoutes = require("./outgoing");

const app = express();
const PORT = 5000;

app.use(cors());
app.options(/.*/, cors());
app.use(bodyParser.json());

app.use("/admin", adminRoute);
app.use("/users", userManagementRoute);
app.use("/itam", itamRoutes); // ✅ THIS ENABLES POST
app.use("/api/auth", authRoutes);
app.use("/income", incomeRoutes);
app.use("/outgoing", outgoingRoutes);

app.listen(PORT, () => {
  console.log("Server running on http://localhost:5000");
  console.log("✅ Auth routes loaded at /api/auth");

});
