var origin, destination;

function init() {
    chrome.storage.sync.get('started', function(item) {
        if (item.started) {
            $('#initial-content').remove();
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
            $('.link').removeClass('hide');

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
                    renderError(response.msg, false);
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

function selectTrains(trains, callback, trainsToShow) {
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
            var nrTrainsToAdd = (occurrences - trainsToShow.length);

            //builds an array with the missing trains to be processed
            var toAdd = trains.slice(0, nrTrainsToAdd);

            $.each(toAdd, function(index, train) {
                train.departureTime.add(1, 'd');
                trainsToShow.push(train);
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
    var img = $('<img>').attr('src', '../img/train.png').addClass('train');
    renderStatus('<b>' + origin + '</b> ' + img[0].outerHTML + ' <b>' + destination + '</b>');

    if (trains.length === 0) {
        renderError('Não existem comboios para este percurso!', false);
        return;
    }

    $('#train-table').removeClass('hide');
}

function clickHandler() {
    origin = $('#origin').val();
    destination = $('#destination').val();

    if (origin !== '' && destination !== '') {
        chrome.storage.sync.set({
            origin: origin,
            destination: destination,
            started: "true",
        }, function() {
            $('#initial-content').remove();
            $('.link').removeClass('hide');
            getTrain();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    init();
});