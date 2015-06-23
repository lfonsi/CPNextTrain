var origin, destination, trainsToShow = [];

function init() {
    chrome.storage.sync.get('started', function(item) {
        if (item.started) {
            $('#initial-content').remove();
            trainsToShow = [];
            getTrains(moment());
        } else {
            $('#loading').addClass('hide');
            $('#initial-content').removeClass('hide');
            buildSelects();
            $('#save').click(clickHandler);
        }
    })
}

function getTrains(date) {
    chrome.storage.sync.get({
            origin: 'Entrecampos',
            destination: 'Benfica',
            minimumTime: '0'
        },
        function(items) {
            origin = items.origin;
            destination = items.destination;
            minimumTime = parseInt(items.minimumTime);

            chrome.runtime.sendMessage({
                type: 'callService',
                origin: origin,
                destination: destination,
                date: date.format('YYYY-MM-DD')
            }, function(response) {

                if (response.success) {
                    var trains = parseData(response.data, date);
                    selectTrains(trains, displayTrains, date);
                } else {
                    renderError(response.msg, false);
                }
            });
        });
}

function parseData(data, date) {
    var rows = $(data).find('.table-search-results tbody tr');
    var trains = [];
    $(rows).each(function(index, el) {

        var cells = $(el).find('td');

        var departureTime = cells[2].innerText.split('h');
        var arrivalTime = cells[3].innerText.split('h');
        var duration = cells[4].innerText;

        trains.push({
            departureTime: moment(date).hour(departureTime[0]).minute(departureTime[1]),
            arrivalTime: moment(date).hour(arrivalTime[0]).minute(arrivalTime[1]),
            duration: duration
        });
    });

    return trains;
}

function selectTrains(trains, callback, date) {
    var currentTime = moment(date).add(minimumTime, 'm'),
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
            getTrains(moment(date).add(1, 'd').startOf('day'));
            return;
        }

        callback(trainsToShow);

    });
}

function displayTrains(trains) {
    var currentTime = moment();

    $.each(trains, function(index, train) {
        var row = $('<tr>');
        var departureTd = $('<td>').append(train.departureTime.format('HH:mm'));
        var arrivalTd = $('<td>').append(train.arrivalTime.format('HH:mm'));
        var timeToDepartTd = $('<td>').append(train.departureTime.diff(currentTime, 'minutes') + ' min.');
        row.append(departureTd).append(arrivalTd).append(timeToDepartTd);
        $('#train-table table').append(row);
    });
    var img = $('<img>').attr('src', '../img/train.png').addClass('train');
    renderStatus('<b>' + origin + '</b> ' + img[0].outerHTML + ' <b>' + destination + '</b>');

    if (trains.length === 0) {
        renderError('Não existem comboios para este percurso!', false);
        return;
    }
    $('#loading').addClass('hide');
    $('.link').removeClass('hide');
    $('#train-table').removeClass('hide');
}

function clickHandler() {
    origin = $('#origin').val();
    destination = $('#destination').val();

    if (checkStations(origin, destination)) {
        chrome.storage.sync.set({
            origin: origin,
            destination: destination,
            nrOccurrences: "5",
            started: "true",
        }, function() {
            $('#initial-content').remove();
            $('#loading').removeClass('hide');
            getTrains(moment());
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    init();
});