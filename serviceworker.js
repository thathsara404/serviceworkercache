try {
    importScripts('./serviceworkerVersion.js');
} catch (e) {
    console.error(e);
}

const APP_CSS = 'app-css';
const APP_JS = 'app-js';
const APP_HTML = 'app-html';
const APP_HBS = 'app-hbs';
const APP_JSON = 'app-json';
const APP_OTHER = 'app-other';
const APP_API = 'app-api';

// The memory limit.
const appMemoryLimit = 200; //MB

// Time interval to memory release check.
const appCacheReleaseInterval = 1000*60*30; // 30 Min

// Time interval to delete crucial files
const appCrucialCacheReleaseInterval = 1000*60*10; // 10 Min

// The list of memory collections to delete.
const appCacheListToDelete = [APP_CSS, APP_JS, APP_HTML,
    APP_HBS, APP_JSON, APP_OTHER, APP_API];

const appCrucialCacheListToDelete = [APP_JSON, APP_HTML];

// Service Worker events
const ACTIVATE_EVENT = 'activate';
const FETCH_EVENT = 'fetch';
const INSTALL_EVENT = 'install';

// File types 
const HTML_TYPE = 'HTML';
const CSS_TYPE = 'CSS';
const JSON_TYPE = 'JSON';
const HBS_TYPE = 'HBS';
const JS_TYPE = 'JS';
const SVG_TYPE = 'SVG';
const WOFF_TYPE = 'WOFF';
const WOFF2_TYPE = 'WOFF2';
const PNG_TYPE = 'PNG';
const JPG_TYPE = 'JPG';
const ICO_TYPE = 'ICO';
const GIF_TYPE = 'GIF';
const API_TYPE = 'API';

// HTTP method
const HTTP_GET = 'GET';

// Protocols
const HTTP = 'http';

// Cachable GET API calls
const cacheAPIs = ['/rest/getExamPlan', '/pv5/v8/1/api/GetUserByGUID'];

// Is API cache enabled
const APICacheEnabled = false;

/**
 * Force to activate the new Service Worker (doesn't wait).
 * Remove older service worker version immediately.
 */
self.addEventListener(INSTALL_EVENT, function () {
    self.skipWaiting();
});

/** 
 * Idle State ---> Activate State : Delete Cache
 * Keep cache memory up to date
 * */ 
self.addEventListener(ACTIVATE_EVENT, function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheKeys) {
            Promise.all(
                cacheKeys.map(function (cacheKey) {
                    if (appCacheListToDelete.indexOf(cacheKey) !== -1) {
                        return caches.delete(cacheKey);
                    }
                })
            );
        }).catch(function (error) {
            console.error('SW error in activate: ', error);
        })
    );
});

/**
 * Intercept fetch requests and serve from the cache if cache is available.
 * If cache doesn't exist, fetch the file first. Then cache the file and serve.
 */
self.addEventListener(FETCH_EVENT, function (event) {
    respond(event);
});

// Handle HTTP Methods.
function respond (event) {
    let request = event.request;
    // It won't respond for http requests. Allowed HTTPS only
    if (!(event.request.url.indexOf(HTTP) === 0)){
        return;
    }
    // For GET
    if (request.method === HTTP_GET) {
        const pathName = getPathName(request);
        let fileType = getFileType(pathName);
        let modifiedRequest, modifiedFileType;
        // eslint-disable-next-line prefer-const
        [modifiedRequest, modifiedFileType] = modifyRequest(fileType, request, pathName);
        request = modifiedRequest;
        fileType = modifiedFileType;
        event.respondWith(
            findMatchInCache(fileType, request)
        );
    }
}

/**
 * Logics related to modify request & file type if required.
 * @param {String} fileType File Type to modify if required.
 * @param {Request} request Request to modify if required.
 * @param {String} pathName Request path name.
 * @returns {[Request, String]} Request and File Type will be returned.
 */
function modifyRequest (fileType, request, pathName) {
    if ((fileType === HTML_TYPE || fileType === JSON_TYPE) && request.url.includes('?_=')) {
        const derivedURL = request.url.split('?_=')[0];
        const newRequest = new Request(derivedURL, request.clone()) ;
        return [newRequest, fileType];
    } else if (APICacheEnabled && cacheAPIs.indexOf(pathName) !== -1) {
        const derivedURL = request.url.split('&_=')[0];
        const newRequest = new Request(derivedURL, request.clone()) ;
        fileType = API_TYPE;
        return [newRequest, fileType];
    }
    return [request, fileType];
}

/**
 * Save the resource in the cache memory.
 * @param {String} type File type, to decide the specific cache memory.
 * @param {Request} request HTTP Request, to save in the cache.
 * @param {Response} networkResponse HTTP Response, to save in the cache.
 */
