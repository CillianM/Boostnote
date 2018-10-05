const _ = require('lodash')
const resolveStorageData = require('./resolveStorageData')
const keygen = require('browser/lib/keygen')
const path = require('path')
const CSON = require('@rokt33r/season')
const { findStorage } = require('browser/lib/findStorage')

/**
 * @param {String} storageKey
 * @param {Object} input
 * ```
 * {
 *   color: String,
 *   name: String
 * }
 * ```
 *
 * @return {Object}
 * ```
 * {
 *   storage: Object
 * }
 * ```
 */
function createSubFolder (containingFolder, storageKey, input) {
  let targetStorage
  try {
    if (input == null) throw new Error('No input found.')
    if (!_.isString(input.name)) throw new Error('Name must be a string.')
    if (!_.isString(input.color)) throw new Error('Color must be a string.')

    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage)
    .then(function createFolder (storage) {
      let key = keygen()
      let parentFolder
      let index
      let counter = 0
      while (storage.folders.some((folder) => folder.key === key)) {
        key = keygen()
      }
      storage.folders.forEach(function (folder) {
        if (folder.key === containingFolder.key) {
          index = counter
        } else {
          counter++
        }
      })
      parentFolder = storage.folders[index]

      console.log('Creating sub folder in ' + containingFolder)
      const newFolderSymLink = {
        key,
        color: input.color,
        name: input.name,
        type: 'SYMLINK'
      }
      const newFolder = {
        key,
        color: input.color,
        name: input.name
      }

      let folderList = parentFolder.containingFolders
      if (folderList === undefined) {
        folderList = []
      }
      folderList.push(newFolder)
      parentFolder.containingFolders = folderList

      storage.folders.splice(index, 1)
      storage.folders.push(parentFolder)
      storage.folders.push(newFolderSymLink)

      CSON.writeFileSync(path.join(storage.path, 'boostnote.json'), _.pick(storage, ['folders', 'version']))

      return {
        storage
      }
    })
}

module.exports = createSubFolder
