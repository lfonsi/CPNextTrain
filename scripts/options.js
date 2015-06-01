// Saves options to chrome.storage
function save_options() {

    var origin = $('#origin').val();
    var destination = $('#destination').val();
    var nrOccurrences = $('#nrOccurrences').val();
    if (isNaN(parseInt(nrOccurrences)) || nrOccurrences === '') {
        $('#option-status').css('color','#FF0000');
        $('#option-status').text('Por favor insira um número válido!');
        
        setTimeout(function() {
            $('#option-status').empty();
            $('#option-status').css('color','#00FF00');
        }, 750);

        return false;
    }

    chrome.storage.sync.set({
        origin: origin,
        destination: destination,
        nrOccurrences: nrOccurrences
    }, function() {

        // Update status to let user know options were saved.
        $('#option-status').text('Alterações efectuadas com sucesso!');

        setTimeout(function() {
            $('#option-status').empty();
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

    chrome.storage.sync.get({
            origin: 'Entrecampos',
            destination: 'Benfica',
            nrOccurrences: '1'
        },
        function(items) {
            $('#origin').val(items.origin);
            $('#destination').val(items.destination);
            $('#nrOccurrences').val(items.nrOccurrences);
            $('#save').removeAttr('disabled');
        });
}

document.addEventListener('DOMContentLoaded', function() {
    restore_options();
    $('#save').on('click', save_options);
});