function saveFilesInCache (type, request, networkResponse) {
    return new Promise(function (resolve) {
        switch (type) {
            case HTML_TYPE:
                save(resolve, request, networkResponse, APP_HTML);
                break;
            case JS_TYPE:
                save(resolve, request, networkResponse, APP_JS);
                break;
            case HBS_TYPE:
                save(resolve, request, networkResponse, APP_HBS);
                break;
            case JSON_TYPE:
                save(resolve, request, networkResponse, APP_JSON);
                break;
            case CSS_TYPE:
                save(resolve, request, networkResponse, APP_CSS);
                break;
            case SVG_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case WOFF_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case WOFF2_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case ICO_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case PNG_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case JPG_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case GIF_TYPE:
                save(resolve, request, networkResponse, APP_OTHER);
                break;
            case API_TYPE:
                save(resolve, request, networkResponse, APP_API);
                break;
            default:
                resolve(networkResponse);
        }
    });
}

/**
 * This method will decide where to find the response.
 * @param {String} type File type, to search in specific cache memory.
 * @param {Request} request HTTP Request to get the response.
 */
function findMatchInCache (type, request) {
    switch (type) {
        case JS_TYPE:
            // Do not cache config
            if (getPathName(request) === '/env_configs/configs.js') {
                return fetch(request);
            }
            return findResourceAndUpdate(request, APP_JS, type);
        case HTML_TYPE:
            return findResourceAndUpdate(request, APP_HTML, type);
        case JSON_TYPE:
            return findResourceAndUpdate(request, APP_JSON, type);
        case HBS_TYPE:
            return findResourceAndUpdate(request, APP_HBS, type);
        case CSS_TYPE:
            return findResourceAndUpdate(request, APP_CSS, type);
        case SVG_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case WOFF_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case WOFF2_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case ICO_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case PNG_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case JPG_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case GIF_TYPE:
            return findResourceAndUpdate(request, APP_OTHER, type);
        case API_TYPE:
            return findResourceAndUpdate(request, APP_API, type);
        default:
            return fetch(request);
    }
}

/**
 * Save the request-reponse pair.
 * @param {resolve} resolve The promise resolve.
 * @param {Request} request The request, to save in the cache (key).
 * @param {Response} response The response, to save in the cache (value).
 * @param {String} cacheStorage. The cache storage, to save data.
 * @returns {Response} The response, to save in the cache (value).
 */
function save (resolve, request, response, cacheStorage) {
    resolve(caches.open(cacheStorage).then(function (cache) {
        cache.put(request, response);
        return response;
    }).catch(function (){
        console.error('error');
        // If cache quota exceeds (Safari got 50MB)
        return null;}));
}

/**
 * Find the response by given reuqest
 * If it is not in the cache, will fetch and cache.
 * @param {Request} request The request object to find the response.
 * @param {String} cacheStorage The cache storage, to get data.
 * @param {String} fileType The file type, to find the file in the cache.
 * @returns {Response} The response, found in the cache or fetched.
 */
function findResourceAndUpdate (request, cacheStorage, fileType) {
    return caches.open(cacheStorage).then(function (cache) {
        return cache.match(request).then(function (response){
            if (response) {
                return response;
            }
            const netWorkResult = fetch(request)
                .then(function (networkResponse) {
                    // Save the response in the cache and return network result.
                    return saveFilesInCache(fileType, request, networkResponse.clone()).then(function () {
                        return networkResponse;
                    });
                }).catch(function (error) {
                    console.error('SW error in fetch data: ', error);
                    unregisterSW();
                });
            return netWorkResult;
        }).catch(function (error) {
            console.error('SW error in request match: ', error);
            unregisterSW();
        });
    }).catch(function (error) {
        console.error('SW error in open cache: ', error);
        unregisterSW();
    });
}

/**
 * Returns the file type
 * @param {String} pathName The request file path.
 * @returns {String} The files extention.
 */
function getFileType (pathName) {
    return pathName.split('.').pop().toUpperCase();
}

/**
 * Returns the request path.
 * @param {Request} request The http request to get derive the path.
 * @returns {String} Request Path.
 */
function getPathName (request) {
    return new URL(request.url).pathname;
}

/**
 * Defined memory limit validator
 */
setInterval(function (){
    caches.keys().then(function (cacheKeys) {
        Promise.all(
            cacheKeys.map(function (cacheKey) {
                if (appCacheListToDelete.indexOf(cacheKey) !== -1) {
                    if ('storage' in navigator && 'estimate' in navigator.storage) {
                        navigator.storage.estimate().then(function ({ usage, quota }) {
                            const usedMemory = usage/1000000;
                            const availableQuota = quota/1000000;
                            console.warn('Used cache memory(MB): ',usedMemory);
                            console.warn('Available cache quota(MB): ', availableQuota);
                            if (usedMemory> appMemoryLimit) {
                                return caches.delete(cacheKey);
                            }
                        }).catch(function (error) {
                            console.error('SW error in read quota: ', error);
                            unregisterSW();
                        });
                    }
                }
            })
        );
    }).catch(function (error) {
        console.error('SW error in read cache collection: ', error);
        unregisterSW();
    });
}, appCacheReleaseInterval);

/**
 * Unregister Service Worker
 */
function unregisterSW () {
    self.registration.unregister();
}

/**
 * Delete given cache collection
 * @param {Array} cacheList Memory collection 
 */
function deleteCache (cacheList) {
    cacheList.map(function (memory) {
        caches.delete(memory);
    });
}

/**
 * Delete crucial cache memory list periodically
 */
setInterval(function () {
    deleteCache(appCrucialCacheListToDelete);
}, appCrucialCacheReleaseInterval);