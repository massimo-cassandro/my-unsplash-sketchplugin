const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')
const sketch = require('sketch')

const { DataSupplier, UI } = sketch

const TMP_FOLDER = path.join(os.tmpdir(), 'com.sketchapp.unsplash-plugin')

const config = {
  collections: {
    agenzie: {
      action: 'SupplyDataCollectionAgenzie',
      title: 'Agenzie',
      collectionId: '3688717'
    },
    viaggi: {
      action: 'SupplyDataCollectionViaggi',
      title: 'Viaggi & Turismo',
      collectionId: '3660951'
    },
    facce: {
      action: 'SupplyDataCollectionFacce',
      title: 'Facce',
      collectionId: '3683482'
    }
  },
  user: 'mazz'
}

export function onStartup () {
  for (let i in config.collections) {
    DataSupplier.registerDataSupplier(
      'public.image',
      config.collections[i].title,
      config.collections[i].action)
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
  getRandomPhotoFromCollection(context, 'agenzie')

  // https://source.unsplash.com/collection/3688717/1600x900
}
export function onSupplyDataCollectionViaggi (context) {
  getRandomPhotoFromCollection(context, 'viaggi')

  // https://source.unsplash.com/collection/3660951/1600x900
}

export function onSupplyDataCollectionFacce (context) {
  getRandomPhotoFromCollection(context, 'facce')

  // https://source.unsplash.com/collection/3683482/1600x900
}

export function onSupplyDataUserLikes (context) {
  getRandomPhotoFromCollection(context, null)
}

function getRandomPhotoFromCollection (context, collection) {
  let dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach(
    (item, index) => process(item, index, dataKey, (collection ? config.collections[collection].collectionId : null))
  )
}

function process (item, index, dataKey, collectionId) {
  let url = 'https://source.unsplash.com'

  if (collectionId) {
    url += '/collection/' + collectionId + '/1600x900'
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
