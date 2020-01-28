const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');

const manifest = {
  id: 'org.stremio.helloworld',
  version: '1.0.0',

  name: 'Rawl Movies',
  description: 'Por fin películas en español!!!',

  //"icon": "URL to 256x256 monochrome png icon",
  //"background": "URL to 1024x786 png/jpg background",

  // set what type of resources we will return
  resources: ['catalog', 'stream'],

  types: ['movie', 'series'], // your add-on will be preferred for these content types

  // set catalogs, we'll have 2 catalogs in this case, 1 for movies and 1 for series
  catalogs: [
    {
      type: 'movie',
      id: 'helloworldmovies'
    },
    {
      type: 'series',
      id: 'helloworldseries'
    }
  ],

  // prefix of item IDs (ie: "tt0032138")
  idPrefixes: ['tt']
};

const builder = new addonBuilder(manifest);

//Aladdin //https://torrentz2.eu/d835f77aec88288e8802c9ceec229c7a6a64dbf4
//Toy story 4 //https://torrentz2.eu/653f8c79549a371a748ad4703a25c2a53cc43bca
//Mascotas 2 //https://torrentz2.eu/a19daff4dface07dfe2f86bd8dcf606b6c514768
//Dora //https://torrentz2.eu/49973634c7261ae6180ce20cbb5f9d1a38ff646d
//IT 2//https://torrentz2.eu/4fe179e75f2c5e978157e144b021ab03ae391313

const dataset = {
  tt1560220: {
    name: 'Zombieland 2',
    type: 'movie',
    infoHash: '0e0c4743b23a9fcf8e10b964f67b7700441afbcd'
  },
  tt6139732: {
    name: 'Aladdin',
    type: 'movie',
    infoHash: 'd835f77aec88288e8802c9ceec229c7a6a64dbf4'
  },
  tt1979376: {
    name: 'Toy Story 4',
    type: 'movie',
    infoHash: '653f8c79549a371a748ad4703a25c2a53cc43bca'
  },
  tt5113040: {
    name: 'Mascotas 2',
    type: 'movie',
    infoHash: 'a19daff4dface07dfe2f86bd8dcf606b6c514768'
  },
  tt7547410: {
    name: 'Dora y la ciudad perdida',
    type: 'movie',
    infoHash: '49973634c7261ae6180ce20cbb5f9d1a38ff646d'
  },
  tt7349950: {
    name: 'IT 2',
    type: 'movie',
    infoHash: '4fe179e75f2c5e978157e144b021ab03ae391313'
  }
};

builder.defineStreamHandler(async function(args) {
  if (dataset[args.id]) {
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

builder.defineCatalogHandler(function(args, cb) {
  // filter the dataset object and only take the requested type
  const metas = Object.entries(dataset)
    .filter(([_, value]) => value.type === args.type)
    .map(([key, value]) => generateMetaPreview(value, key));

  return Promise.resolve({ metas: metas });
});

module.exports = builder.getInterface();
