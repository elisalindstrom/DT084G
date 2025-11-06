"use strict";

// Inväntar att webbsidan laddas, sedan kör funktionen init
window.onload = init;

// Anropa fetchChannels
function init() {
    fetchChannels();
}

// Antal kanaler som visas i listan från början (global, används i flera funktioner)
let displayedChannels = 15;

// Hämta data för samtliga kanaler
function fetchChannels() {
    // Anrop av webbtjänst
    fetch("https://api.sr.se/api/v2/channels?format=JSON&indent=true&size=52")
        .then(response => response.json()) // konverterar JSON till JS objekt
        .then(data => { // Skickar data till tre funktioner:
            listChannels(data.channels); // Funktion kopplad till kanallistan
            displaySelectMenu(data.channels); // Funktion kopplad till radiospelaren
            changeNumRows(data.channels); // Funktion som ändrar antal kanaler i kanallistan
        })
        .catch(error => console.log(error)); // För att kontrollera error
}

// KANALLISTA

// Ta emot data och skriv ut kanallista
function listChannels(channels) {
    const channelList = document.querySelector("#mainnavlist");
    channelList.innerHTML = ""; // Rensar kanallistan varje gång funktionen körs (så ej upprepning av kanaler i listan)

    /* Loop som körs så länge som i är mindre än både displayedChannels(antal kanaler som ska visas) & channels.length(antal kanaler i hämtad data).
    Båda villkoren behöver vara uppfyllda. Loopen startar på 0, i motsvarar index i arrayen(channels från hämtad data), i ökar med 1 varje gång loopen körs.
    Hade först en forEach loop men i och med numrows behöve jag styra hur länge loopen skulle köras */
    for (let i = 0; i < displayedChannels && i < channels.length; i++) {
        let channel = channels[i] // Variabel för kanal från arrayen
        let channelId = channel.id // Variabel för kanal-id från channel

        // Skapa li-element för utskrift av kanal
        const liEl = document.createElement("li")
        liEl.textContent = channel.name;
        liEl.title = channel.tagline;
        channelList.appendChild(liEl)

        // Vid klick skicka vald kanals id till funktionen för att hämta tablå
        liEl.addEventListener("click", () => {
            fetchProgram(channelId);
        });
    }
}

// Funktion för att justera antal kanaler som visas i kanallista
function changeNumRows(channels) {
    let input = document.querySelector("#numrows");
    input.value = 15; // Återgår till 15 kanaler i listan om sidan laddas om

    // Vid input i numrows ändra displayedChannels till det nya värdet
    input.addEventListener("input", () => {
        if (input.value) { // Ändrar endast kanallistan om något värde skrivs in (ej om input lämnas tomt)
            displayedChannels = input.value; // Ändrar antalet kanaler i listan till det nya värdet
        }
        listChannels(channels); /* Anropa funktionen som uppdaterar kanallistan. Hade först fetchChannels här som anrop men det blev fel
        om man lyssnade på radio och sen försökte ändra kanaler som visades då den hela tiden uppdaterade menyn med kanaler för radiospelaren (displaySelectMenu)
        + blev onödigt att hämta data på nytt varje gång */
    });
}

// RADIOSPELARE

// Lista för kanaler - radiospelare
function displaySelectMenu(channels) {
    const playChannel = document.querySelector("#playchannel");
    const playBtn = document.querySelector("#playbutton");
    playChannel.innerHTML = ""; // Rensar listan varje gång funktionen körs (hindra upprepning i listan)

    // För varje kanal i listan skriv ut kanalnamn
    channels.forEach(channel => {
        playChannel.innerHTML += `<option>${channel.name}</option>`
    });

    // Vid klick på knapp kör funktionen playRadio
    playBtn.addEventListener("click", () => {
        let channelName = playChannel.value // Variabel för kanalnamn i listan
        playRadio(channelName, channels) // Skicka med channelName + channels till funktionen som spelar radion
    });
}

// Ta emot channelName och samtliga channels från data och spela vald kanal
function playRadio(channelName, channels) {
    const radioPlayer = document.querySelector("#radioplayer")

    // Loop för att gå igenom varje kanal från data
    channels.forEach(channel => {
        if (channel.name === channelName) { // Kontrollerar om channel name i data är detsamma som kanalnamn i listan (true)
            let radioUrl = channel.liveaudio.url; // Hämta url under liveaudio i data
            radioPlayer.innerHTML = `<audio controls autoplay>
                <source src="${radioUrl}" type="audio/mpeg"></audio>`; // Radiospelare som spelar det kanalnamn som valts
        }
    });
}

// TABLÅ

// Hämta program för varje enskild kanal
function fetchProgram(channelId) {
    let url = "https://api.sr.se/api/v2/scheduledepisodes?channelid=" + channelId + "&format=JSON&indent=true&size=200"

    // Hämtar programtablån som ska visas
    fetch(url)
        .then(response => response.json())
        .then(data => displayProgram(data.schedule)) // Skicka schedule till funktionen för utskrift av tablå
        .catch(error => console.log(error)); // För att kontrollera error
}

// Utskrift av tablå
function displayProgram(schedule) {
    const programList = document.querySelector("#info");
    programList.innerHTML = ""; // Rensa utskriven tablå varje gång funktionen körs

    // Nuvarande tid i millisekunder (att använda för jämförelse mot programmets starttid)
    let currentTime = new Date();
    let currentTimeMilli = currentTime.getTime();

    // Loopa igenom schedule, för varje episod:
    schedule.forEach(episode => {
        // Få ut start + sluttid för program
        let startTime = episode.starttimeutc
        startTime = parseInt(startTime.slice(6, -2)); // Ta bort 6 tecken i början och 2 tecken i slutet av starttiden i millisekunder
        let startTimeDate = new Date(startTime);

        let endTime = episode.endtimeutc
        endTime = parseInt(endTime.slice(6, -2));
        let endTimeDate = new Date(endTime);

        // Omformatera datumobjekt för utskrift. toString för att göra om datumobjekt till textsträng. padStart för att lägga till 0 fram till minut/timme har 2 siffror
        let startHours = startTimeDate.getHours().toString().padStart(2, "0");
        let startMinutes = startTimeDate.getMinutes().toString().padStart(2, "0");
        let endHours = endTimeDate.getHours().toString().padStart(2, "0");
        let endMinutes = endTimeDate.getMinutes().toString().padStart(2, "0");

        // Article
        const article = document.createElement("article");

        // Överskrift
        const title = document.createElement("h3");
        let titleText = document.createTextNode(episode.title);
        title.appendChild(titleText);

        // Undertitel
        const subtitle = document.createElement("h4");
        let subtitleText = document.createTextNode(episode.subtitle);
        subtitle.appendChild(subtitleText);

        // Start & sluttid
        const time = document.createElement("h5");
        let timeText = document.createTextNode(`${startHours}:${startMinutes} - ${endHours}:${endMinutes}`);
        time.appendChild(timeText);

        // Beskrivning
        const paragraph = document.createElement("p");
        let paragraphText = document.createTextNode(episode.description);
        paragraph.appendChild(paragraphText);

        // Ordningen för utskrift (article hamnar under programList(info), efterföljande element under article)
        if (startTime > currentTimeMilli) {
            programList.appendChild(article);
            article.appendChild(title);
            if (episode.subtitle) {
                article.appendChild(subtitle);
            }
            article.appendChild(time);
            article.appendChild(paragraph);
        }
    });
}