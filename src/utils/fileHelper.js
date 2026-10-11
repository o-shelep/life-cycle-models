const fs = require('fs');
const path = require('path');

function deleteFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '../../uploads/books', filename);
  fs.unlink(filePath, () => {});
}

module.exports = { deleteFile };
