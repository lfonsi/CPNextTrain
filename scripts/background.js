var trainsToShow = [], origin, destination;

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

chrome.runtime.onInstalled.addListener(function(details) {
    //whenever the extension is installed or updated, this listener will be triggered and the extenstion version will be saved
    //to the storage
    setExtensionVersion();
});

function callService(msg, sendResponse) {
    var url = "http://www.cp.pt/sites/passageiros/pt/consultar-horarios/horarios-resultado";
    origin = msg.origin;
    destination = msg.destination;
    var timestamp = moment(msg.timestamp);
    var date = timestamp.format('YYYY-MM-DD');
    var minimumTime = msg.minimumTime;
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
                data: data,
                date: timestamp,
                minimumTime: minimumTime
            };
        })
        .error(function(err) {
            response = {
                success: false,
                msg: 'Ocorreu um erro! Por favor tente de novo!',
                err: err
            };
        })
        .complete(function() {
            handleServiceResponse(response, sendResponse);
        });
}

function handleServiceResponse(response, sendResponse) {
    switch (response.success) {
        case true:
            handleTrains(response, sendResponse);
            break;

        case false:
            return sendResponse(response);
            break;

        default:
            throw Error('Invalid response object...');
            break;
    }
}

function handleTrains(response, sendResponse) {
    var html = response.data;
    var date = response.date;
    var minimumTime = response.minimumTime;

    var trains = parseData(html, date);
    selectTrains(trains, sendResponse, date, minimumTime);
}

function parseData(data, date) {
    var rows = $(data).find('.table-search-results tbody tr');
    var trains = [];
    $(rows).each(function(index, el) {

        var cells = $(el).find('td');

        var trainType = cells[1].innerText;
        var departureTime = cells[2].innerText.split('h');
        var arrivalTime = cells[3].innerText.split('h');
        var duration = cells[4].innerText;

        trains.push({
            trainType: trainType,
            departureTime: moment(date).hour(departureTime[0]).minute(departureTime[1]),
            arrivalTime: moment(date).hour(arrivalTime[0]).minute(arrivalTime[1]),
            duration: duration
        });
    });

    return trains;
}

function selectTrains(trains, callback, date, minimumTime) {
    var currentTime = date.add(minimumTime, 'm'),
        found = false;

    chrome.storage.sync.get({
        nrOccurrences: '1',
    }, function(item) {
        var totalOccurrences = parseInt(item.nrOccurrences);

        $.each(trains, function(index, train) {
            if (train.departureTime.isAfter(currentTime)) {
                trainsToShow.push(train);
                if (trainsToShow.length === totalOccurrences) {
                    found = true;
                    return false;
                }
            }
        });

        if (!found) {
            callService({
                origin: origin,
                destination: destination,
                minimumTime: minimumTime,
                timestamp: date.add(1,'d').startOf('day')
            }, callback);
            
            //getTrains(moment(date).add(1, 'd').startOf('day'));
            return;
        }

        callback({
            success: true,
            trains: trainsToShow
        });

        trainsToShow = [];
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

function showNotification() {
    var notificationID = 'notification.ID';

    chrome.notifications.clear(notificationID);

    var opt = {
        type: "list",
        title: "Próximas partidas",
        message: "no message",
        iconUrl: "../img/logo.png",
        items: [{
            title: "18:30",
            message: "10min."
        }, {
            title: "18:40",
            message: "20min."
        }, {
            title: "18:50",
            message: "1h30min."
        }]
    };

    chrome.notifications.create(notificationID, opt, function() {
        console.log('ran');
    });
}