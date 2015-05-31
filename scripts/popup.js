var origin, destination;

function getTrain() {
    chrome.storage.sync.get({
            origin: 'Entrecampos',
            destination: 'Benfica'
        },
        function(items) {
            origin = items.origin;
            destination = items.destination;

            chrome.runtime.sendMessage({
                type: 'callService',
                origin: origin,
                destination: destination,
                date: moment().format('YYYY-MM-DD')
            }, function(response) {

                if (response.success) {
                    renderStatus(response.msg);
                    var trains = parseData(response.data);
                    findNextTrain(trains);
                } else {
                    renderStatus(response.msg);
                }
            });
        });
}

function parseData(data) {
    var rows = $(data).find('.table-search-results tbody tr');
    var trains = [];
    $(rows).each(function(index, el) {

        var cells = $(el).find('td');

        var departureTime = cells[2].innerText.split('h');
        var arrivalTime = cells[3].innerText.split('h');
        var duration = cells[4].innerText;

        trains.push({
            departureTime: moment().hour(departureTime[0]).minute(departureTime[1]),
            arrivalTime: moment().hour(arrivalTime[0]).minute(arrivalTime[1]),
            duration: duration
        });
    });

    return trains;
}

function findNextTrain(trains) {
    var currentTime = moment(),
        found = false;

    $.each(trains, function(index, train) {
        if (train.departureTime.isAfter(currentTime)) {
            handleNextTrain(train);
            found = true;
            return false;
        }
    });

    if (!found && trains.length > 0) {
        handleNextTrain(trains[0], true);
    }
}

function handleNextTrain(train, nextDay) {
    nextDay ? train.departureTime.add(1, 'd') : '';

    var currentTime = moment(),
        arrivalTime = train.arrivalTime.format('HH:mm'),
        departureTime = train.departureTime.format('HH:mm'),
        minutesToTrain = train.departureTime.diff(currentTime, 'minutes');

    renderStatus('O próximo comboio parte de <b>' + origin + '</b> às ' + departureTime + ' e chega a <b>' + destination + '</b> às ' +
        arrivalTime + '. Corre! Tens ' + minutesToTrain + ' minutos para apanhar o comboio!');
}

function renderStatus(statusText) {
    $('#status').html(statusText);
}

document.addEventListener('DOMContentLoaded', function() {
    renderStatus('A pesquisar próxima partida...');
    getTrain();
});