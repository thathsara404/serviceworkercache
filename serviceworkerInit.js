// Register Service Worker
if ('serviceWorker' in navigator) { //check serviceW worker API is available
    console.log('Serviceworkers are enabled');
    const SCOPE = '/';
    navigator.serviceWorker.register('./serviceworker.js', { scope: SCOPE })
        .then(function () {
            console.log('Serviceworker registered successfully.');
        })
        .catch(function (e) {
            console.error('Error in Serviceworker registration.', e);
        });
} else {
    console.log('Serviceworkers are not enabled.');
}