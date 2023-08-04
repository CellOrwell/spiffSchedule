// Gets us the day in Winnipeg, might not be needed, we'll see

const options = {
    timeZone: "America/Winnipeg",
    year: "numeric",
    month: "numeric",
    day: "numeric",
}

const date = new Date().toLocaleString("en-GB", options);

// Functions to get start and end of a week, for the API

function getWeekStart(date) {
    const dateParts = date.split('/')
    const tempDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    tempDate.setUTCMilliseconds(tempDate.getUTCMilliseconds() - (86400000 * (tempDate.getDay() - 1)))
    return tempDate;
}

function getWeekEnd(date) {
    const dateParts = date.split('/')
    const tempDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    tempDate.setUTCMilliseconds(tempDate.getUTCMilliseconds() + (86400000 * (7 - tempDate.getDay())))
    return tempDate;
}

// API work

let streamArray = [];

function getToken() {
    fetch(urlToken, tokenOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error(response.status + ' Network response not ok.');
            }
            return response.json();
        })
        .then((data) => {
            console.log("POST request success!", data);
            localStorage.setItem('accessToken', data.access_token);
        })
        .catch((error) => {
            console.error('Error making POST request: ', error);
            return;
        });
}

function validateToken() {
    fetch(validToken, validateOptions)
        .then((response) => {
            if (!response.ok && response.status != 401) {
                throw new Error(response.status + ' Network response not ok.');
            }
            return response.json();
        })
        .then((data) => {
            console.log("GET request success!", data);
            if(data.hasOwnProperty('status'))
            {
                getToken();
            }
        })
        .catch((error) => {
            console.error('Error making GET request: ', error);
        });
}

function getId(name) {
    const url = mainUrl + "/users?login=" + name;

    fetch(url, getOptions)
        .then((response) => {
            if(!response.ok) {
                throw new Error(response.status + ' Error in HTTP Request');
            }
            return response.json();
        })
        .then((data => {
            console.log("GET Request Success!", data.data[0]);
            sessionStorage.setItem('spiffId', data.data[0].id);
        }))
        .catch((error) => {
            console.error('Error making GET Request: ', error);
        })
}

function getSchedule() {
    const url = mainUrl + "/schedule?broadcaster_id=" + sessionStorage.getItem('spiffId')+"&start_time="+getWeekStart(date).toISOString();

    fetch(url, getOptions)
        .then((response) => {
            if(!response.ok) {
                throw new Error(response.status + ' Error in HTTP Request');
            }
            return response.json();
        })
        .then((data) => {
            console.log("GET Request Success!", data.data.segments);
            sessionStorage.setItem('scheduleArray', JSON.stringify(data.data.segments));
        })
        .catch((error) => {
            console.error('Error making GET Request: ', error);
        } )
}

validateToken();
getId("AstralSpiff");
getSchedule();

streamArray = JSON.parse(sessionStorage.getItem('scheduleArray'));

var printHTML = null;

for (const streamScheduled of streamArray) {
    console.log(streamScheduled.title);
    printHTML += `<p>${streamScheduled.title}</p>`;
}

document.body.innerHTML = printHTML;