const express = require("express");
const router = express.Router();
const aws = require("aws-sdk");

const upload = require("./services/file-upload");
const uploadChunk = require("./services/file-upload");

const singleUpload = upload.single("file");
const singleChunkUpload = uploadChunk.single("filechunk");

const config = require("./config");

aws.config.update(config);

const s3 = new aws.S3();

router.post("/upload", singleUpload, function(req, res) {
  var params = {
    Body: req.file.buffer,
    Bucket: "node-vaibhav-bucket",
    Key: req.file.originalname
  };
  s3.putObject(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      res.json({ status: "error" });
    } else {
      res.json({ status: "done" });
    }
  });
});

router.post("/multipartstart", singleUpload, function(req, res, next) {
  var params = {
    Bucket: "node-vaibhav-bucket",
    Key: req.file.originalname
  };
  s3.createMultipartUpload(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return next(err);
    } else {
      console.log(data);
      return res.json(data);
    }
  });
});

router.post("/chunkupload", singleChunkUpload, function(req, res, next) {
  let tryNum = 1;
  const maxTries = 3;
  console.log("lets check stuff");
  const partParams = {
    Body: req.file.buffer,
    Bucket: req.body.Bucket,
    Key: req.body.key,
    PartNumber: req.body.PartNumber,
    UploadId: req.body.UploadId
  };
  function uploadPart(partParams, tryNum, maxTries) {
    s3.uploadPart(partParams, function(multiErr, mData) {
      if (multiErr) {
        console.log("multiErr, upload part error:", multiErr);
        console.log("Failed uploading part: #", partParams.PartNumber);
        if (tryNum < maxTries) {
          console.log("Retrying upload of part: #", partParams.PartNumber);
          uploadPart(partParams, tryNum + 1, maxTries);
        } else {
          console.log("Failed uploading part: #", partParams.PartNumber);
        }
        return;
      }
      console.log("Completed part", this.request.params.PartNumber);
      console.log("mData", mData);
      return res.json({ hello: "hello", mData: mData });
    });
  }
  uploadPart(partParams, tryNum + 1, maxTries);
});

router.post("/finishupload", singleChunkUpload, function(req, res) {
  console.log("chunk upload -- the size is ", req.body.size);
  const doneParams = {
    Bucket: req.body.Bucket,
    Key: req.body.key,
    MultipartUpload: JSON.parse(req.body.MultipartUpload),
    UploadId: req.body.UploadId
  };
  s3.completeMultipartUpload(doneParams, function(err, data) {
    if (err) {
      console.log("An error occurred while completing the multipart upload");
      console.log(err);
      return res.status(400).json({ error: err });
    } else {
      var delta = (new Date() - req.body.startTime) / 1000;
      console.log("Completed upload in", delta, "seconds");
      console.log("Final upload data:", data);
      return res.json({ status: "file uploaded correctly" });
    }
  });
});

module.exports = router;
