const mysql = require('mysql');
const cors = require('cors');
const express = require('express');
const axios = require("axios");
const rateLimit = require('axios-rate-limit');
const {response} = require("express");
const app = express();
app.use(express.json());
app.use(cors());

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "usbw",
    database: "lastfmscraper",
});

class lastfm_user {
    constructor(response) {
        this.name = response.name;
        this.country = response.country;
        this.registered = new Date(response.registered.unixtime * 1000);
        this.playcount = response.playcount;
        this.artist_count = response.artist_count;
        this.album_count = response.album_count;
        this.track_count = response.track_count;
        this.subscriber = parseInt(response.subscriber);
    }
}

connection.connect(function(err){
    if (err) throw err;
    console.log(`Connected to database`);
    apiIteration();
});

const api = rateLimit(axios.create(), {
    maxRequests: 10, // Limit to one request per second
    perMilliseconds: 50 // 1000 milliseconds = 1 second
});

let currentUser = "rj"
let numberOfUsersInDB;

async function apiIteration() {
    connection.query(`SELECT COUNT(name) FROM users`, (err, result) => {
        if (err) throw err;
        numberOfUsersInDB = result[0]['COUNT(name)'];
    })

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
    api.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${user.name}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json`)
        .then(function (response){
            const user = new lastfm_user(response.data.user)

            connection.query(`SELECT * FROM users WHERE name = "${user.name}"`, (err, result) => {
                if (err) throw err;

                if (result.length === 0){
                    connection.query(`INSERT INTO users (name, country, registered, playcount, artist_count, album_count, track_count, subscriber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [user.name, user.country, user.registered, user.playcount, user.artist_count, user.album_count, user.track_count, user.subscriber], (err) => {
                        if (err) throw err;
                        console.log(`[${numberOfUsersInDB   }] Successfully inserted "${user.name}" into database`)
                        numberOfUsersInDB++
                    });
                } else {
                    // Skip duplicate user
                }
            });
        })
        .catch(function (error) {
            if(error.response.data.error !== 6)
                console.log(`${error.name}: ${error.code}\n${error.message}`);
        });
}

//Run server on localhost at port 3000
app.listen(8000, () => {
    console.log('Server running at http://localhost:8000');
});