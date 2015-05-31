chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {

    switch (msg.type) {
        case 'callService':
            callService(msg, sendResponse);
            break;
        default:
            sendResponse({
                success: false,
                msg: 'there is no handler for ' + msg.type + ' type!'
            });
            break;
    }

    return true;

});

function callService(msg, sendResponse) {
    var url = "http://www.cp.pt/sites/passageiros/pt/consultar-horarios/horarios-resultado";
    var origin = msg.origin;
    var destination = msg.destination;
    var date = msg.date;
    $.ajax({
            method: 'POST',
            url: url,
            data: {
                depart: origin,
                arrival: destination,
                departDate: date
            }
        })
        .success(function(data) {
            var response = {
                success: true,
                msg: 'Pedido efectuado com sucesso! Aguarde...',
                data: data
            };

            sendResponse(response);
        })
        .error(function(err) {
            var response = {
                success: false,
                msg: 'error occurred fetching data: ' + err,
            };

            sendResponse(response);
        });
}