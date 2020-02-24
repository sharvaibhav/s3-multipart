const express = require("express");
const app = express();
const PORT = process.env.PORT || "3001";

const fileUploadRoute = require("./file-upload");

app.use("/api/v1/file", fileUploadRoute);

app.use(express.static("build"));

app.listen(PORT, function() {
  console.log("Node server started on port " + PORT);
});
