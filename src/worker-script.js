let sequence = 0;


console.log(
    "WORKER_STARTED"
);


function sendHeartbeat() {

    sequence++;


    console.log(
        JSON.stringify({
            sequence,
            time:
                new Date().toISOString()
        })
    );
}


sendHeartbeat();


setInterval(
    sendHeartbeat,
    2000
);