chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {

    switch (msg.type) {
        case 'callService':
            callService(msg, sendResponse);
            break;
        default:
            sendResponse({
                success: false,
                msg: 'there is no handler for ' + msg.type + ' type!'
            });
            break;
    }

    return true;

});

chrome.runtime.onInstalled.addListener(function (details){
    //whenever the extension is installed or updated, this listener will be triggered and the extenstion version will be saved
    //to the storage
    setExtensionVersion();
});

function callService(msg, sendResponse) {
    var url = "http://www.cp.pt/sites/passageiros/pt/consultar-horarios/horarios-resultado";
    var origin = msg.origin;
    var destination = msg.destination;
    var date = msg.date;
    var response;
    $.ajax({
            method: 'POST',
            url: url,
            data: {
                depart: origin,
                arrival: destination,
                departDate: date
            }
        })
        .success(function(data) {
            response = {
                success: true,
                msg: 'Pedido efectuado com sucesso! Aguarde...',
                data: data
            };
        })
        .error(function(err) {
            response = {
                success: false,
                msg: 'error occurred fetching data: ' + err,
            };
        })
        .done(function() {
            sendResponse(response);
        });
}

function setExtensionVersion() {
    var version = getManifest().version;
    chrome.storage.sync.set({
        appVersion: version
    });
}

function getManifest() {
    var manifest = chrome.runtime.getManifest();
    return manifest;
}