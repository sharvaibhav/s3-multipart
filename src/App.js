import React from "react";
import MultipartUploader from "./MultipartPartUploader";
import "./App.css";

const bucketName = "node-vaibhav-bucket";
const startApi = "/api/v1/file/multipartstart";
const uploadApi = "/api/v1/file/chunkupload";
const finishApi = "/api/v1/file/finishupload";

function App() {
  const uploadMultipart = () => {
    const file = document.getElementById("file-element");
    // const multipartPartUploader = new MultipartUploader(
    //   file.files,
    //   startApi,
    //   uploadApi,
    //   finishApi,
    //   bucketName
    // );
    // const res = multipartPartUploader.multiPartUploadForMultipleFiles().then(
    //   data => console.log(data),
    //   err => console.log(err)
    // );

    if (file.files.length > 1) {
      for (let j = 0; j < file.files.length; j++) {
        const multipartPartUploader = new MultipartUploader(
          file.files[j],
          startApi,
          uploadApi,
          finishApi,
          bucketName
        );
        const res = multipartPartUploader.startMultipart().then(
          data => console.log(data),
          err => console.log(err)
        );
      }
    } else {
      const multipartPartUploader = new MultipartUploader(
        file.files[0],
        startApi,
        uploadApi,
        finishApi,
        bucketName
      );
      const res = multipartPartUploader.startMultipart().then(
        data => console.log(data),
        err => console.log(err)
      );
    }
  };
  return (
    <div className="App">
      <h2>File upload from here</h2>
      <input
        type="file"
        name="file-ele"
        id="file-element"
        multiple="multiple"
      />
      <button onClick={uploadMultipart}>Upload</button>
    </div>
  );
}

export default App;
