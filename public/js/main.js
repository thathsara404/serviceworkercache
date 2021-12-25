fetch('/public/json/language.json').then((data) => {
    return data.json(); //convert readable stream to JSON object
}).then((lan) => {
    console.log(lan);
    const appName = document.querySelector('#appName');
    const aboutHeader = document.querySelector('#aboutHeader');
    const aboutDescription = document.querySelector('#aboutDescription');

    appName.innerHTML = lan.header.appName;
    aboutHeader.innerHTML = lan.about.header;
    aboutDescription.innerHTML = lan.about.description;
});