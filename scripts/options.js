// Saves options to chrome.storage
function saveOptions() {
    var origin = $('#origin').val();
    var destination = $('#destination').val();
    var nrOccurrences = $('#nrOccurrences').val();
    var minimumTime = $('#minTime').val();

    if (checkNumbers(nrOccurrences, minimumTime) && checkStations(origin, destination)) {
        chrome.storage.sync.set({
            origin: origin,
            destination: destination,
            nrOccurrences: nrOccurrences,
            minimumTime: minimumTime,
            started: "true"
        }, function() {
            // Update status to let user know options were saved.
            renderSuccess('Alterações efectuadas com sucesso!', true);
        });
    }
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {

    chrome.storage.sync.get({
            origin: '',
            destination: '',
            nrOccurrences: '5',
            minimumTime: '0',
            appVersion: '0'
        },
        function(items) {
            buildSelects();
            $('#origin').val(items.origin);
            $('#destination').val(items.destination);
            $('#nrOccurrences').val(items.nrOccurrences);
            $('#minTime').val(items.minimumTime);
            $('#save').removeAttr('disabled');
        });
}

function checkNumbers(nrOccurrences, minimumTime) {

    if (isNaN(parseInt(nrOccurrences)) || nrOccurrences === '' || isNaN(parseInt(minimumTime)) || minimumTime === '') {

        renderError('Por favor insira um número válido!', true);

        return false;
    }

    if (nrOccurrences > 10) {
        renderError('Por favor escolha um número entre 0 e 10!', true);
        return false;
    }

    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    $('#save').on('click', saveOptions);
});