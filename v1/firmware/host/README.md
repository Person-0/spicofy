# Firmware (Host Part)

This is made with TypeScipt & NodeJS so ensure you have NodeJS, npm installed.<br><br>
To run the host part, first create an application on the [Spotify Dev Dashboard](https://developer.spotify.com/dashboard) and get the credentials. Ensure you checked the `Web API` checkbox from the *Which API/SDKs are you planning to use?* question.<br>
After that, Plug the MCU into the PC and

- open terminal, cd into this directory.
- create a `.env` file with the following content:
```dotenv
### spotify app creds
clientId = "<SPOTIFY APP CLIENT ID>"
clientSecret = "<SPOTIFY APP CLIENT SECRET>"

# make sure you have added this redirect uri in the dashboard too
redirectURI = "http://127.0.0.1:8192/callback"

### misc setts
# num times to search for serial ports to find the MCU connection
maxPortSearchTries = 5
# time intervals in which the search happens
portSearchPollTimeMS = 1000
```
- `npm i` to install dependencies.
- `npm start` to run the program.