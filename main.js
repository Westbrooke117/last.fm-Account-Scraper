const { appendFileSync } = require("fs")
const axios = require("axios");
const rateLimit = require('axios-rate-limit');

class User {
    constructor(response) {
        this.name = response.name;
        this.country = response.country;
        this.registered = convertDateToYearMonthDay(response.registered.unixtime*1000)
        this.playcount = response.playcount;
        this.artist_count = response.artist_count;
        this.album_count = response.album_count;
        this.track_count = response.track_count;
        this.subscriber = parseInt(response.subscriber);
    }
    saveAsCSV() {
        const csv = `${this.name},${this.country},${this.registered},${this.playcount},${this.artist_count},${this.album_count},${this.track_count},${this.subscriber}\n`;
        try {
            appendFileSync("scraped_data.csv", csv);
        } catch (err) {
            console.error(err);
        }
    }
}

const api = rateLimit(axios.create(), {
    maxRequests: 10, // Limit to one request per second
    perMilliseconds: 50 // 1000 milliseconds = 1 second
});

const apiKey = "82d112e473f59ade0157abe4a47d4eb5"

let currentUser = "rj"
apiIteration();

async function apiIteration() {
    let stack = [currentUser];
    let completedUsers = [currentUser];

    while(stack.length !== 0){
        currentUser = stack.shift();
        try {
            const response = await api.get(`https://ws.audioscrobbler.com/2.0/?method=user.getfriends&user=${currentUser}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json`);
            const friendCount = response.data.friends.user.length;
            for (let i = 0; i < friendCount; i++) {
                let friend = response.data.friends.user[i];

                if(!completedUsers.some(s=>s===friend.name)){
                    completedUsers.push(friend.name);
                    stack.push(friend.name)
                    await userGetInfo(friend);
                }
            }
        } catch (error) {
            if(error.response.data.error !== 6) {
                console.log(`${error.name}: ${error.code}\n${error.message}`);
                return;
            }
        }
    }
    console.log("We did it!")
}

function userGetInfo(user){
    api.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${user.name}&api_key=${apiKey}&format=json`)
        .then(function (response){
            const user = new User(response.data.user)
            user.saveAsCSV()
            console.log(`Successfully inserted "${user.name}"`)
        })
        .catch(function (error) {
            if(error.response.data.error !== 6)
                console.log(`${error.name}: ${error.code}\n${error.message}`);
        });
}

function convertDateToYearMonthDay(unix){
    const date = new Date(unix);

    const year = date.toLocaleString("default", { year: "numeric" });
    const month = date.toLocaleString("default", { month: "2-digit" });
    const day = date.toLocaleString("default", { day: "2-digit" });

    return year + "-" + month + "-" + day;
}