class File {
  constructor(path, filename, fileSize, encoding, contentType) {
    this.path = path;
    this.filename = filename || this._basename(path);
    this.fileSize = fileSize;
    this.encoding = encoding || "binary";
    this.contentType = contentType || "application/octet-stream";
  }

  _basename(path) {
    var parts = path.split(/\/|\\/);
    return parts[parts.length - 1];
  }
}

exports.file = function (path, filename, fileSize, encoding, contentType) {
  return new File(path, filename, fileSize, encoding, contentType);
};
