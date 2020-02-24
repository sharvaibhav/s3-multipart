export default class MultipartUploader {
  PART_SIZE = 5 * 1024 * 1024; // Minimum part size defined by aws s3 is 5 MB, maximum 5 GB
  file = null;
  fileName = "";
  fileType = "";
  fileSize = "";
  fileLastModifiedDate = "";
  lastUploadedSize = [];
  lastUploadedTime = [];
  startLocation = "";
  chunkLocation = "";
  endLocation = "";
  uploadId = null;
  partNum = 0;
  multipartMap = {
    Parts: []
  };
  startTime = null;

  constructor(file, startLocation, chunkLocation, endLocation, bucket) {
    this.file = file;
    this.fileName = file.name;
    this.fileType = file.type;
    this.fileSize = file.size;
    this.fileLastModifiedDate = file.lastModifiedDate;
    this.bucket = bucket;
    this.startLocation = startLocation;
    this.chunkLocation = chunkLocation;
    this.endLocation = endLocation;
  }

  // async multiPartUploadForMultipleFiles() {
  //   const responses = [];
  //   if (this.files.length > 1) {
  //     for (let j = 0; j < this.files.length; j++) {
  //       this.file = this.files[j];
  //       this.partNum = 0;
  //       const res = await this.startMultipart();
  //       responses.push(res);
  //     }
  //     return new Promise((resolve, reject) =>
  //       resolve("The files have been uplaoded" + responses)
  //     );
  //   } else {
  //     return this.startMultipart();
  //   }
  // }

  async startMultipart() {
    const fd = new FormData();
    fd.append("file", this.file);
    fd.append("Key", this.file.name);
    fd.append("Bucket", this.bucket);
    const params = {
      method: "POST",
      body: fd
    };
    this.startTime = new Date();
    try {
      const res = await fetch(this.startLocation, params);
      const response = await res.json();
      this.uploadId = response.UploadId;
    } catch (err) {
      return new Promise((resolve, reject) =>
        reject("Multipart could not start : " + err)
      );
    }
    try {
      const responseChunks = await this.uploadChunks();
      console.log("chunks uplaoded", responseChunks);
    } catch (err) {
      return new Promise((resolve, reject) =>
        reject("Multipart could not upload the chunks : " + err)
      );
    }

    try {
      const finalRes = await this.finishUpload();
      console.log("chunks upload finished", finalRes);
      return finalRes;
    } catch (err) {
      return new Promise((resolve, reject) =>
        reject("Multipart could not finish the chunks upload : ", err)
      );
    }
  }

  async uploadChunks() {
    for (
      let rangeStart = 0;
      rangeStart < this.file.size;
      rangeStart += this.PART_SIZE
    ) {
      this.partNum++;
      var end = Math.min(rangeStart + this.PART_SIZE, this.file.size);
      const fd = new FormData();
      const fileChunk = this.file.slice(rangeStart, end);
      fd.append("filechunk", fileChunk);
      fd.append("Bucket", this.bucket);
      fd.append("key", this.file.name);
      fd.append("PartNumber", String(this.partNum));
      fd.append("UploadId", String(this.uploadId));
      fd.append("size", fileChunk.size);
      const params = {
        body: fd,
        method: "POST"
      };
      try {
        const response = await fetch(this.chunkLocation, params);
        const jsonResponse = await response.json();
        this.multipartMap.Parts[this.partNum - 1] = {
          ETag: jsonResponse.mData.ETag,
          PartNumber: this.partNum
        };
      } catch (err) {
        console.log("the chunk didnt uploaded", err);
      }
    }
    return new Promise((resolve, reject) => resolve("the chunks are uplaoded"));
  }

  async finishUpload() {
    const fd = new FormData();
    fd.append("Bucket", this.bucket);
    fd.append("key", this.file.name);
    fd.append("MultipartUpload", JSON.stringify(this.multipartMap));
    fd.append("UploadId", String(this.uploadId));
    fd.append("startTime", this.startTime);

    const params = {
      body: fd,
      method: "POST"
    };

    const response = await fetch(this.endLocation, params);
    const jsonResponse = await response.json();
    return new Promise((resolve, reject) => resolve(jsonResponse));
  }
}
