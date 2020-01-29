const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');

const manifest = {
  id: 'org.stremio.helloworld',
  version: '1.0.0',

  name: 'Rawl Movies',
  description: 'Por fin películas en español!!!',
  logo: 'https://www.stremio.com/website/stremio-logo-small.png',

  //"icon": "URL to 256x256 monochrome png icon",
  //"background": "URL to 1024x786 png/jpg background",

  // set what type of resources we will return
  resources: ['catalog', 'stream'],

  types: ['movie', 'series'], // your add-on will be preferred for these content types

  // set catalogs, we'll have 2 catalogs in this case, 1 for movies and 1 for series
  catalogs: [
    {
      type: 'movie',
      id: 'helloworldmovies',
      name: 'Peliculacas'
    },
    {
      type: 'series',
      id: 'helloworldseries',
      name: 'Seriacas'
    }
  ],

  // prefix of item IDs (ie: "tt0032138")
  idPrefixes: ['tt']
};

const builder = new addonBuilder(manifest);

// builder.defineStreamHandler(async function(args) {
//   if (dataset[args.id]) {
//     return Promise.resolve({ streams: [dataset[args.id]] });
//   } else {
//     return Promise.resolve({ streams: [] });
//   }
// });
builder.defineStreamHandler(async function(args) {
  let file = await axios.get('https://api.myjson.com/bins/oz3se');
  let dataset = file.data;

  if (dataset[args.id]) {
    defineCatalog();
    return Promise.resolve({ streams: [dataset[args.id]] });
  } else {
    return Promise.resolve({ streams: [] });
  }
});

const METAHUB_URL = 'https://images.metahub.space';

const generateMetaPreview = function(value, key) {
  // To provide basic meta for our movies for the catalog
  // we'll fetch the poster from Stremio's MetaHub
  // see https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/meta.md#meta-preview-object
  const imdbId = key.split(':')[0];
  return {
    id: imdbId,
    type: value.type,
    name: value.name,
    poster: METAHUB_URL + '/poster/medium/' + imdbId + '/img'
  };
};

builder.defineCatalogHandler(defineCatalog);

async function defineCatalog(args, cb) {
  let file = await axios.get('https://api.myjson.com/bins/oz3se');
  let dataset = file.data;

  const metas = Object.entries(dataset)
    .filter(([_, value]) => value.type === args.type)
    .map(([key, value]) => generateMetaPreview(value, key));

  return Promise.resolve({ metas: metas });
}

module.exports = builder.getInterface();
