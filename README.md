
## Real-time messaging service

Hello!

This project is based on building a real time messaging app similar in spirit to Slack.
I have used python for the backend and Javascript for the front end, Socket.IO 
to establish communication between the clients and server. 'application.py' file
consists the server side code for the application. This app contains two HTML files
login.html
index.html
The JavaScript code for the index.html file is located inside the 'static' folder with the name
'index.js'.
Users can login to the website using a display name which is remembered even if the user closes the
page and returns to it later. Then any user can create a channel(chatroom) in which users can join 
and send messages. Each message is associated with the user and the timestamp of the message. This 
message instantly appears for all users in the same channel without needing to reload the page.
The channel that the user is on is stored in the local storage and hence user
will be taken to the channel he was on when he closed the page if he returns to it later. 
A maximum of 100 messages per channel are stored in the server side memory.

Finally as a personal touch, I have included the 'delete message' feature. A user can click on
the 'delete message' button next to the message which he sent and erase the message from the server's
memory as well as the memory of all other clients. The deleted message is replaced with the text
"This message was deleted".
