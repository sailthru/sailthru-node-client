var fs = require('fs');

function File(path, filename, contentType) {
  this.buffer = fs.readFileSync(path);;
  this.filename = filename || this._basename(path);
  this.content_type = contentType || "application/octet-stream";
}

File.prototype._basename = function (path) {
  var parts = path.split(/\/|\\/);
  return parts[parts.length - 1];
};

exports.file = function (path, filename, fileSize, encoding, contentType) {
  return new File(path, filename, fileSize, encoding, contentType);
};
