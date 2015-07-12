var trainsToShow = [],
    origin, destination;

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

function callService(msg, sendResponse) {
    chrome.storage.sync.get({
            origin: 'Entrecampos',
            destination: 'Benfica',
            minimumTime: '0'
        },
        function(items) {
            origin = items.origin;
            destination = items.destination;
            var url = "http://www.cp.pt/sites/passageiros/pt/consultar-horarios/horarios-resultado";
            var timestamp = moment(msg.timestamp);
            var date = timestamp.format('YYYY-MM-DD');
            var minimumTime = items.minimumTime;
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
                timestamp: date.add(1, 'd').startOf('day')
            }, callback);

            return;
        }

        callback({
            success: true,
            trains: trainsToShow,
            origin: origin,
            destination: destination
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

function createNotification(data) {
    var notificationID = 'notification.nextTrains';
    chrome.notifications.clear(notificationID);

    var items;
    var trains = data.trains;
    trains = getNextTrains(trains, 3);
    items = getNotificationTrains(trains);

    var opt = {
        type: "list",
        title: "Próximas partidas",
        message: "no message",
        iconUrl: "../img/logo.png",
        items: items,
        buttons: [{
            title: "Snooze"
        }]
    };

    chrome.notifications.create(notificationID, opt, function() {});
}

function getNextTrains(trains, number) {
    return trains.slice(0, number);
}

function getNotificationTrains(trains) {
    return trains.map(function(train) {
        return {
            title: train.departureTime.format('HH:mm'),
            message: calculateTime(train.departureTime.diff(moment(), 'minutes'))
        }
    });
}

chrome.runtime.onInstalled.addListener(function(details) {
    //whenever the extension is installed or updated, this listener will be triggered and the extenstion version will be saved
    //to the storage
    setExtensionVersion();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'notification_train' || alarm.name === 'notification_snooze') {
        callService({
            timestamp: moment()
        }, createNotification);
    }
});

chrome.notifications.onButtonClicked.addListener(function(notificationID, buttonIndex){
    if(notificationID === 'notification.nextTrains'){
        chrome.alarms.create('notification_snooze',{
            //snooze for 5 minutes
            when: Date.now() + 300000
        });
    }
});

chrome.runtime.onStartup.addListener(function() {

    //sets the alarm whenever Chrome is started
    chrome.storage.sync.get({
        notificationAt: '18:00',
        notificationActive: true
    }, function(item) {
        if (item.notificationActive) {
            var notificationTime = parseNotificationTime(item.notificationAt);

            chrome.alarms.create('notification_train', {
                when: notificationTime.valueOf(),
                periodInMinutes: 24 * 60
            });
        }
    });

});