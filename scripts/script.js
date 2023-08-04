// Gets us the day in Winnipeg, might not be needed, we'll see

// const options = {
//     timeZone: "America/Winnipeg",
//     year: "numeric",
//     month: "numeric",
//     day: "numeric",
// }

const date = new Date();
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


// DateTime Timezones

function getWeekStart(date) {
    const tempDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let dayShift = 0;
    if(tempDate.getDay() == 0)
    {
        dayShift = 6;
    }
    else
    {
        dayShift = tempDate.getDay() - 1;
    }

    tempDate.setUTCMilliseconds(tempDate.getUTCMilliseconds() - (86400000 * (dayShift)));
    return tempDate;
}

// function getWeekEnd(date) {
//     const dateParts = date.split('/')
//     const tempDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
//     tempDate.setUTCMilliseconds(tempDate.getUTCMilliseconds() + (86400000 * (7 - tempDate.getDay())))
//     return tempDate;
// }

function getWeekEnd(date) {
    const tempDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let dayShift = 0;
    if(tempDate.getDay() == 0)
    {
        dayShift = 7;
    }
    else
    {
        dayShift = 7 - tempDate.getDay() + 1;
    }

    tempDate.setUTCMilliseconds(tempDate.getUTCMilliseconds() + (86400000 * (dayShift)));
    tempDate.setUTCHours(23);
    tempDate.setMinutes(59);
    tempDate.setSeconds(59);
    tempDate.setMilliseconds(999);
    return tempDate;
}

console.log(getWeekEnd(date).toISOString());

function getTwelveTime(date) {
    let hr = date.getHours() - 7;
    let hrStr = null;

    if(hr == 0)
    {
        hrStr = "12am";
    }
    else if(hr == 12)
    {
        hrStr = "12pm";
    }
    else if(hr > 12) {
        hr -= 12;
        hrStr = `${hr}pm`;
    }
    else
    {
        hrStr = `${hr}am`;
    }
    return hrStr;
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
    validateToken();
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
    validateToken();
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

getId("AstralSpiff");
getSchedule();


// General Stuff

streamArray = JSON.parse(sessionStorage.getItem('scheduleArray'));

var printHTML = "";
var streamDate = null;

for (const streamScheduled of streamArray) {
    streamDate = new Date(streamScheduled.start_time);
    // if(streamDate.getUTCMilliseconds > )
    const streamName = sortStreamName(streamScheduled.title);
    const streamDay = days[streamDate.getDay()];
    const streamMonth = months[streamDate.getMonth()];
    const streamDayNum = streamDate.getDate();
    const streamTime = getTwelveTime(streamDate);
    const textColor = getColor();
    printHTML += `
    <div class="schedule_box">
        <p class="schedule_box--side_date">${streamMonth} ${streamDayNum}</p>
        <div class="schedule_box--main_text">
            <p class="schedule_box--date_time">${streamDay}: ${streamTime}</p>
            <p class="schedule_box--stream_title" style="color:${textColor}">${streamName}</p>
        </div>
    </div>  `;
}

console.log(printHTML);

const overlay = document.getElementsByClassName("overlay");

overlay[0].innerHTML = printHTML;

function getColor() {
    const rootStyle = getComputedStyle(document.documentElement);
    const colors = rootStyle.getPropertyValue("--colors").split(', ');

    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    return chosenColor;
}

function sortStreamName(name) {
    const char = name.charAt(0).toUpperCase();

    return char + name.slice(1);
}

console.log(getColor());