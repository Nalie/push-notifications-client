// firebase_subscribe.js
firebase.initializeApp({
    messagingSenderId: '814368183829'
});

var bt_register = $('#subscribe');
var bt_delete = $('#delete');
var token = $('#token');

var info = $('#info');
var info_message = $('#info-message');

// браузер поддерживает уведомления
// вообще, эту проверку должна делать библиотека Firebase, но она этого не делает
if ('Notification' in window) {
    var messaging = firebase.messaging();

    // пользователь уже разрешил получение уведомлений
    // подписываем на уведомления если ещё не подписали
    if (Notification.permission === 'granted') {
        subscribe();
    }

    // по клику, запрашиваем у пользователя разрешение на уведомления
    // и подписываем его
    bt_register.on('click', function () {
        subscribe();
    });
    
    bt_delete.on('click', function() {
        // Delete Instance ID token.
        messaging.getToken()
            .then(function(currentToken) {
                messaging.deleteToken(currentToken)
                    .then(function() {
                        console.log('Token deleted');
                        // Once token is deleted update UI.
                        resetUI();
                    })
                    .catch(function(error) {
                        showError('Unable to delete token', error);
                    });
            })
            .catch(function(error) {
                showError('Error retrieving Instance ID token', error);
            });
    });

    // handle catch the notification on current page
    messaging.onMessage(function(payload) {
        console.log('Message received', payload);
        info.show();
        info_message
            .text('')
            .append('<strong>'+payload.notification.title+'</strong><br>')
            .append('<em>'+payload.notification.body+'</em>')
        ;

        // register fake ServiceWorker for show notification on mobile devices
        navigator.serviceWorker.register('/serviceworker/firebase-messaging-sw.js');
        Notification.requestPermission(function(permission) {
            if (permission === 'granted') {
                navigator.serviceWorker.ready.then(function(registration) {
                  // Copy data object to get parameters in the click handler
                  payload.data.data = JSON.parse(JSON.stringify(payload.data));

                  registration.showNotification(payload.data.title, payload.data);
                }).catch(function(error) {
                    // registration failed :(
                    showError('ServiceWorker registration failed', error);
                });
            }
        });
    });
}

function subscribe() {
    // запрашиваем разрешение на получение уведомлений
    messaging.requestPermission()
        .then(function () {
            // получаем ID устройства
            messaging.getToken()
                .then(function (currentToken) {
                    if (currentToken) {
                        console.log(currentToken);
                        updateUIForPushEnabled(currentToken);
                    } else {
                        console.warn('Не удалось получить токен.');
                    }
                })
                .catch(function (err) {
                    console.warn('При получении токена произошла ошибка.', err);
                });
    })
    .catch(function (err) {
        console.warn('Не удалось получить разрешение на показ уведомлений.', err);
    });
}

function updateUIForPushEnabled(currentToken) {
    console.log(currentToken);
    token.text(currentToken);
    bt_register.hide();
    bt_delete.show();
}

function resetUI() {
    token.text('');
    bt_register.show();
    bt_delete.hide();
    info.hide();
}
