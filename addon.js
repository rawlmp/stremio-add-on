const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const manifest = require('./manifest');

const URL_DATASET =
  'https://raw.githubusercontent.com/rawlmp/stremio-add-on/master/dataset.json';
const METAHUB_URL = 'https://images.metahub.space';

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(defineCatalog);
builder.defineStreamHandler(createStream);

async function createStream(args) {
  let file = await axios.get(URL_DATASET);
  let dataset = file.data;

  if (dataset[args.id]) {
    defineCatalog();
    return Promise.resolve({ streams: [dataset[args.id]] });
  } else {
    return Promise.resolve({ streams: [] });
  }
}

const generateMetaPreview = function(value, key) {
  const imdbId = key.split(':')[0];
  return {
    id: imdbId,
    type: value.type,
    name: value.name,
    poster: METAHUB_URL + '/poster/medium/' + imdbId + '/img'
  };
};

async function defineCatalog(args, cb) {
  let file = await axios.get(URL_DATASET);
  let dataset = file.data;

  const metas = Object.entries(dataset)
    .filter(([_, value]) => value.type === args.type)
    .map(([key, value]) => generateMetaPreview(value, key));

  return Promise.resolve({ metas: metas });
}

module.exports = builder.getInterface();
