const aws = require("aws-sdk");
const config = require("../server/config");

aws.config.update(config);
const s3 = new aws.S3();

export function start(filechunk, bucket, key) {
  var params = {
    Body: filechunk,
    Bucket: bucket,
    Key: key
  };
  return s3.putObject(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return { status: "error" };
    } else {
      return { status: "done" };
    }
  });
}

function uplaod() {}

function finish() {}
