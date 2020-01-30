const { addonBuilder } = require('stremio-addon-sdk');
const Stremio = require('stremio-addons');
const axios = require('axios');
const manifest = require('./manifest');
var DomParser = require('dom-parser');

var normalize = (function() {
  var from = 'ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç',
    to = 'AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc',
    mapping = {};

  for (var i = 0, j = from.length; i < j; i++)
    mapping[from.charAt(i)] = to.charAt(i);

  return function(str) {
    var ret = [];
    for (var i = 0, j = str.length; i < j; i++) {
      var c = str.charAt(i);
      if (mapping.hasOwnProperty(str.charAt(i))) ret.push(mapping[c]);
      else ret.push(c);
    }
    return ret
      .join('')
      .replace(/[^-A-Za-z0-9]+/g, '+')
      .toLowerCase();
  };
})();

const URL_DATASET =
  'https://raw.githubusercontent.com/rawlmp/stremio-add-on/master/dataset.json';
const METAHUB_URL = 'https://images.metahub.space';
var CINEMETA_ENDPOINT = 'http://cinemeta.strem.io/stremioget/stremio/v1';
var TMDB_URL =
  'https://api.themoviedb.org/3/search/movie?api_key=7ea7f8b905fe0a8f7dc4b0bd4f906291&language=es-ES&query=';

var addons = new Stremio.Client();
addons.add(CINEMETA_ENDPOINT);
const builder = new addonBuilder(manifest);
let dataset = [];

builder.defineCatalogHandler(defineCatalog);
builder.defineStreamHandler(createStream);

async function createStream(args) {
  let movieInCinemeta = await getMovieInfo(args.id);
  let spanishName = await buscarNombre(movieInCinemeta);
  let streamInfo = await buscarTorrent(spanishName);

  if (streamInfo) {
    return Promise.resolve({ streams: streamInfo });
  } else {
    return Promise.resolve({ streams: [] });
  }
}

async function getMovieInfo(id) {
  return new Promise((res, rej) => {
    addons.meta.get({ query: { type: 'movie', imdb_id: id } }, function(
      err,
      meta
    ) {
      if (meta) {
        res(meta.name);
      } else {
        rej('Sin info');
      }
    });
  });
}

async function buscarNombre(nombreOriginal) {
  return new Promise(async (res, rej) => {
    let go = await axios.get(TMDB_URL + nombreOriginal);
    let info = go.data;
    let nombreSpanish = info.results[0].title;

    res(nombreSpanish);
  });
}

async function buscarTorrent(nombre) {
  return new Promise(async (res, rej) => {
    let nombreABuscar = normalize(nombre);
    if (nombreABuscar.split('+').length > 6) {
      nombreABuscar = nombreABuscar
        .split('+')
        .slice(0, 6)
        .join('+');
    }
    let page = await axios.get(
      'https://torrentz2.eu/search?f=castellano+' + nombreABuscar + '+&safe=1'
    );
    var parser = new DomParser();
    var doc = parser.parseFromString(page.data);
    let results = doc.getElementsByTagName('dt');
    let details = doc.getElementsByTagName('dd');

    let peliculas = [...results]
      .map((e, i) => {
        let det = [...details][i].innerHTML.split('span')[4];
        let size = det ? det.split('<')[0].substr(1) : '--';

        let det2 = [...details][i].innerHTML.split('span')[6];
        let peers = det2 ? det2.split('<')[0].substr(1) : '--';

        let quality1 = e.innerHTML.split('[')[1];
        let quality = quality1 ? quality1.split(']')[0] : '??';
        let hash = e.innerHTML.split('/')[1].substr(0, 40);
        let name = e.innerHTML
          .split('>')
          .pop()
          .split('[')[0]
          .slice(0, -1);
        if (i > 1 && !name.includes('Temporada') && quality != '??') {
          return {
            name,
            infoHash: hash,
            type: 'movie',
            data: 'Rawl Movies',
            title: 'peers(' + peers + ') - ' + quality + ' - ' + size,
            availability: 3
          };
        }
      })
      .filter(e => e != undefined);

    if (peliculas.length) {
      res(peliculas);
    } else {
      rej('Nothing');
    }
  });
}

async function defineCatalog(args, cb) {
  let remoteList = await axios(URL_DATASET);
  let dataset = remoteList.data;
  if (dataset) {
    const metas = Object.entries(dataset).map(([key, value]) =>
      generateMetaPreview(value, key)
    );
    return Promise.resolve({ metas: metas });
  }
}

function generateMetaPreview(value, key) {
  const imdbId = key.split(':')[0];
  return {
    id: imdbId,
    type: value.type,
    name: value.name,
    poster: METAHUB_URL + '/poster/medium/' + imdbId + '/img'
  };
}

addons.add('http://channels.strem.io/stremioget/stremio/v1');
addons.add('http://filmon.strem.io/stremioget/stremio/v1');

async function getTorrents() {
  return new Promise(async (resolve, rej) => {
    let page = await axios.get(
      'https://torrentz2.eu/search?f=castellano+microhd&safe=1'
    );
    var parser = new DomParser();
    var doc = parser.parseFromString(page.data);
    let results = doc.getElementsByTagName('dt');

    let hash_name = [...results]
      .map((e, i) => {
        let hash = e.innerHTML.split('/')[1].substr(0, 40);
        let name = e.innerHTML
          .split('>')
          .pop()
          .split('[')[0]
          .slice(0, -1);
        if (i > 1 && !name.includes('Temporada')) {
          return { name, hash };
        }
      })
      .filter(e => e != undefined);

    var uniqueTorrents = hash_name.reduce((unique, o) => {
      if (!unique.some(obj => obj.name === o.name)) {
        unique.push(o);
      }
      return unique;
    }, []);

    resolve(getOriginalTitles(uniqueTorrents));
  });
}

async function getOriginalTitles(torrents) {
  return new Promise((resolve, rej) => {
    let cleanTorrents = torrents.map(t => {
      if (t.name.includes('(')) {
        let cleanName = t.name.split('(')[0].slice(0, -1);
        return { name: cleanName, hash: t.hash };
      } else {
        return t;
      }
    });

    Promise.all(
      cleanTorrents.map(async (t, i) => {
        try {
          let go = await axios.get(TMDB_URL + t.name + '&year=2019');
          let info = go.data;
          if (info.results.length)
            return { ...t, original: info.results[0].original_title };
        } catch (e) {
          console.log(e);
        }
      })
    ).then(t => {
      let cleanTorrents = t.filter(t => t != undefined);
      resolve(getMeta(cleanTorrents));
    });
  });
}

function getMeta(torrents) {
  return new Promise((resolve, rej) => {
    console.log('Getting...');
    addons.meta.find(
      { query: { type: 'movie', year: 2019 }, limit: 500 },
      async function(err, meta) {
        let movies = meta;
        let finalMovies = [];
        let finalArray = {};
        let finalNames = [];

        movies.forEach(m => {
          torrents.forEach(t => {
            if (t.original == m.name) {
              if (!finalNames.includes(t.name)) {
                finalNames.push(t.name);
                finalMovies.push({
                  name: t.name,
                  torrent: t.hash,
                  id: m.imdb_id
                });
              }
            }
          });
        });

        finalMovies.forEach(m => {
          finalArray[m.id] = {
            name: m.name,
            infoHash: m.torrent,
            type: 'movie',
            data: 'Rawl Movies'
          };
        });
        dataset = finalArray;
        resolve(finalArray);
      }
    );
  });
}

module.exports = builder.getInterface();
