var origin, destination;

function init() {
    chrome.storage.sync.get('started', function(item) {
        if (item.started) {
            $('#initial-content').remove();
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

            chrome.runtime.sendMessage({
                type: 'callService',
                origin: origin,
                destination: destination,
                minimumTime: parseInt(items.minimumTime),
                date: date
            }, function(response) {

                if (response.success) {
                    displayTrains(response.trains);
                    
                } else {
                    renderError(response.msg, function() {
                        
                        $('#loading').addClass('hide');
                        var cssLink = $("<link rel='stylesheet' type='text/css' href='libs/bootstrap/css/bootstrap.min.css'>");
                        $("head").append(cssLink);
                        
                    });

                    console.log(response.err);
                }
            });
        });
}

function displayTrains(trains) {
    var currentTime = moment();

    $.each(trains, function(index, train) {
        var row = $('<tr>');
        var departureTd = $('<td>').append(moment(train.departureTime).format('HH:mm'));
        var arrivalTd = $('<td>').append(moment(train.arrivalTime).format('HH:mm'));
        var timeToDepartTd = $('<td>').append(calculateTime(moment(train.departureTime).diff(currentTime, 'minutes')));
        row.append(departureTd).append(arrivalTd).append(timeToDepartTd);
        $('#train-table table').append(row);
    });
    var img = $('<img>').attr('src', '../img/train.png').addClass('train');
    renderStatus('<b>' + origin + '</b> ' + img[0].outerHTML + ' <b>' + destination + '</b>');

    if (trains.length === 0) {
        renderError('Não existem comboios para este percurso!');
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

function calculateTime(time) {
    if (time < 60) {
        return time + 'min';
    }
    var hours = pad(parseInt(time / 60));
    var minutes = pad(time % 60);

    return hours + 'h' + minutes + 'min';
}

document.addEventListener('DOMContentLoaded', function() {
    init();
});