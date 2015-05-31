// Saves options to chrome.storage
function save_options() {

    var origin = $('#origin').val();
    var destination = $('#destination').val();

    chrome.storage.sync.set({
        origin: origin,
        destination: destination
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
            destination: 'Benfica'
        },
        function(items) {
            $('#origin').val(items.origin);
            $('#destination').val(items.destination);
            $('#save').removeAttr('disabled');
        });
}

document.addEventListener('DOMContentLoaded', function() {
    restore_options();
    $('#save').on('click', save_options);
});