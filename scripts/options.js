// Saves options to chrome.storage
function saveOptions() {
    var origin = $('#origin').val();
    var destination = $('#destination').val();
    var nrOccurrences = $('#nrOccurrences').val();
    var minimumTime = $('#minTime').val();
    var notificationActive = $('#show-notification').is(':checked');
    var notificationTime = $('#notification-time').val();

    if (checkNumbers(nrOccurrences, minimumTime) && checkStations(origin, destination) && checkTime(notificationTime)) {
        chrome.storage.sync.set({
            origin: origin,
            destination: destination,
            nrOccurrences: nrOccurrences,
            minimumTime: minimumTime,
            notificationAt: notificationTime,
            notificationActive: notificationActive,
            started: "true"
        }, function() {

            if (notificationActive) {

                chrome.alarms.create('notification_train', {
                    when: parseNotificationTime(notificationTime).valueOf(),
                    periodInMinutes: 24 * 60
                });

            } else {
                chrome.alarms.clear('notification_train');
                chrome.alarms.clear('notification_snooze');
            }

            // Update status to let user know options were saved.
            renderSuccess('Alterações efectuadas com sucesso!', function() {

                setTimeout(function() {
                    $('#success-container').addClass('hide');
                }, 1000);
            });
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
            notificationAt: '18:30',
            notificationActive: true,
            appVersion: '0'
        },
        function(items) {
            buildSelects();
            $('#origin').val(items.origin);
            $('#destination').val(items.destination);
            $('#nrOccurrences').val(items.nrOccurrences);
            $('#minTime').val(items.minimumTime);
            $('#notification-time').val(items.notificationAt);
            $('#show-notification').attr('checked', items.notificationActive);
            if (items.notificationActive) {
                $('div.notification-time').removeClass('hide');
            }
            $('#save').removeAttr('disabled');
        });
}

function checkNumbers(nrOccurrences, minimumTime) {

    if (isNaN(parseInt(nrOccurrences)) || nrOccurrences === '' || isNaN(parseInt(minimumTime)) || minimumTime === '') {

        renderError('Por favor insira um número válido!', function() {
            setTimeout(function() {
                $('#error-container').addClass('hide');
            }, 1000);
        });

        return false;
    }

    if (nrOccurrences < 0 || nrOccurrences > 20) {
        renderError('Por favor escolha um número entre 0 e 20!', function() {
            setTimeout(function() {
                $('#error-container').addClass('hide');
            }, 1000);
        });
        return false;
    }

    if (minimumTime < 0 || minimumTime > 100) {
        renderError('Por favor escolha um número entre 0 e 100!', function() {
            setTimeout(function() {
                $('#error-container').addClass('hide');
            }, 1000);
        });
        return false;
    }
    return true;
}

function checkTime(time) {
    if (time === '') {
        renderError('Por favor insira uma hora de notificação válida!', function() {
            setTimeout(function() {
                $('#error-container').addClass('hide');
            }, 1000);
        });
        return false;
    }
    return true;
}

function handleCheckboxClick() {
    if (this.checked) {
        $('div.notification-time').removeClass('hide');
        return true;
    }

    $('div.notification-time').addClass('hide');
}

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    $('#save').on('click', saveOptions);
    $('#show-notification').change(handleCheckboxClick);
});