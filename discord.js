const WebSocket = require('ws') //Actually sends the requests to minecraft, and recieves them
const uuid = require('uuid') //All web requests sent to minecraft need a request id. This will generate uuids.
const Discord = require('discord.js'); //Allows connection to discord
const client = new Discord.Client(); //I should know what this does - it creates a client that can be reffered to later? Idk lol

const port = 8080 //Probably no need to change this
const botToken = 'OTQ5ODQzNjc2MzA4MzI0Mzky.YiQQ2w.j2K-O-lRTQQxZi3qi9x_muKvhRs' //Put your discord bot token here
const channelId = '949859599169773668' //Put your channel id here
const ipAddress = '<ip>' //This is pointless other than for console messages

console.log(`Ready. In Minecraft chat, type /connect ${ipAddress}:${port}`)
const wss = new WebSocket.Server({ port: 20995 })

var globalSocket

wss.on('connection', socket => {
  console.log('Connected to Minecraft!') //Just lets us know we've connected
  globalSocket = socket //Allows us to refer to the socket outwith this function

  //This chunk of code asks minecraft to send all messages to us - we are "Subscribing" to the "PlayerMessage" event
  socket.send(JSON.stringify({
    "header": {
      "version": 1,
      "requestId": uuid.v4(),
      "messageType": "commandRequest",
      "messagePurpose": "subscribe"
    },
    "body": {
      "eventName": "PlayerMessage"
    },
  }))

  //When we get a message,
  socket.on('message', packet => {
    const msg = JSON.parse(packet) //Parse the JSON

    //When in doubt, try catch. I think this was a lazy way to solve a crash when it first connects or something, can't remember lol
    try{
      //Uhhhhh not sure on this one lol - I guess it stops us recieving our own messages? This is what I get for trying to comment code I wrote a year ago lol
      if(msg.body.properties.Sender != 'External'){
        //Send a message to the channel specified

        const sender = msg.body.properties.Sender;
        const message = msg.body.properties.Message;

        client.channels.cache.get(channelId).send(`${sender}: ${message}`)
      }
    }
    catch{}
  })
})

function send(text) {
  //Runs the say command, e.g. "say Steve: Hello"
  cmd = 'say ' + text

  //Prepare the data we're going to send to minecraft
  const msg = JSON.stringify({
    "header": {
      "version": 1,
      "requestId": uuid.v4(),
      "messagePurpose": "commandRequest",
      "messageType": "commandRequest"
    },
    "body": {
      "version": 1,
      "commandLine": cmd,
      "origin": {
        "type": "player"
      }
    }
  })

  //Send the command to minecraft
  try{
    globalSocket.send(msg)
  }
  catch{
    console.log("Failed to send message to minecraft. Are you logged in?")
  }
}

//Lets us know we've logged in
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//When a message is sent on discord
client.on('message', msg => {
  if(msg.channel.id != channelId) //Check we're in the right channel
    return;

  if(msg.author.bot) //Check its not a bot that sent the message (causes an endless loop)
    return;

  const sender = msg.member.displayName
  const message =  msg.content;
  send(`${sender}: ${message}`); //Send message to minecraft
});

//"Sign in" to discord
try{
  client.login(botToken)
}
catch{
  console.log("Failed to sign into discord. Is the bot token correct?")
}
