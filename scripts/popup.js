var origin, destination;

function init() {
    chrome.storage.sync.get('started', function(item) {
        if (item.started) {
            $('#initial-content').remove();
            $('.link').removeClass('hide');
            getTrain();
        } else {
            $('#initial-content').removeClass('hide');
            buildSelects();
            $('#save').click(clickHandler);
        }
    })
}

function getTrain() {
    chrome.storage.sync.get({
            origin: 'Entrecampos',
            destination: 'Benfica',
            minimumTime: '0'
        },
        function(items) {
            origin = items.origin;
            destination = items.destination;
            minimumTime = parseInt(items.minimumTime);

            renderStatus('A pesquisar partidas de <b>' + origin + '</b> para <b>' + destination + '</b>');

            chrome.runtime.sendMessage({
                type: 'callService',
                origin: origin,
                destination: destination,
                date: moment().format('YYYY-MM-DD')
            }, function(response) {

                if (response.success) {
                    renderStatus(response.msg);
                    var trains = parseData(response.data);
                    selectTrains(trains, displayTrains);
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

function selectTrains(trains, callback) {
    var currentTime = moment().add(minimumTime, 'm'),
        trainsToShow = [],
        found = false;

    chrome.storage.sync.get({
        nrOccurrences: '1',
    }, function(item) {
        var occurrences = parseInt(item.nrOccurrences);


        $.each(trains, function(index, train) {
            if (train.departureTime.isAfter(currentTime)) {
                trainsToShow.push(train);
                if (trainsToShow.length === occurrences) {
                    found = true;
                    return false;
                }
            }
        });

        if (!found && trains.length > 0) {

            $.each(trains, function(index, train) {

                if (trainsToShow.length < occurrences) {

                    train.departureTime.add(1, 'd');
                    trainsToShow.push(train);

                } else {
                    found = true;
                    return false;
                }

            });
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
        var timeToDepartTd = $('<td>').append(train.departureTime.diff(currentTime, 'minutes') + 'min.');
        row.append(departureTd).append(arrivalTd).append(timeToDepartTd);
        $('#train-table table').append(row);
    });

    renderStatus('<b>' + origin + '</b> -> <b>' + destination + '</b>');

    if (trains.length === 0) {
        renderError('Não existem comboios para este percurso!');
        return;
    }

    $('#train-table').removeClass('hide');
}

function renderStatus(statusText) {
    $('#status').html(statusText);
}

function renderError(errorText) {
    $('#error').html(errorText);
}

function clickHandler() {
    origin = $('#origin').val();
    destination = $('#destination').val();

    if (origin !== '' && destination !== '') {
        chrome.storage.sync.set({
            origin: origin,
            destination: destination,
            started: "true"
        }, function() {
            $('#initial-content').remove();
            $('.link').removeClass('hide');
            getTrain();
        });
    }
}

/////////////////////////// TO BE REMOVED ///////////////////////////

function buildSelects() {
    var stations = $.getJSON('../stations.json', function(data) {
        $.each(data.stations, function(key, value) {
            var upperCased = value.replace(/\b\w/g, capitalize);
            $('#origin').append($('<option>', {
                    value: upperCased
                })
                .text(upperCased));

            $('#destination').append($('<option>', {
                    value: upperCased
                })
                .text(upperCased));
        });

    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/////////////////////////// TO BE REMOVED ///////////////////////////

document.addEventListener('DOMContentLoaded', function() {
    init();
});