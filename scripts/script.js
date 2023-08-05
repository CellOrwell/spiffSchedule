// Gets us the day in Winnipeg, might not be needed, we'll see

// const options = {
//     timeZone: "America/Winnipeg",
//     year: "numeric",
//     month: "numeric",
//     day: "numeric",
// }

let date = new Date();
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

function getWeekEnd(date) {
    const tempDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let dayShift = 0;
    if(tempDate.getDay() == 0)
    {
        dayShift = 0;
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

async function getSchedule() {
    const url = mainUrl + "/schedule?broadcaster_id=" + sessionStorage.getItem('spiffId')+"&start_time="+getWeekStart(date).toISOString();
    await validateToken();
    await fetch(url, getOptions)
            .then((response) => {
                if(!response.ok) {
                    throw new Error(response.status + ' Error in HTTP Request');
                }
                return response.json();
            })
            .then((data) => {
                const endOfWeek = getWeekEnd(date);
                let schedArray = [];
                // for(const scheduled in data.data.segments)
                // {
                //     if(Date.parse(scheduled.start_time) > endOfWeek.getUTCMilliseconds)
                //     {
                //         continue;
                //     }
                //     console.log(scheduled.title);
                //     schedArray.push({'title': scheduled.title, 'start_time': scheduled.starts_time});
                // }
                for (let i = 0; i < data.data.segments.length; i++)
                {
                    let scheduled = data.data.segments[i];
                    if(Date.parse(scheduled.start_time) <= endOfWeek.getTime())
                    {
                        schedArray.push({'title': scheduled.title, 'start_time': scheduled.start_time, 'game': scheduled.category.name});
                    }
                }
                console.log("GET Request Success!", schedArray);
                sessionStorage.setItem('scheduleArray', JSON.stringify(schedArray));
                schedArray = [];
            })
            .catch((error) => {
                console.log("I'm here!");
                throw new Error('Error making GET Request: ');
            } )
}

// General Stuff

const dateShow = document.getElementById("date_change--date");
const dateLeftArrow = document.getElementById("date_change--left_arrow");
const dateRightArrow = document.getElementById("date_change--right_arrow");
const dateSkipToday = document.getElementById("date_change--skip_today");

const overlay = document.getElementsByClassName("overlay");


function setSchedule() {
    overlay[0].innerHTML = "";
    streamArray = JSON.parse(sessionStorage.getItem('scheduleArray'));
    var printHTML = "";
    var streamDate = null;

    if(streamArray.length == 0)
    {
        noStreams();
        return;
    }

    for (const streamScheduled of streamArray) {
        streamDate = new Date(streamScheduled.start_time);
        const streamName = sortStreamName(streamScheduled.title);
        const gameName = streamScheduled.game;
        const streamDay = days[streamDate.getDay()];
        const streamMonth = months[streamDate.getMonth()];
        const streamDayNum = streamDate.getDate();
        const streamTime = getTwelveTime(streamDate);
        const titleColor = getColor();
        const gameColor = getColor();
        printHTML += `
        <div class="schedule_box">
            <p class="schedule_box--side_date">${streamMonth} ${streamDayNum}</p>
            <div class="schedule_box--main_text">
                <p class="schedule_box--date_time">${streamDay}: ${streamTime}</p>
                <hr />
                <p class="schedule_box--stream_title" style="color:${titleColor}">${streamName}</p>
                <hr />
                <p class="schedule_box--game_name" style="color:${gameColor}">${gameName}</p>
            </div>
        </div>  `;
    };
    console.log(printHTML);

    overlay[0].innerHTML = printHTML;
};

function getColor() {
    const rootStyle = getComputedStyle(document.documentElement);
    const colors = rootStyle.getPropertyValue("--colors").split(', ');

    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    return chosenColor;
}

function sortStreamName(name) {
    if(name == "")
    {
        return "No Title";
    }
    const char = name.charAt(0).toUpperCase();
    return char + name.slice(1);
}

window.onload = async function() {
    setLoad();
    dateShow.innerHTML = getWeekStart(date).toDateString();
    getId("AstralSpiff");
    await getSchedule();
    setSchedule();
    remLoad();
    console.log("Page Loaded Successfully");
}

let contLoad = true;

dateLeftArrow.onclick = async function() {
    contLoad = true;
    setLoad();
    date.setTime(date.getTime() - (86400000*7));
    dateShow.innerHTML = getWeekStart(date).toDateString();
    console.log(date);
    await getSchedule().catch((error) => {
        noStreams();
        contLoad = false;
    });
    if(contLoad) {setSchedule();}
    remLoad();
}

dateRightArrow.onclick = async function() {
    contLoad = true;
    setLoad();
    date.setTime(date.getTime() + (86400000*7));
    dateShow.innerHTML = getWeekStart(date).toDateString();
    console.log(date);
    await getSchedule().catch((error) => {
        noStreams();
        contLoad = false;
    });
    if(contLoad) {setSchedule();}
    remLoad();
}

dateSkipToday.onclick = async function() {
    contLoad = true;
    setLoad();
    date = new Date();
    dateShow.innerHTML = getWeekStart(date).toDateString();
    console.log(date);
    await getSchedule().catch((error) => {
        noStreams();
        contLoad = false;
    });
    if(contLoad) {setSchedule();}
    remLoad();
}

const loadOverlay = document.getElementById('load_overlay');

function setLoad() {
    loadOverlay.style.display = 'flex';
}

function remLoad() {
    loadOverlay.style.display = 'none';
}

function noStreams() {
    let printHTML = "<p id=\"schedule_box--error_msg\">Error Fetching Streams. The Schedule May Be Empty.</p>"
    overlay[0].innerHTML = printHTML;
    remLoad();
}

