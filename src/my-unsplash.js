const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')
const sketch = require('sketch')

const { DataSupplier, UI } = sketch

const TMP_FOLDER = path.join(os.tmpdir(), 'com.sketchapp.unsplash-plugin')

const config = {
  photos: {
    agenzie: {
      action: 'SupplyDataCollectionAgenzie',
      title: 'Collection: Agenzie',
      collectionId: '3688717',
      search: null
    },
    viaggi: {
      action: 'SupplyDataCollectionViaggi',
      title: 'Collection: Viaggi & Turismo',
      collectionId: '3660951',
      search: null
    },
    facce: {
      action: 'SupplyDataCollectionFacce',
      title: 'Collection: Facce',
      collectionId: '3683482',
      search: null
    },
    search_travel: {
      action: 'SupplyDataSearchTravel',
      title: 'Search: Travel',
      collectionId: null,
      search: 'travel'
    },
    search_face: {
      action: 'SupplyDataSearchFace',
      title: 'Search: Face',
      collectionId: null,
      search: 'face,faces'
    }
  },
  user: 'mazz'
}

export function onStartup () {
  for (let i in config.photos) {
    DataSupplier.registerDataSupplier(
      'public.image',
      config.photos[i].title,
      config.photos[i].action)
  }
  // DataSupplier.registerDataSupplier('public.image', 'Agenzie', 'SupplyDataCollectionAgenzie')
  DataSupplier.registerDataSupplier('public.image', '❤️ @mazz', 'SupplyDataUserLikes')
}

export function onShutdown () {
  // Deregister the plugin
  DataSupplier.deregisterDataSuppliers()
  try {
    fs.rmdirSync(TMP_FOLDER)
  } catch (err) {
    console.error(err)
  }
}

export function onSupplyDataCollectionAgenzie (context) {
  getRandomPhoto(context, 'agenzie')

  // https://source.unsplash.com/collection/3688717/1600x900
}
export function onSupplyDataCollectionViaggi (context) {
  getRandomPhoto(context, 'viaggi')

  // https://source.unsplash.com/collection/3660951/1600x900
}

export function onSupplyDataCollectionFacce (context) {
  getRandomPhoto(context, 'facce')

  // https://source.unsplash.com/collection/3683482/1600x900
}

export function onSupplyDataSearchTravel (context) {
  getRandomPhoto(context, 'search_travel')

  // https://source.unsplash.com/1600x900/?travel
}

export function onSupplyDataSearchFace (context) {
  getRandomPhoto(context, 'search_face')

  // https://source.unsplash.com/1600x900/?face,faces
}

export function onSupplyDataUserLikes (context) {
  getRandomPhoto(context, null)
}

function getRandomPhoto (context, photoGroup) {
  let dataKey = context.data.key
  let collectionId = photoGroup ? config.photos[photoGroup].collectionId : null
  let searchTerm = photoGroup ? config.photos[photoGroup].search : null
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach(
    (item, index) => process(item, index, dataKey, collectionId, searchTerm)
  )
}

function process (item, index, dataKey, collectionId, searchTerm) {
  let url = 'https://source.unsplash.com'

  if (collectionId) {
    url += '/collection/' + collectionId + '/1600x900'
  } else if (searchTerm) {
    url += '/1600x900/?' + searchTerm
  } else {
    url += '/user/' + config.user + '/likes/1600x900'
  }

  UI.message('🕑 Downloading ' + url + '...')

  return getImageFromURL(url).then(imagePath => {
    if (!imagePath) {
      // TODO: something wrong happened, show something to the user
      UI.message('Errore (' + url + ')')
      return
    }
    DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)
  })
}

function getImageFromURL (url) {
  return fetch(url)
    .then(res => res.blob())
    // TODO: use imageData directly, once #19391 is implemented
    .then(saveTempFileFromImageData)
    .catch((err) => {
      console.error(err)
      return context.plugin.urlForResourceNamed('placeholder.png').path()
    })
}

function saveTempFileFromImageData (imageData) {
  const guid = NSProcessInfo.processInfo().globallyUniqueString()
  const imagePath = path.join(TMP_FOLDER, `${guid}.jpg`)
  try {
    fs.mkdirSync(TMP_FOLDER)
  } catch (err) {
    // probably because the folder already exists
    // TODO: check that it is really because it already exists
  }
  try {
    fs.writeFileSync(imagePath, imageData, 'NSData')
    return imagePath
  } catch (err) {
    console.error(err)
    return undefined
  }
}
