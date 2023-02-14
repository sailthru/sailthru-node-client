var fs = require("fs");

function MultipartFile(path, filename, contentType) {
  this.buffer = fs.readFileSync(path);
  this.filename = filename || this._basename(path);
  this.content_type = contentType || "application/octet-stream";
}

MultipartFile.prototype._basename = function (path) {
  var parts = path.split(/\/|\\/);
  return parts[parts.length - 1];
};

exports.file = function (path, filename, contentType) {
  return new MultipartFile(path, filename, contentType);
};
