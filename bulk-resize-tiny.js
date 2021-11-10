const { readdirSync } = require('fs')
const tinify = require('tinify');

/**
 * Get all subdirectories in the specified directory.
 */
const getDirectories = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

/**
 * Get all files in the specified directory.
 */
const getFiles = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

/**
 * Add a @x modifier to an image name.
 */
const addModifier = (image, modifier) => image.replace(/(\.[\w\d_-]+)$/i, `@${modifier}$1`);

/**
 * Upload an image file to TinyPNG, resize it, and download it.
 */
function tinifyResizeFile(source, options, destination) {
  console.log(`From ${source}`);
  console.log(`Options: ${options}`);
  console.log(`To ${destination}`);
  console.log('\n');

  const tinifySource = tinify.fromFile(source);
  const tinifyResized = tinifySource.resize(options);
  tinifyResized.toFile(destination, function (err) {
    console.error(err.message);
  });
}

/**
 * Tinify-resize all image files in a workdir subdirectory, with the specified modifier and size.
 */
function tinifyResizeFiles(dir, files, modifier, size) {
  const tinifyOptions = {
    method: "scale",
  };
  switch (size[0]) {
    case 'w':
      tinifyOptions.width = parseInt(size.substring(1));
      break;
    case 'h':
      tinifyOptions.height = parseInt(size.substring(1));
      break;
  }

  files.forEach(filename => {
    const source = `${dir}/${filename}`;
    const filenameMod = modifier ? addModifier(filename, modifier) : filename;
    const destination = `${dir}/output/${filenameMod}`;
    tinifyResizeFile(source, tinifyOptions, destination);
  });
}

/**
 * Parse a workdir subdirectory: get the (re)size options from the subdirectory name, and
 * tinify-resize all files in the subdirectory.
 */

function parseWorkdirSubdirectory(dirname) {
  const dir = `workdir/${dirname}`;
  const files = getFiles(dir);

  const imgSizes = dirname.split(',');
  imgSizes.forEach(imgSize => {
    const imgSizeData = imgSize.split('-');
    tinifyResizeFiles(dir, files, imgSizeData[0], imgSizeData[1]);
  });
}

// Read the TinyPNG API key from a .tinypng in the current directory
tinify.key = fs.readFileSync('.tinypng', 'utf8').trim();

// Parse the workdir subdirectories to tinify-resize
const workdirs = getDirectories('workdir');
workdirs.forEach(dirname => {
  parseWorkdirSubdirectory(dirname);
});

// Output the number of compressions you have made this month
console.log(`Compressions this month: ${tinify.compressionCount}`);