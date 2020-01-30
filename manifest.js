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

  types: ['series'], // your add-on will be preferred for these content types

  // set catalogs, we'll have 2 catalogs in this case, 1 for movies and 1 for series
  catalogs: [
    //   {
    //     type: 'movie',
    //     id: 'helloworldmovies',
    //     name: 'Peliculacas'
    //   },
    {
      type: 'series',
      id: 'seriesrawl',
      name: 'Seriacas'
    }
  ],

  // prefix of item IDs (ie: "tt0032138")
  idPrefixes: ['tt']
};

module.exports = manifest;
