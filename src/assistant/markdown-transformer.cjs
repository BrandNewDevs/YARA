const upstream = require('@expo/metro-config/babel-transformer');
module.exports.transform = function (args) {
  if (/\.(md|jsonl)$/.test(args.filename)) {
    return upstream.transform({ ...args, src: `export default ${JSON.stringify(args.src)};` });
  }
  return upstream.transform(args);
};
