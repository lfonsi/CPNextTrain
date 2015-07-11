function buildSelects() {
        $.each(stations.cp, function(key, value) {
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
}

function renderError(msg, callback) {
    $('#error-container').html(msg);
    $('#error-container').removeClass('hide');
    
    if(callback){
        callback();
    }

}

function renderSuccess(msg, callback) {
    $('#success-container').html(msg);
    $('#success-container').removeClass('hide');
    
    if(callback){
        callback();
    }
}

function renderStatus(msg) {
    $('#status-container').html(msg);
    $('#status-container').removeClass('hide');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function checkStations(origin, destination) {

    var msg;

    if (origin === destination) {
        msg = 'Por favor indique estações distintas!';
        renderError(msg, true);
        return false;
    }

    if (!origin || !destination) {
        msg = 'Por favor indique um valor válido para as estações!';
        renderError(msg, true);
        return false;
    }

    return true;
}

function pad(value){
    return value < 10 ? '0'+value : value;
}